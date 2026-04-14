#!/bin/bash
set -e

# Fincz Track Database Initialization Script
# This script creates all necessary databases and tables.
# It is executed automatically by the Postgres Docker image on first startup.

POSTGRES="psql --username $POSTGRES_USER"

echo "🚀 Starting database initialization..."

# Function to create a database and initialize its schema
init_service_db() {
    local db_name=$1
    local sql_content=$2

    echo "📂 Initializing database: $db_name"
    
    # Create database if it doesn't exist
    $POSTGRES -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$db_name'" | grep -q 1 || \
        $POSTGRES -d postgres -c "CREATE DATABASE $db_name"
    
    # Run the schema SQL if provided
    if [ -n "$sql_content" ]; then
        echo "   Applying schema to $db_name..."
        $POSTGRES -d "$db_name" <<EOSQL
$sql_content
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;
EOSQL
    fi
}

# --- Schema Definitions ---

AUTH_SCHEMA=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ROLE_USER',
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS user_recovery_codes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recovery_code VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_user_recovery_codes_user_id ON user_recovery_codes(user_id);
EOF
)

USER_SCHEMA=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    age INTEGER,
    occupation VARCHAR(100),
    financial_goals TEXT,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    currency VARCHAR(10) DEFAULT 'INR',
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
EOF
)

PORTFOLIO_SCHEMA=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    symbol VARCHAR(100) NOT NULL,
    units DECIMAL(19, 4) NOT NULL,
    buy_price DECIMAL(19, 4) NOT NULL,
    current_price DECIMAL(19, 4),
    total_investment DECIMAL(19, 2),
    current_value DECIMAL(19, 2),
    pnl DECIMAL(19, 2),
    pnl_percentage DECIMAL(7, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_email ON portfolios(user_email);
CREATE INDEX IF NOT EXISTS idx_portfolios_type ON portfolios(type);
CREATE INDEX IF NOT EXISTS idx_portfolios_symbol ON portfolios(symbol);
EOF
)

NOTIFICATION_SCHEMA=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
EOF
)

# --- Execute Initialization ---
for db in "auth_db" "user_db" "portfolio_db" "notification_db"; do
    case $db in
        auth_db)         init_service_db "$db" "$AUTH_SCHEMA" ;;
        user_db)         init_service_db "$db" "$USER_SCHEMA" ;;
        portfolio_db)    init_service_db "$db" "$PORTFOLIO_SCHEMA" ;;
        notification_db) init_service_db "$db" "$NOTIFICATION_SCHEMA" ;;
    esac
done

echo "✅ Database initialization completed successfully!"