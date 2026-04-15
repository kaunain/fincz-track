#!/bin/bash
set -e

# Fincz-Track: Data Migration Script
# Moves user credentials from the decommissioned auth_db to the unified user_db.

# Load environment from project root .env
PARENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$PARENT_DIR/.env" ]; then
    echo "📂 Loading environment from $PARENT_DIR/.env"
    export $(cat "$PARENT_DIR/.env" | grep -v '#' | xargs)
fi

DB_USER=${DB_USER:-fincz_user}
DB_PASS=${DB_PASS:-fincz_password}
export PGPASSWORD=$DB_PASS

echo "🚜 Migrating users from auth_db to user_db..."

psql -h localhost -U "$DB_USER" -d user_db <<EOSQL
-- 1. Enable dblink for cross-database querying
CREATE EXTENSION IF NOT EXISTS dblink;

-- 2. Pull data from auth_db.users into user_db.users
INSERT INTO users (email, password, created_at, updated_at)
SELECT email, password_hash, created_at, updated_at
FROM dblink('host=localhost dbname=auth_db user=$DB_USER password=$DB_PASS',
            'SELECT email, password_hash, created_at, updated_at FROM users')
AS auth_users(email varchar, password_hash varchar, created_at timestamp, updated_at timestamp)
ON CONFLICT (email) DO NOTHING;
EOSQL

echo "✅ Migration completed successfully."