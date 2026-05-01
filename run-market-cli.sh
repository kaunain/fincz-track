#!/bin/bash
#
# Market Data CLI Runner Script
# Usage: ./run-market-cli.sh [command] [options]
#
# Commands:
#   ./run-market-cli.sh sync           - Sync all stock prices to DB
#   ./run-market-cli.sh sync force    - Force sync ignoring cooldown
#   ./run-market-cli.sh list          - List all stored prices
#   ./run-market-cli.sh price RELIANCE - Get price for specific symbol
#   ./run-market-cli.sh help          - Show help
#

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JAR_FILE="$SCRIPT_DIR/services/market-data-service/target/market-data-service-0.0.1-SNAPSHOT.jar"

# Load environment variables from .env if exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a  # Auto-export all variables
    source "$SCRIPT_DIR/.env"
    set +a
fi

# Default values (override in .env file)
DB_URL="${DB_URL:-jdbc:postgresql://localhost:5432/fincz}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-}"
MARKET_API_KEY="${MARKET_API_KEY:-}"
JWT_TOKEN="${JWT_TOKEN:-}"
INTERNAL_TOKEN="${INTERNAL_TOKEN:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print error and exit
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Function to print info
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Function to print warning
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if JAR exists
if [ ! -f "$JAR_FILE" ]; then
    error_exit "JAR file not found: $JAR_FILE"
fi

# Check required environment variables
check_env() {
    local missing=0
    
    if [ -z "$DB_URL" ]; then
        warn "DB_URL not set"
        missing=1
    fi
    if [ -z "$DB_USER" ]; then
        warn "DB_USER not set"
        missing=1
    fi
    if [ -z "$DB_PASS" ]; then
        warn "DB_PASS not set"
        missing=1
    fi
    if [ -z "$MARKET_API_KEY" ]; then
        warn "MARKET_API_KEY not set (stock prices may fail)"
    fi
    
    if [ $missing -eq 1 ]; then
        info "Tip: Create a .env file in project root with these variables:"
        echo "  DB_URL=jdbc:postgresql://localhost:5432/fincz"
        echo "  DB_USER=postgres"
        echo "  DB_PASS=your_password"
        echo "  MARKET_API_KEY=your_alpha_vantage_key"
    fi
}

# Run the CLI
run_cli() {
    check_env
    
    info "Starting Market Data CLI..."
    info "JAR: $JAR_FILE"
    info "Command: $@"
    
    # Disable web server for CLI mode
    java -Dspring.main.web-application-type=none -jar "$JAR_FILE" "$@"
    exit $?
}

# Show help
show_help() {
    cat << 'EOF'
╔════════════════════════════════════════════════════════════╗
║         Market Data CLI - Stock Price Sync Tool            ║
╚════════════════════════════════════════════════════════════╝

Usage:
  ./run-market-cli.sh <command> [options]

Commands:
  sync [force]       Sync all stock prices from API to DB
                      Use 'force' to ignore cooldown period
  sync-symbol <SYM> Sync specific symbol (no portfolio service needed)
                      Use 'force' as 3rd arg to ignore cooldown
  list               List all stored stock prices
  price <SYMBOL>     Get price for specific symbol
  help               Show this help message

Examples:
  ./run-market-cli.sh sync
  ./run-market-cli.sh sync force
  ./run-market-cli.sh list
  ./run-market-cli.sh price RELIANCE

Environment Variables (set in .env file or export):
  DB_URL          PostgreSQL database URL
  DB_USER         Database username
  DB_PASS         Database password
  MARKET_API_KEY  Alpha Vantage API key
  JWT_TOKEN       JWT token for portfolio service

Cron Example (run daily at 1 AM):
  0 1 * * * /home/ahmad/JIDE/fincz-track/run-market-cli.sh sync >> /var/log/market-sync.log 2>&1
EOF
}

# Main script
case "${1:-help}" in
    sync)
        if [ "$2" = "force" ]; then
            run_cli --sync --force
        else
            run_cli --sync
        fi
        ;;
    sync-symbol)
        if [ -z "$2" ]; then
            error_exit "Symbol required: ./run-market-cli.sh sync-symbol RELIANCE"
        fi
        if [ "$3" = "force" ]; then
            run_cli --sync-symbol "$2" --force
        else
            run_cli --sync-symbol "$2"
        fi
        ;;
    list)
        run_cli --list
        ;;
    price)
        if [ -z "$2" ]; then
            error_exit "Symbol required: ./run-market-cli.sh price RELIANCE"
        fi
        run_cli --price "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac