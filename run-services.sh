#!/bin/bash

# Project: Fincz-Track
# Author: Kaunain Ahmad
# Created: April 2026
# Description: Unified script to run auth-service, user-service, or both.

# Check if service name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 {auth|user|both}"
    echo "Example: $0 auth"
    echo "Example: $0 both       # run both services in parallel"
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

if [ "$SERVICE" = "auth" ] || [ "$SERVICE" = "user" ]; then
    if [ "$SERVICE" = "auth" ]; then
        export DB_URL=${DB_URL:-"jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"}
        SERVICE_NAME="Auth Service"
        SERVICE_DIR="services/auth-service"
    else
        export DB_URL=${DB_URL:-"jdbc:h2:mem:userdb;DB_CLOSE_DELAY=-1"}
        SERVICE_NAME="User Service"
        SERVICE_DIR="services/user-service"
    fi

    echo "------------------------------------------------"
    echo "🚀 Starting $SERVICE_NAME..."
    echo "🔑 JWT Secret: [HIDDEN]"
    echo "📅 Expiration: $JWT_EXPIRATION ms"
    echo "------------------------------------------------"

    cd "$SERVICE_DIR" || exit
    mvn spring-boot:run

elif [ "$SERVICE" = "both" ]; then
    # Run both services in background, same JWT_SECRET ensures tokens are valid across services.
    echo "------------------------------------------------"
    echo "🚀 Starting Auth Service and User Service (both) ..."
    echo "🔑 JWT Secret: [HIDDEN]"
    echo "📅 Expiration: $JWT_EXPIRATION ms"
    echo "------------------------------------------------"

    # Export variables for subshells
    export JWT_SECRET
    export JWT_EXPIRATION
    export DB_USER
    export DB_PASS

    (cd services/auth-service && export DB_URL="jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE" && mvn spring-boot:run) &
    (cd services/user-service && export DB_URL="jdbc:h2:mem:userdb;DB_CLOSE_DELAY=-1" && mvn spring-boot:run) &
    wait

else
    echo "Invalid service name. Use 'auth', 'user', or 'both'."
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