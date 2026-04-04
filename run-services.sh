#!/bin/bash

# Project: Fincz-Track
# Author: Kaunain Ahmad
# Created: April 2026
# Description: Unified script to run auth-service, user-service, or both.

# Check if service name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 {auth|user|gateway|portfolio|market|all}"
    echo "Example: $0 auth"
    echo "Example: $0 all         # run all services in parallel"
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

if [ "$SERVICE" = "auth" ] || [ "$SERVICE" = "user" ] || [ "$SERVICE" = "gateway" ] || [ "$SERVICE" = "portfolio" ] || [ "$SERVICE" = "market" ]; then
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
    else
        SERVICE_NAME="Market Data Service"
        SERVICE_DIR="services/market-data-service"
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
        echo "🚀 Starting ALL Services (Auth, User, Gateway) ..."
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
    else
        (cd services/auth-service && export DB_URL="jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE" && mvn spring-boot:run) &
        (cd services/user-service && export DB_URL="jdbc:h2:mem:userdb;DB_CLOSE_DELAY=-1" && mvn spring-boot:run) &
    fi
    wait

else
    echo "Invalid service name. Use 'auth', 'user', 'gateway', 'portfolio', 'market', or 'all'."
    exit 1
fi

export DB_USER=${DB_USER:-"sa"}
export DB_PASS=${DB_PASS:-""}

echo "------------------------------------------------"
echo "🚀 Starting $SERVICE_NAME..."
echo "🔑 JWT Secret: [HIDDEN]"
echo "📅 Expiration: $JWT_EXPIRATION ms"
echo "------------------------------------------------"

cd "$SERVICE_DIR" || exit
mvn spring-boot:run