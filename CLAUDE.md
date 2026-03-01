# Project: unic-portal

## Architecture
- **Backend**: Go REST API at `backend/` using **Gin** + **GORM** (PostgreSQL only)
  - Entry point: `cmd/api/main.go`
  - Structure: `internal/database/`, `internal/repository/`, `internal/server/`, `internal/types/`
  - Repository pattern with DAO interfaces, handler factories returning `gin.HandlerFunc`
  - Run: `cd backend && PGPASSWORD=... /usr/local/go/bin/go run ./cmd/api/`
- **Frontend**: React 19 + TypeScript + Vite at `frontend/`
  - **Routing**: React Router v7 (SPA mode, `createBrowserRouter`). Routes in `src/routes/`, layout in `root.tsx`
  - **Data fetching**: Axios (`src/lib/api.ts`) + SWR (`src/hooks/useResources.ts`)
  - **i18n**: i18next + react-i18next. Translations in `src/locales/{en,fr}/common.json`. Init in `src/lib/i18n.ts`
  - **Types**: Shared interfaces in `src/types/`
- **DB**: PostgreSQL on `localhost:5435`, user `vincent`, db `unic_db` (requires password via `PGPASSWORD` env var)
- **Stack mirrors**: [radiant-portal](https://github.com/radiant-network/radiant-portal)

## Key conventions
- **CSS variables**: Always use semantic CSS variables for colors (define in `index.css` `:root` + `.dark`, register in `@theme inline`). Example: `--table-header`, `--table-accent`. Never hardcode colors.
- **shadcn/ui**: New York style, Slate base color, CSS variables enabled. Config in `components.json`. Components go in `src/components/ui/`.
- **Cell components**: Reusable data cells in `src/components/ui/cells/` (TextCell, DateCell, NumberCell, EmptyCell, etc.). All handle null/empty with `<EmptyCell />` fallback.
- **Storybook**: v10, stories in `src/stories/`. Preview imports `index.css` for Tailwind.

## Gotchas
- **Node version**: Must use Node 22 via nvm (`source ~/.nvm/nvm.sh && nvm use 22`). Default system Node is v12 (too old).
- **Go binary**: At `/usr/local/go/bin/go`, not in PATH.
- **GORM timestamp scan**: Repository uses `db.Raw()` with `last_update::text` cast for backward-compatible string output. Alternative: use `*time.Time` in GORM model with `db.Find()`.
- **shadcn CLI path bug**: `npx shadcn@latest add` may create files at `@/components/ui/` (literal `@` dir) instead of `src/components/ui/`. Check and move if needed.
- **npm commands**: Must run from `frontend/` dir.

## DB schema reference
- `catalog.resource` table has: code, name, last_update (timestamp), project_principal_investigator, description_fr, description_en, resource_type, project_status, project_erb_id, project_creation_date, etc.
- Filter: `resource_type = 'research_project'`

## ETL & OpenSearch pipeline (unic-dag)
- **Repo**: `Ferlab-Ste-Justine/unic-dag`
- **Flow**: PostgreSQL `catalog` schema → Spark ETL (`bio.ferlab.ui.etl.catalog.os.prepare.Main`) → MinIO (parquet) → OpenSearch bulk load → versioned aliases
- **DAG**: `dags/os_index_dags.py` → orchestrates prepare → load → publish
- **3 indexes**: `resource_centric` (ID: `rs_id`), `table_centric` (ID: `tab_id`), `variable_centric` (ID: `var_id`)
- **Templates**: `dags/lib/templates/{resource,table,variable}_centric.py`
- **Key files**: `dags/lib/tasks/opensearch.py` (prepare/load/publish), `dags/lib/opensearch.py` (client config, env configs)
- **Envs**: QA + PROD OpenSearch clusters on `*.sainte-justine.intranet:9200`, SSL, credentials from Airflow Variables

## Migration plan: PostgreSQL → OpenSearch for portal API
- **Radiant-portal does NOT use ES/OpenSearch** — it queries PostgreSQL + StarRocks with GORM only. No reference ES integration to copy.
- **Plan**: Add `opensearch-go` client to Go backend, create new repository implementations querying the 3 OS indexes, keep same handler factory pattern (swap repo impl), keep PostgreSQL for non-catalog data (auth, user prefs) if needed later.
- **Architecture**: Handlers (Gin) → DAO interfaces → OpenSearch client → `resource_centric` / `table_centric` / `variable_centric`
- **Index templates** will be modified (instructions pending)
