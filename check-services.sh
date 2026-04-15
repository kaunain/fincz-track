#!/bin/bash

# Fincz-Track Microservices Health Check Dashboard
# Author: Kaunain Ahmad
# Created: April 2026
# Description: Check health status of all microservices

# ANSI Color Codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVICES=(
    "8080:API Gateway:http://localhost:8080/test"
    "8082:User Service:http://localhost:8082/users/test"
    "8083:Portfolio Service:http://localhost:8083/portfolio/test"
    "8084:Market Data Service:http://localhost:8084/market/test"
    "8085:Notification Service:http://localhost:8085/notifications/test"
    "5432:PostgreSQL:"
    "8088:Adminer:http://localhost:8088"
    "5173:Frontend:http://localhost:5173"
)

while true; do
    clear
    echo "=========================================="
    echo "🔍 Fincz-Track Microservices Health Check"
    echo "Last Updated: $(date +%H:%M:%S)"
    echo "=========================================="
    echo ""
    echo "Service Status:"
    echo "---------------"

    for service in "${SERVICES[@]}"; do
        IFS=':' read -r port name url <<< "$service"

        # Check if port is listening using ss
        if ss -tln | grep -q ":$port "; then
            if [ -z "$url" ]; then
                # For services without HTTP endpoint (like PostgreSQL), port open means running
                echo -e "✅ $name (Port $port): ${GREEN}RUNNING${NC}"
            else
                # Try to get response from health endpoint
                response=$(curl -s --max-time 5 "$url" 2>/dev/null)
                if [ $? -eq 0 ] && [ -n "$response" ]; then
                    echo -e "✅ $name (Port $port): ${GREEN}RUNNING${NC}"
                else
                    echo -e "⚠️  $name (Port $port): ${YELLOW}PORT OPEN but health check failed${NC}"
                fi
            fi
        else
            echo -e "❌ $name (Port $port): ${RED}NOT RUNNING${NC}"
        fi
    done

echo ""
echo "=========================================="
echo "💡 Quick Commands:"
echo "Start all services: ./run-services.sh all"
echo "Stop all services:  ./run-services.sh stop"
echo "Start individual:   ./run-services.sh [user|gateway|portfolio|market|notification]"
echo "Start PostgreSQL:   ./start-postgres.sh"
echo "Start Frontend:     cd frontend && npm run dev"
echo "Monitoring... [Ctrl+C to Exit]"
echo "=========================================="

    sleep 5
done