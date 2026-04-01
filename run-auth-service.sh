#!/bin/bash

# 🔐 Security: Define your Secret Keys here
# For production, these should be set in your CI/CD pipeline or Secret Manager.

# Generate a secure 32-byte secret if not already set (requires openssl)
export JWT_SECRET=${JWT_SECRET:-"$(openssl rand -base64 32)"}
export JWT_EXPIRATION=${JWT_EXPIRATION:-86400000} # 24 Hours

# 🗄️ Database Configuration
# Overriding the defaults in application.yaml
export DB_URL=${DB_URL:-"jdbc:h2:mem:authdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"}
export DB_USER=${DB_USER:-"sa"}
export DB_PASS=${DB_PASS:-""}

echo "------------------------------------------------"
echo "🚀 Starting Auth Service..."
echo "🔑 JWT Secret: [HIDDEN]"
echo "📅 Expiration: $JWT_EXPIRATION ms"
echo "------------------------------------------------"
cd services/auth-service || exit
mvn spring-boot:run