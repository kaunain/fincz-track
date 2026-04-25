#!/bin/bash

# Project: Fincz-Track
# Author: Kaunain Ahmad
# Created: April 2026
# Description: Unified script to run microservices with PostgreSQL via Docker

set -e

# 📁 Load environment from .env file if it exists
if [ -f ".env" ]; then
    echo "📂 Loading environment from .env file..."
    set -a
    source .env
    set +a
else
    echo "⚠️  No .env file found. Using .env.example as template."
    echo "   Run: cp .env.example .env"
    echo "   Then: Update values in .env file"
    echo ""
fi

# Check if service name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 {user|gateway|portfolio|market|notification|all|stop}"
    echo "Example: $0 user"
    echo "Example: $0 all         # run all services in parallel"
    echo "Example: $0 stop        # stop all running services"
    exit 1
fi

SERVICE=$1

# ==========================================
# VALIDATE REQUIRED ENVIRONMENT VARIABLES
# ==========================================

function check_required_env() {
    local var_name=$1
    local var_value=${!var_name}
    
    if [ -z "$var_value" ]; then
        echo "❌ ERROR: Required environment variable '$var_name' is not set!"
        echo "   Please check your .env file or set it manually."
        return 1
    fi
    return 0
}

# 🔐 Validate JWT configuration (required for all services)
if [ "$SERVICE" != "stop" ]; then
    if ! check_required_env "JWT_SECRET"; then
        echo "   Hint: Generate with: python3 -c \"import base64, os; print(base64.b64encode(os.urandom(32)).decode())\""
        exit 1
    fi
    check_required_env "JWT_EXPIRATION" || export JWT_EXPIRATION="86400000"
fi

# 🗄️ Validate Database configuration (required for database services)
case "$SERVICE" in
    user|portfolio|notification|all)
        check_required_env "DB_URL" || exit 1
        check_required_env "DB_USER" || exit 1
        check_required_env "DB_PASS" || exit 1
        ;;
esac

# Set defaults for optional variables
export DB_POOL_SIZE=${DB_POOL_SIZE:-10}
export DB_CONNECTION_TIMEOUT=${DB_CONNECTION_TIMEOUT:-20000}
export DB_MAX_IDLE_TIME=${DB_MAX_IDLE_TIME:-600000}
export JPA_HIBERNATE_DDL_AUTO=${JPA_HIBERNATE_DDL_AUTO:-update}
export JPA_SHOW_SQL=${JPA_SHOW_SQL:-false}

if [ "$SERVICE" = "stop" ]; then
    echo "------------------------------------------------"
    echo "🛑 Stopping ALL Services..."
    echo "------------------------------------------------"

    # Kill all Java processes running Spring Boot
    pkill -f "spring-boot:run" 2>/dev/null || true

    # Kill processes on specific ports
    for port in 8080 8081 8082 8083 8084 8085; do
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    done

    echo "✅ All services stopped successfully"
    exit 0

elif [ "$SERVICE" = "user" ] || [ "$SERVICE" = "gateway" ] || [ "$SERVICE" = "portfolio" ] || [ "$SERVICE" = "market" ] || [ "$SERVICE" = "notification" ]; then
    if [ "$SERVICE" = "user" ]; then
        export DB_URL="jdbc:postgresql://localhost:5432/user_db"
        export SERVER_PORT=8082
        SERVICE_NAME="User Service"
        SERVICE_DIR="services/user-service"
    elif [ "$SERVICE" = "gateway" ]; then
        export SERVER_PORT=8080
        SERVICE_NAME="API Gateway"
        SERVICE_DIR="services/api-gateway"
    elif [ "$SERVICE" = "portfolio" ]; then
        export DB_URL="jdbc:postgresql://localhost:5432/portfolio_db"
        export SERVER_PORT=8083
        SERVICE_NAME="Portfolio Service"
        SERVICE_DIR="services/portfolio-service"
    elif [ "$SERVICE" = "market" ]; then
        export SERVER_PORT=8084
        SERVICE_NAME="Market Data Service"
        SERVICE_DIR="services/market-data-service"
    else
        export DB_URL="jdbc:postgresql://localhost:5432/notification_db"
        export DB_USER="$DB_USER"
        export DB_PASS="$DB_PASS"
        export SERVER_PORT=8085
        export EMAIL_HOST="smtp.gmail.com"
        export EMAIL_PORT="587"
        export EMAIL_USERNAME="test@example.com"
        export EMAIL_PASSWORD="dummy"
        SERVICE_NAME="Notification Service"
        SERVICE_DIR="services/notification-service"
    fi

    echo "------------------------------------------------"
    echo "🚀 Starting $SERVICE_NAME..."
    echo "🔑 JWT Secret: [HIDDEN]"
    echo "📅 Expiration: $JWT_EXPIRATION ms"
    echo "------------------------------------------------"

    cd "$SERVICE_DIR" || exit
    export JWT_SECRET
    export JWT_EXPIRATION
    mvn spring-boot:run -DskipTests

elif [ "$SERVICE" = "all" ]; then
    echo "------------------------------------------------"
    echo "🚀 Starting ALL Services (User, Gateway, Portfolio, Market, Notification) ..."
    echo "🔑 JWT Secret: [HIDDEN]"
    echo "📅 Expiration: $JWT_EXPIRATION ms"
    echo "------------------------------------------------"

    # Export variables for subshells
    export JWT_SECRET
    export JWT_EXPIRATION
    export DB_USER
    export DB_PASS

    (cd services/user-service && export DB_URL="jdbc:postgresql://localhost:5432/user_db" && export SERVER_PORT=8082 && mvn spring-boot:run -DskipTests) &
    (cd services/api-gateway && export SERVER_PORT=8080 && mvn spring-boot:run -DskipTests) &
    (cd services/portfolio-service && export DB_URL="jdbc:postgresql://localhost:5432/portfolio_db" && export SERVER_PORT=8083 && mvn spring-boot:run -DskipTests) &
    (cd services/market-data-service && export DB_URL="jdbc:postgresql://localhost:5432/market_db" && export SERVER_PORT=8084 && mvn spring-boot:run -DskipTests) &
    (cd services/notification-service && export DB_URL="jdbc:postgresql://localhost:5432/notification_db" && export SERVER_PORT=8085 && mvn spring-boot:run -DskipTests) &
    wait

else
    echo "Invalid service name. Use 'user', 'gateway', 'portfolio', 'market', 'notification', 'all', or 'stop'."
    exit 1
fi