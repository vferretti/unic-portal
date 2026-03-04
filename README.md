# UNIC Portal

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Docker Setup (Recommended)](#docker-setup-recommended)
  - [Prerequisites](#prerequisites-docker)
  - [Quick Start](#quick-start)
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

The portal consists of a Go API backend and a React frontend that query OpenSearch indexes for catalog data. A PostgreSQL database (managed by the portal's own docker-compose) stores application state such as the variable cart.

The **dev data layer** (PostgreSQL + OpenSearch + mini ETL) lives in a separate repository: [unic-etl4dev](https://github.com/vferretti/unic-etl4dev). Start it first to have OpenSearch running with seeded indexes.

> Production uses [unic-dag](https://github.com/Ferlab-Ste-Justine/unic-dag) (Spark ETL) for the OpenSearch pipeline. In production, set `OPENSEARCH_HOST` and `OPENSEARCH_PORT` to point to the production cluster.

```
unic-etl4dev/                    ← Dev data layer (separate repo)
├── postgres/                    ← PG dump + restore script
├── etl/                         ← Mini ETL: PG → OpenSearch
└── docker-compose.yml           ← postgres, opensearch, etl-seed

unic-portal/                     ← This repo
├── backend/                     ← Go API (queries OpenSearch + PostgreSQL)
├── frontend/                    ← React + Vite
└── docker-compose.yml           ← PostgreSQL + API + frontend
```

---

## Docker Setup (Recommended)

### Prerequisites (Docker)

- [Docker](https://docs.docker.com/get-docker/) (v20+ recommended)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+ — included with Docker Desktop)
- [unic-etl4dev](https://github.com/vferretti/unic-etl4dev) cloned and ready

Verify your installation:

```bash
docker --version
docker compose version
```

### Quick Start

1. **Start the dev data layer** (in a separate terminal):

   ```bash
   cd path/to/unic-etl4dev
   docker compose up -d
   ```

   Wait for OpenSearch to be healthy and the ETL seed to finish. Verify:

   ```bash
   curl localhost:9200/_cat/indices?v
   ```

2. **Start the portal** (API + frontend):

   ```bash
   cd unic-portal
   docker compose up --build
   ```

3. **Open the application**:

   - Frontend: http://localhost:3000
   - API: http://localhost:8081/api/resources
   - Swagger UI: http://localhost:8081/swagger/index.html

### Useful Commands

| Command | Description |
|---------|-------------|
| `docker compose up --build` | Build and start PostgreSQL + API + frontend |
| `docker compose up --build -d` | Same but in background |
| `docker compose down` | Stop all services |
| `docker compose logs -f api` | Follow API logs |
| `docker compose restart api` | Restart the API service |

### Ports

| Service | Container Port | Host Port | URL |
|---------|---------------|-----------|-----|
| Frontend (nginx) | 80 | **3000** | http://localhost:3000 |
| API (Go) | 8080 | **8081** | http://localhost:8081 |
| PostgreSQL | 5432 | **5437** | `psql -h localhost -p 5437 -U unic unic_portal` |
| OpenSearch (from unic-etl4dev) | 9200 | **9200** | http://localhost:9200 |
| Swagger UI | — | **8081** | http://localhost:8081/swagger/index.html |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENSEARCH_HOST` | `host.docker.internal` (Docker) / `localhost` (local) | OpenSearch hostname |
| `OPENSEARCH_PORT` | `9200` | OpenSearch port |
| `POSTGRES_HOST` | `postgres` (Docker) / `localhost` (local) | PostgreSQL hostname |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `unic` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `unic` | PostgreSQL password |
| `POSTGRES_DB` | `unic_portal` | PostgreSQL database name |

In production, set OpenSearch and PostgreSQL variables to point to the production clusters.

### Troubleshooting

**API can't connect to OpenSearch**

Make sure the dev data layer is running:

```bash
curl localhost:9200/_cat/indices?v
```

If using Docker, the API connects via `host.docker.internal` to reach OpenSearch on the host. This works on Docker Desktop (macOS/Windows) and Linux with the `extra_hosts` directive in docker-compose.

**Rebuilding after code changes**

```bash
# Rebuild and restart everything
docker compose up --build

# Or rebuild just one service
docker compose build api
docker compose restart api
```

---

## Local Development (Without Docker)

For active development, run the data layer in Docker (via unic-etl4dev) and the app services locally for faster iteration with hot-reload.

### Prerequisites (Local)

- Go (binary at `/usr/local/go/bin/go`)
- Node.js 22 (via nvm)
- unic-etl4dev running (`cd path/to/unic-etl4dev && docker compose up -d`)

### Backend (Go API)

```bash
cd backend

# Generate Swagger docs (required on first clone)
/usr/local/go/bin/go install github.com/swaggo/swag/cmd/swag@latest
PATH="/usr/local/go/bin:$PATH" ~/go/bin/swag init -g cmd/api/main.go -o docs/ --parseDependency --parseInternal

# Start the API (OpenSearch defaults to localhost:9200, PostgreSQL defaults to localhost:5432)
/usr/local/go/bin/go run ./cmd/api/
```

The API starts on http://localhost:8080. It requires both OpenSearch (from unic-etl4dev) and PostgreSQL to be running.

For local development, start a PostgreSQL instance (e.g. via Docker):

```bash
docker run -d --name unic-portal-pg -p 5432:5432 \
  -e POSTGRES_DB=unic_portal -e POSTGRES_USER=unic -e POSTGRES_PASSWORD=unic \
  postgres:16-alpine
```

Environment variables:

```
OPENSEARCH_HOST=localhost   # default
OPENSEARCH_PORT=9200        # default
POSTGRES_HOST=localhost     # default
POSTGRES_PORT=5432          # default
POSTGRES_USER=unic          # default
POSTGRES_PASSWORD=unic      # default
POSTGRES_DB=unic_portal     # default
```

### Frontend (React + Vite)

```bash
cd frontend
source ~/.nvm/nvm.sh && nvm use 22
npm install
npm run dev
```

The frontend starts on http://localhost:5173 with hot-reload enabled.

**Type-checking**: Vite's dev server does not run TypeScript type checks. To catch type errors locally before committing:

```bash
npm run typecheck
```

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
