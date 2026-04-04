#!/bin/bash

# Fincz Track PostgreSQL Stop Script
# This script stops the PostgreSQL container using Docker Compose

set -e

echo "================================================"
echo "🛑 Stopping PostgreSQL Database..."
echo "================================================"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Detect Docker Compose version
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Check if container is running
if $DOCKER_COMPOSE ps postgres 2>/dev/null | grep -q "Up"; then
    echo "📊 Current PostgreSQL status:"
    $DOCKER_COMPOSE ps postgres
    echo ""
    
    echo "Stopping PostgreSQL container..."
    $DOCKER_COMPOSE down postgres
    
    echo "✅ PostgreSQL stopped successfully!"
    echo ""
else
    echo "ℹ️  PostgreSQL container is not running."
    echo ""
fi

cat << 'EOF'
🛑 Cleanup Options:

1. To remove container and keep data:
   $DOCKER_COMPOSE down postgres

2. To remove container AND data:
   docker volume rm fincz-track_postgres_data || true
   $DOCKER_COMPOSE down -v

3. To stop all services:
   $DOCKER_COMPOSE down

4. To stop all services and remove volumes:
   $DOCKER_COMPOSE down -v

EOF
