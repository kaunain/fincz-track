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

# Check if container is running
if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
    echo "📊 Current PostgreSQL status:"
    docker-compose ps postgres
    echo ""
    
    echo "Stopping PostgreSQL container..."
    docker-compose down postgres
    
    echo "✅ PostgreSQL stopped successfully!"
    echo ""
else
    echo "ℹ️  PostgreSQL container is not running."
    echo ""
fi

cat << 'EOF'
🛑 Cleanup Options:

1. To remove container and keep data:
   docker-compose down postgres

2. To remove container AND data:
   docker volume rm fincz-track-postgres || true
   docker-compose down -v

3. To stop all services:
   docker-compose down

4. To stop all services and remove volumes:
   docker-compose down -v

EOF
