#!/bin/bash

# Project: Fincz-Track
# Author: Kaunain Ahmad
# Created: April 2026
# Description: Unified script to run auth-service, user-service, or both.

# Check if service name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 {auth|user|gateway|portfolio|market|notification|all|stop}"
    echo "Example: $0 auth"
    echo "Example: $0 all         # run all services in parallel"
    echo "Example: $0 stop        # stop all running services"
    exit 1
fi

SERVICE=$1

# 🔐 Security: Define your Secret Keys here
# For production, these should be in CI/CD or your secret manager and MUST be same for both services.
if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET="$(openssl rand -base64 32)"
  echo "Warning: JWT_SECRET not set. Using temporary random secret (not for production)."
fi
export JWT_SECRET
export JWT_EXPIRATION=${JWT_EXPIRATION:-86400000} # 24 Hours

# 🗄️ Database Configuration defaults.
export DB_USER=${DB_USER:-"sa"}
export DB_PASS=${DB_PASS:-""}

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
fi
    if [ "$SERVICE" = "auth" ]; then
        export DB_URL=${DB_URL:-"jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"}
        SERVICE_NAME="Auth Service"
        SERVICE_DIR="services/auth-service"
    elif [ "$SERVICE" = "user" ]; then
        export DB_URL=${DB_URL:-"jdbc:h2:mem:userdb;DB_CLOSE_DELAY=-1"}
        SERVICE_NAME="User Service"
        SERVICE_DIR="services/user-service"
    elif [ "$SERVICE" = "gateway" ]; then
        SERVICE_NAME="API Gateway"
        SERVICE_DIR="services/api-gateway"
    elif [ "$SERVICE" = "portfolio" ]; then
        export DB_URL=${DB_URL:-"jdbc:h2:mem:portfoliodb;DB_CLOSE_DELAY=-1"}
        SERVICE_NAME="Portfolio Service"
        SERVICE_DIR="services/portfolio-service"
    elif [ "$SERVICE" = "market" ]; then
        SERVICE_NAME="Market Data Service"
        SERVICE_DIR="services/market-data-service"
    else
        export DB_URL=${DB_URL:-"jdbc:h2:mem:notificationdb;DB_CLOSE_DELAY=-1"}
        SERVICE_NAME="Notification Service"
        SERVICE_DIR="services/notification-service"
    fi

    echo "------------------------------------------------"
    echo "🚀 Starting $SERVICE_NAME..."
    echo "🔑 JWT Secret: [HIDDEN]"
    echo "📅 Expiration: $JWT_EXPIRATION ms"
    echo "------------------------------------------------"

    cd "$SERVICE_DIR" || exit
    mvn spring-boot:run

elif [ "$SERVICE" = "both" ] || [ "$SERVICE" = "all" ]; then
    if [ "$SERVICE" = "all" ]; then
        echo "------------------------------------------------"
        echo "🚀 Starting ALL Services (Auth, User, Gateway, Portfolio, Market, Notification) ..."
        echo "🔑 JWT Secret: [HIDDEN]"
        echo "📅 Expiration: $JWT_EXPIRATION ms"
        echo "------------------------------------------------"
    else
        echo "------------------------------------------------"
        echo "🚀 Starting Auth Service and User Service (both) ..."
        echo "🔑 JWT Secret: [HIDDEN]"
        echo "📅 Expiration: $JWT_EXPIRATION ms"
        echo "------------------------------------------------"
    fi

    # Export variables for subshells
    export JWT_SECRET
    export JWT_EXPIRATION
    export DB_USER
    export DB_PASS

    if [ "$SERVICE" = "all" ]; then
        (cd services/auth-service && export DB_URL="jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE" && mvn spring-boot:run) &
        (cd services/user-service && export DB_URL="jdbc:h2:mem:userdb;DB_CLOSE_DELAY=-1" && mvn spring-boot:run) &
        (cd services/api-gateway && mvn spring-boot:run) &
        (cd services/portfolio-service && export DB_URL="jdbc:h2:mem:portfoliodb;DB_CLOSE_DELAY=-1" && mvn spring-boot:run) &
        (cd services/market-data-service && mvn spring-boot:run) &
        (cd services/notification-service && export DB_URL="jdbc:h2:mem:notificationdb;DB_CLOSE_DELAY=-1" && mvn spring-boot:run) &
    else
        (cd services/auth-service && export DB_URL="jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE" && mvn spring-boot:run) &
        (cd services/user-service && export DB_URL="jdbc:h2:mem:userdb;DB_CLOSE_DELAY=-1" && mvn spring-boot:run) &
    fi
    wait

else
    echo "Invalid service name. Use 'auth', 'user', 'gateway', 'portfolio', 'market', 'notification', 'all', or 'stop'."
    exit 1
fi