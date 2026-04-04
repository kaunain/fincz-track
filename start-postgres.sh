#!/bin/bash

# Fincz Track PostgreSQL Start Script
# This script starts the PostgreSQL container using Docker Compose

set -e

echo "================================================"
echo "🚀 Starting PostgreSQL Database..."
echo "================================================"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Load environment variables if .env.postgres exists
if [ -f ".env.postgres" ]; then
    echo "📝 Loading environment variables from .env.postgres"
    export $(cat .env.postgres | grep -v '#' | xargs)
else
    echo "⚠️  .env.postgres not found. Using default values."
    export POSTGRES_USER="fincz_user"
    export POSTGRES_PASSWORD="fincz_password"
    export POSTGRES_DB="fincz_db"
    export POSTGRES_PORT="5432"
fi

echo "📦 Starting PostgreSQL container..."
echo "   User: $POSTGRES_USER"
echo "   Database: $POSTGRES_DB"
echo "   Port: $POSTGRES_PORT"
echo ""

# Start PostgreSQL container
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if container is running
if docker-compose ps postgres | grep -q "Up"; then
    echo "✅ PostgreSQL container started successfully!"
    echo ""
    echo "📊 Database Status:"
    docker-compose ps postgres
    echo ""
    echo "🔗 Connection Details:"
    echo "   Host: localhost"
    echo "   Port: $POSTGRES_PORT"
    echo "   User: $POSTGRES_USER"
    echo "   Password: $POSTGRES_PASSWORD"
    echo "   Database: $POSTGRES_DB"
    echo ""
    echo "💡 To connect via psql:"
    echo "   psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB"
    echo ""
    echo "💡 To view logs:"
    echo "   docker-compose logs -f postgres"
    echo ""
else
    echo "❌ Failed to start PostgreSQL container!"
    echo "📋 Error logs:"
    docker-compose logs postgres
    exit 1
fi
