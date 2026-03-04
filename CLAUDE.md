# Project: unic-portal

## Architecture
- **Backend**: Go REST API at `backend/` using **Gin** + **opensearch-go**
  - Entry point: `cmd/api/main.go`
  - Structure: `internal/database/`, `internal/repository/`, `internal/server/`, `internal/types/`
  - Repository pattern with DAO interfaces, handler factories returning `gin.HandlerFunc`
  - Run: `cd backend && /usr/local/go/bin/go run ./cmd/api/`
- **Frontend**: React 19 + TypeScript + Vite at `frontend/`
  - **Routing**: React Router v7 (SPA mode, `createBrowserRouter`). Routes in `src/routes/`, layout in `root.tsx`
  - **Data fetching**: Axios (`src/lib/api.ts`) + SWR (`src/hooks/useResources.ts`)
  - **i18n**: i18next + react-i18next. Translations in `src/locales/{en,fr}/common.json`. Init in `src/lib/i18n.ts`
  - **Types**: Shared interfaces in `src/types/`
- **Dev data layer**: Separate repo [unic-etl4dev](../unic-etl4dev) provides OpenSearch (port 9200) with seeded indexes for local development. Start it first.
- **OpenSearch connection**: Via env vars `OPENSEARCH_HOST` (default `localhost`) and `OPENSEARCH_PORT` (default `9200`). In production, set these to the production OpenSearch cluster.
- **Stack mirrors**: [radiant-portal](https://github.com/radiant-network/radiant-portal)

## Key conventions
- **CSS variables**: Always use semantic CSS variables for colors (define in `index.css` `:root` + `.dark`, register in `@theme inline`). Example: `--table-header`, `--table-accent`. Never hardcode colors.
- **shadcn/ui**: New York style, Slate base color, CSS variables enabled. Config in `components.json`. Components go in `src/components/ui/`.
- **Cell components**: Reusable data cells in `src/components/ui/cells/` (TextCell, DateCell, NumberCell, EmptyCell, etc.). All handle null/empty with `<EmptyCell />` fallback.
- **Storybook**: v10, stories in `src/stories/`. Preview imports `index.css` for Tailwind.

## Gotchas
- **Node version**: Must use Node 22 via nvm (`source ~/.nvm/nvm.sh && nvm use 22`). Default system Node is v12 (too old).
- **Go binary**: At `/usr/local/go/bin/go`, not in PATH.
- **shadcn CLI path bug**: `npx shadcn@latest add` may create files at `@/components/ui/` (literal `@` dir) instead of `src/components/ui/`. Check and move if needed.
- **npm commands**: Must run from `frontend/` dir.

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
- **Plan**: Add `opensearch-go` client to Go backend, create new repository implementations querying the 3 OS indexes, keep same handler factory pattern (swap repo impl). PostgreSQL will be added later for non-catalog features (cart).
- **Architecture**: Handlers (Gin) → DAO interfaces → OpenSearch client → `resource_centric` / `table_centric` / `variable_centric`
- **Index templates** will be modified (instructions pending)
