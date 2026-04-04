#!/bin/bash

# Fincz Track Complete Startup Script
# This script starts PostgreSQL and all microservices

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🚀 Fincz Track - Complete Startup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found!${NC}"
    exit 1
fi

# Load PostgreSQL environment variables
if [ -f ".env.postgres" ]; then
    echo -e "${YELLOW}📝 Loading PostgreSQL configuration...${NC}"
    export $(cat .env.postgres | grep -v '#' | xargs)
fi

# Set default values
POSTGRES_USER="${POSTGRES_USER:-fincz_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-fincz_password}"
DB_USER="${POSTGRES_USER}"
DB_PASS="${POSTGRES_PASSWORD}"

export JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32)}"
export JWT_EXPIRATION="${JWT_EXPIRATION:-86400000}"

echo ""
echo -e "${BLUE}📦 Step 1: Starting PostgreSQL Database...${NC}"
./manage-postgres.sh start

echo ""
echo -e "${BLUE}📦 Step 2: Starting Microservices...${NC}"
echo ""

# Set environment variables for all services
export DB_USER="$DB_USER"
export DB_PASS="$DB_PASS"
export JWT_SECRET="$JWT_SECRET"
export JWT_EXPIRATION="$JWT_EXPIRATION"

# Start services
echo -e "${YELLOW}🔑 Starting Auth Service (Port 8081)...${NC}"
(cd services/auth-service && ./mvnw spring-boot:run) &
AUTH_PID=$!

sleep 3

echo -e "${YELLOW}👤 Starting User Service (Port 8082)...${NC}"
(cd services/user-service && ./mvnw spring-boot:run) &
USER_PID=$!

sleep 3

echo -e "${YELLOW}💼 Starting Portfolio Service (Port 8083)...${NC}"
(cd services/portfolio-service && ./mvnw spring-boot:run) &
PORTFOLIO_PID=$!

sleep 3

echo -e "${YELLOW}📊 Starting Market Data Service (Port 8084)...${NC}"
(cd services/market-data-service && ./mvnw spring-boot:run) &
MARKET_PID=$!

sleep 3

echo -e "${YELLOW}🔔 Starting Notification Service (Port 8085)...${NC}"
(cd services/notification-service && ./mvnw spring-boot:run) &
NOTIFICATION_PID=$!

sleep 3

echo -e "${YELLOW}🌉 Starting API Gateway (Port 8080)...${NC}"
(cd services/api-gateway && ./mvnw spring-boot:run) &
GATEWAY_PID=$!

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo -e "${BLUE}📋 Service Ports:${NC}"
echo "   🌉 API Gateway........... http://localhost:8080"
echo "   🔑 Auth Service.......... http://localhost:8081"
echo "   👤 User Service.......... http://localhost:8082"
echo "   💼 Portfolio Service..... http://localhost:8083"
echo "   📊 Market Data Service... http://localhost:8084"
echo "   🔔 Notification Service.. http://localhost:8085"
echo ""
echo -e "${BLUE}🗄️  PostgreSQL:${NC}"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   User: $DB_USER"
echo "   Password: ••••••••••"
echo ""
echo -e "${BLUE}🎨 Frontend:${NC}"
echo "   http://localhost:5173 (Run: cd frontend && npm run dev)"
echo ""
echo -e "${YELLOW}💡 To stop all services: press Ctrl+C${NC}"
echo ""

# Trap to handle cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping services...${NC}"
    kill $AUTH_PID $USER_PID $PORTFOLIO_PID $MARKET_PID $NOTIFICATION_PID $GATEWAY_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for all processes
wait
