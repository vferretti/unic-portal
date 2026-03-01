# UNIC Portal

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Docker Setup (Recommended)](#docker-setup-recommended)
  - [Prerequisites](#prerequisites-docker)
  - [Quick Start](#quick-start)
  - [Database Initialization](#database-initialization)
  - [OpenSearch Seeding](#opensearch-seeding)
  - [Useful Commands](#useful-commands)
  - [Ports](#ports)
  - [Troubleshooting](#troubleshooting)
- [Local Development (Without Docker)](#local-development-without-docker)
  - [Prerequisites](#prerequisites-local)
  - [Backend (Go API)](#backend-go-api)
  - [Frontend (React + Vite)](#frontend-react--vite)
  - [Storybook](#storybook)
  - [Swagger / OpenAPI](#swagger--openapi)

---

## Architecture Overview

The project is split into two Docker Compose layers:

```
initdb/                           ← Data layer (PostgreSQL + OpenSearch + ETL)
├── backup.dump                   ← PG dump (catalog schema)
├── 01-restore.sh                 ← PG restore script
├── docker-compose.yml            ← postgres, opensearch, etl-seed services
├── etl/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── seed.py                   ← Mini ETL: PG → OpenSearch

docker-compose.yml                ← App layer (API + frontend)
```

**Data layer** (`initdb/`) runs PostgreSQL, OpenSearch, and a one-shot ETL container that seeds three OpenSearch indexes from the PG catalog schema:

| Index | Documents | Description |
|-------|-----------|-------------|
| `resource_centric` | Resources with nested tables and variables | Denormalized resource view |
| `table_centric` | Dictionary tables with nested variables | Denormalized table view |
| `variable_centric` | Variables with value sets and lineage | Denormalized variable view |

**App layer** (root) runs the Go API and React frontend, connecting to the data layer via the `initdb-net` Docker network.

> Production uses [unic-dag](https://github.com/Ferlab-Ste-Justine/unic-dag) (Spark ETL) for the OpenSearch pipeline. The mini ETL here is for local development only.

---

## Docker Setup (Recommended)

### Prerequisites (Docker)

- [Docker](https://docs.docker.com/get-docker/) (v20+ recommended)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+ — included with Docker Desktop)

Verify your installation:

```bash
docker --version
docker compose version
```

### Quick Start

1. **Clone the repository** (if you haven't already):

   ```bash
   git clone git@github.com:vferretti/unic-portal.git
   cd unic-portal
   ```

2. **Start the data layer** (PostgreSQL + OpenSearch + ETL seed):

   ```bash
   cd initdb
   docker compose up -d
   ```

   This will:
   - Start **PostgreSQL 16** and restore the dump from `backup.dump`
   - Start **OpenSearch 2.18** (single-node, no auth)
   - Run the **ETL seed** container to populate the three OpenSearch indexes
   - The ETL container exits automatically after seeding

   Wait for all services to be healthy (the ETL waits for both PG and OS healthchecks before running).

3. **Start the app layer** (API + frontend):

   ```bash
   cd ..
   docker compose up --build
   ```

   This will:
   - Build and start the **Go API** backend
   - Build and start the **React frontend** (served via nginx)
   - Both connect to the data layer via the `initdb-net` network

4. **Open the application**:

   - Frontend: http://localhost:3000
   - API: http://localhost:8081/api/resources
   - Swagger UI: http://localhost:8081/swagger/index.html

### Database Initialization

The PostgreSQL database is automatically initialized on the **first startup** of the container:

1. Docker creates a fresh PostgreSQL instance
2. The `unic_db` database is created (from the `POSTGRES_DB` environment variable)
3. The `initdb/01-restore.sh` script runs `pg_restore` to load the dump

**Important**: This initialization only happens once — when the PostgreSQL data volume is empty. To re-initialize from scratch:

```bash
cd initdb
docker compose down -v    # Remove volumes (PG data + OpenSearch data)
docker compose up -d      # Re-create from scratch
```

To **update the dump file** with new data:

```bash
# Export from a running instance
PGPASSWORD=vincent pg_dump -h localhost -p 5436 -U vincent -Fc unic_db > initdb/backup.dump
```

### OpenSearch Seeding

The `etl-seed` container runs a Python script (`etl/seed.py`) that:

1. Connects to PostgreSQL and reads the `catalog` schema
2. Builds denormalized documents for three indexes (`resource_centric`, `table_centric`, `variable_centric`)
3. Bulk loads them into OpenSearch with aliases

The ETL runs once and exits. To **re-seed** OpenSearch (e.g. after updating the PG dump):

```bash
cd initdb
docker compose up -d --build etl-seed
docker logs -f unic-etl-seed    # Watch progress
```

To **verify** the indexes were populated:

```bash
curl localhost:9200/_cat/indices?v
curl 'localhost:9200/resource_centric/_count?pretty'
curl 'localhost:9200/table_centric/_count?pretty'
curl 'localhost:9200/variable_centric/_count?pretty'
```

### Useful Commands

**Data layer** (run from `initdb/`):

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start data layer in background |
| `docker compose down` | Stop data layer |
| `docker compose down -v` | Stop and **delete all data volumes** (PG + OpenSearch) |
| `docker compose up -d --build etl-seed` | Re-run the ETL seed |
| `docker compose logs -f etl-seed` | Follow ETL seed logs |
| `docker compose exec postgres psql -U vincent -d unic_db` | Open a psql shell |

**App layer** (run from repo root):

| Command | Description |
|---------|-------------|
| `docker compose up --build` | Build and start API + frontend |
| `docker compose up --build -d` | Same but in background |
| `docker compose down` | Stop API + frontend |
| `docker compose logs -f api` | Follow API logs |
| `docker compose restart api` | Restart the API service |

### Ports

| Service | Container Port | Host Port | URL |
|---------|---------------|-----------|-----|
| Frontend (nginx) | 80 | **3000** | http://localhost:3000 |
| API (Go) | 8080 | **8081** | http://localhost:8081 |
| PostgreSQL | 5432 | **5436** | `psql -h localhost -p 5436 -U vincent -d unic_db` |
| OpenSearch | 9200 | **9200** | http://localhost:9200 |

> Host ports are offset to avoid conflicts with locally running services (e.g., a local PostgreSQL on 5435).

### Troubleshooting

**Port already in use**

```
Error: failed to bind host port for 0.0.0.0:5436
```

Another service is using the port. Find and stop it, or change the port mapping in the relevant `docker-compose.yml`:

```bash
lsof -i :5436
```

**Database not initialized / empty tables**

The init scripts only run when the PostgreSQL volume is empty. If you started the container before the dump file was in place:

```bash
cd initdb
docker compose down -v    # Remove the volume
docker compose up -d      # Re-create from scratch
```

**API can't connect to database or OpenSearch**

Check that the data layer is running and healthy:

```bash
cd initdb
docker compose ps
```

Both `postgres` and `opensearch` should show `healthy`. The app layer depends on the `initdb-net` network — make sure the data layer is started first.

**OpenSearch indexes are empty**

Check the ETL seed logs for errors:

```bash
docker logs unic-etl-seed
```

If needed, rebuild and re-run:

```bash
cd initdb
docker compose up -d --build etl-seed
```

**Rebuilding after code changes**

```bash
# Rebuild and restart everything
docker compose up --build

# Or rebuild just one service
docker compose build api
docker compose restart api
```

**Viewing database contents**

```bash
# Connect to the database
cd initdb
docker compose exec postgres psql -U vincent -d unic_db

# Then inside psql:
\dt catalog.*          -- list tables
SELECT count(*) FROM catalog.resource;
```

---

## Local Development (Without Docker)

For active development, you may prefer running the data layer in Docker and the app services locally for faster iteration with hot-reload.

### Prerequisites (Local)

- Go (binary at `/usr/local/go/bin/go`)
- Node.js 22 (via nvm)
- Data layer running (`cd initdb && docker compose up -d`)

### Backend (Go API)

```bash
cd backend
PGPASSWORD=vincent PGPORT=5436 /usr/local/go/bin/go run ./cmd/api/
```

The API starts on http://localhost:8080.

Environment variables for OpenSearch (defaults to `localhost:9200`):

```
OPENSEARCH_HOST=localhost
OPENSEARCH_PORT=9200
```

### Frontend (React + Vite)

```bash
cd frontend
source ~/.nvm/nvm.sh && nvm use 22
npm install
npm run dev
```

The frontend starts on http://localhost:5173 with hot-reload enabled.

### Storybook

```bash
cd frontend
source ~/.nvm/nvm.sh && nvm use 22
npm run storybook
```

Storybook starts on http://localhost:6006.

### Swagger / OpenAPI

The backend uses [swaggo/swag](https://github.com/swaggo/swag) to generate OpenAPI documentation from handler annotations.

**Viewing the docs**: When the API is running, visit http://localhost:8080/swagger/index.html.

**Regenerating after handler changes**:

```bash
cd backend
/usr/local/go/bin/go install github.com/swaggo/swag/cmd/swag@latest
PATH="/usr/local/go/bin:$PATH" ~/go/bin/swag init -g cmd/api/main.go -o docs/ --parseDependency --parseInternal
```

This generates `backend/docs/` (docs.go, swagger.json, swagger.yaml). The `docs/` directory is gitignored — regenerate it locally after cloning.
