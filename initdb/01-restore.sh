#!/bin/bash
set -e

echo "Restoring database from dump..."
pg_restore --no-owner --role="$POSTGRES_USER" -U "$POSTGRES_USER" --clean --if-exists -d unic_db /docker-entrypoint-initdb.d/backup.dump || true
echo "Database restore complete."
