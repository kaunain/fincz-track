#!/bin/bash

# Fincz Track PostgreSQL Management Script
# This script provides comprehensive PostgreSQL management commands

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Detect Docker Compose version (V2 "docker compose" vs V1 "docker-compose")
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Load environment variables
if [ -f ".env.postgres" ]; then
    export $(cat .env.postgres | grep -v '#' | xargs)
fi

POSTGRES_USER="${POSTGRES_USER:-fincz_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-fincz_password}"
POSTGRES_DB="${POSTGRES_DB:-fincz_db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"

print_usage() {
    cat << 'EOF'
Fincz Track PostgreSQL Management

Usage: ./manage-postgres.sh [COMMAND]

Commands:
  start              Start PostgreSQL container
  stop               Stop PostgreSQL container
  restart            Restart PostgreSQL container
  status             Show PostgreSQL status
  logs               Show PostgreSQL logs (follow)
  logs-f             Show PostgreSQL logs (follow mode)
  ui-start           Start Adminer Web UI (Dev Mode)
  ui-stop            Stop Adminer Web UI
  psql               Open psql interactive shell
  backup             Backup all databases
  restore <file>     Restore from backup file
  reset              Drop and recreate databases
  clean              Stop container and remove volume
  info               Show connection information

Examples:
  ./manage-postgres.sh start
  ./manage-postgres.sh status
  ./manage-postgres.sh psql
  ./manage-postgres.sh backup
  ./manage-postgres.sh restore backup.sql

EOF
}

# Function to start PostgreSQL
start_postgres() {
    echo -e "${BLUE}🚀 Starting PostgreSQL...${NC}"
    $DOCKER_COMPOSE up -d postgres
    
    # Wait for service to be ready
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    sleep 3
    
    for i in {1..30}; do
        if docker exec fincz-track-postgres pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    return 1
}

# Function to stop PostgreSQL
stop_postgres() {
    echo -e "${BLUE}🛑 Stopping PostgreSQL...${NC}"
    $DOCKER_COMPOSE down postgres
    echo -e "${GREEN}✅ PostgreSQL stopped${NC}"
}

# Function to start Adminer UI
start_ui() {
    echo -e "${BLUE}🌐 Starting Adminer Web UI...${NC}"
    $DOCKER_COMPOSE --profile dev up -d adminer
    echo -e "${GREEN}✅ Adminer available at http://localhost:8088${NC}"
}

# Function to stop Adminer UI
stop_ui() {
    echo -e "${BLUE}🛑 Stopping Adminer Web UI...${NC}"
    $DOCKER_COMPOSE --profile dev stop adminer
    echo -e "${GREEN}✅ Adminer stopped${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 PostgreSQL Status${NC}"
    $DOCKER_COMPOSE ps postgres || echo -e "${YELLOW}Container not running${NC}"
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📋 PostgreSQL Logs${NC}"
    $DOCKER_COMPOSE logs postgres
}

# Function to follow logs
follow_logs() {
    echo -e "${BLUE}📋 PostgreSQL Logs (Following)${NC}"
    $DOCKER_COMPOSE logs -f postgres
}

# Function to open psql shell
open_psql() {
    echo -e "${BLUE}🔌 Opening psql shell...${NC}"
    docker exec -it fincz-track-postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
}

# Function to backup databases
backup_postgres() {
    BACKUP_FILE="postgres-backup-$(date +%Y%m%d-%H%M%S).sql"
    echo -e "${BLUE}💾 Backing up PostgreSQL to $BACKUP_FILE...${NC}"
    
    docker exec fincz-track-postgres pg_dump -U "$POSTGRES_USER" --all-databases > "$BACKUP_FILE"
    
    echo -e "${GREEN}✅ Backup completed: $BACKUP_FILE${NC}"
}

# Function to restore databases
restore_postgres() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Error: Please provide backup file name${NC}"
        echo "Usage: $0 restore <backup-file>"
        return 1
    fi
    
    if [ ! -f "$1" ]; then
        echo -e "${RED}❌ Error: File not found: $1${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔄 Restoring from $1...${NC}"
    docker exec -i fincz-track-postgres psql -U "$POSTGRES_USER" < "$1"
    echo -e "${GREEN}✅ Restore completed${NC}"
}

# Function to reset databases
reset_postgres() {
    echo -e "${YELLOW}⚠️  WARNING: This will delete all data!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "Cancelled"
        return 1
    fi
    
    echo -e "${BLUE}🗑️  Resetting databases...${NC}"
    $DOCKER_COMPOSE down -v
    sleep 2
    $DOCKER_COMPOSE up -d postgres
    
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to initialize...${NC}"
    sleep 5
    
    echo -e "${GREEN}✅ Databases reset${NC}"
}

# Function to clean up
clean_postgres() {
    echo -e "${YELLOW}⚠️  WARNING: This will remove container and data!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "Cancelled"
        return 1
    fi
    
    echo -e "${BLUE}🗑️  Cleaning up...${NC}"
    $DOCKER_COMPOSE down -v
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to show info
show_info() {
    echo -e "${BLUE}ℹ️  PostgreSQL Connection Information${NC}"
    echo "========================================="
    echo -e "Host: ${GREEN}localhost${NC}"
    echo -e "Port: ${GREEN}$POSTGRES_PORT${NC}"
    echo -e "User: ${GREEN}$POSTGRES_USER${NC}"
    echo -e "Password: ${GREEN}$POSTGRES_PASSWORD${NC}"
    echo -e "Database: ${GREEN}$POSTGRES_DB${NC}"
    echo "========================================="
    echo ""
    echo "Connection string:"
    echo -e "  ${YELLOW}postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB${NC}"
    echo ""
    echo "psql command:"
    echo -e "  ${YELLOW}psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB${NC}"
    echo ""
}

# Main script logic
case "${1:-help}" in
    start)
        start_postgres
        ;;
    stop)
        stop_postgres
        ;;
    restart)
        restart_postgres
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    logs-f)
        follow_logs
        ;;
    ui-start)
        start_ui
        ;;
    ui-stop)
        stop_ui
        ;;
    psql)
        open_psql
        ;;
    backup)
        backup_postgres
        ;;
    restore)
        restore_postgres "$2"
        ;;
    reset)
        reset_postgres
        ;;
    clean)
        clean_postgres
        ;;
    info)
        show_info
        ;;
    help|*)
        print_usage
        ;;
esac
