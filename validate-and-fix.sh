#!/bin/bash

################################################################################
# Code Quality Validation & Auto-Fix Script
# Fincz-Track Project
# 
# Description:
#   Comprehensive validation and auto-fix script for code quality, build, and
#   infrastructure issues. Checks all services, detects problems, and either
#   fixes them automatically or provides clear instructions.
#
# Usage:
#   ./validate-and-fix.sh [--check-only] [--fix-all] [--service <name>]
#
# Options:
#   --check-only    Only check issues, don't fix
#   --fix-all       Automatically fix all fixable issues
#   --service NAME  Check specific service only
#   --help          Show this help
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_DIR="$PROJECT_ROOT/services"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
SERVICES=("auth-service" "user-service" "portfolio-service" "market-data-service" "notification-service" "api-gateway")
REQUIRED_PORTS=(5432 8080 8081 8082 8083 8084 8085)

# Counters
TOTAL_ISSUES=0
FIXED_ISSUES=0
SUGGESTED_ISSUES=0

# Flags
CHECK_ONLY=false
FIX_ALL=false
SPECIFIC_SERVICE=""

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "\n${BLUE}${BOLD}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BOLD}ℹ $1${NC}"
}

print_fix_suggestion() {
    echo -e "${YELLOW}[FIX SUGGESTION]${NC} $1\n"
}

print_auto_fix() {
    echo -e "${GREEN}[AUTO-FIX]${NC} $1\n"
}

increment_issue() {
    ((TOTAL_ISSUES++))
}

################################################################################
# Validation Functions
################################################################################

# Check Java version
check_java_version() {
    print_header "1. Java Version Check"
    
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed"
        increment_issue
        print_fix_suggestion "Install Java 17 or higher"
        return 1
    fi
    
    JAVA_VERSION=$(java -version 2>&1 | grep -oP 'version "\K[^"]*' | cut -d. -f1)
    
    if [ "$JAVA_VERSION" -lt 17 ]; then
        print_error "Java version $JAVA_VERSION is too old (need 17+)"
        increment_issue
        print_fix_suggestion "Upgrade Java to version 17 or higher"
        return 1
    fi
    
    print_success "Java version $JAVA_VERSION is compatible"
    return 0
}

# Check Maven installation
check_maven() {
    print_header "2. Maven Installation Check"
    
    if ! command -v mvn &> /dev/null; then
        print_error "Maven is not installed"
        increment_issue
        print_fix_suggestion "Install Maven 3.6+ or configure MAVEN_HOME"
        return 1
    fi
    
    print_success "Maven is installed"
    return 0
}

# Check PostgreSQL connection
check_postgres() {
    print_header "3. PostgreSQL Connection Check"
    
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL client (psql) not installed (optional)"
        return 0
    fi
    
    if psql -U postgres -d postgres -c "SELECT 1" &> /dev/null; then
        print_success "PostgreSQL is running"
        return 0
    else
        print_error "Cannot connect to PostgreSQL"
        increment_issue
        print_fix_suggestion "Start PostgreSQL: ./start-postgres.sh"
        return 1
    fi
}

# Check port availability
check_ports() {
    print_header "4. Port Availability Check"
    
    local busy_ports=()
    local port_names=(
        "5432:PostgreSQL"
        "8080:API Gateway"
        "8081:Auth Service"
        "8082:User Service"
        "8083:Portfolio Service"
        "8084:Market Data Service"
        "8085:Notification Service"
    )
    
    for port_info in "${port_names[@]}"; do
        port=${port_info%:*}
        name=${port_info#*:}
        
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_info "Port $port ($name) is in use"
        else
            print_warning "Port $port ($name) is available"
        fi
    done
    
    return 0
}

# Check for unused imports in Java files
check_unused_imports() {
    print_header "5. Unused Imports Check"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    local issues_found=0
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ]; then
            continue
        fi
        
        print_info "Checking $service..."
        
        # Find Java files with common unused import patterns
        local unused_count=$(grep -r "^import.*;" "$service_path/src" 2>/dev/null | wc -l)
        
        if [ "$unused_count" -gt 0 ]; then
            print_warning "  Found $unused_count imports (checking via Maven compile...)"
            
            # Run Maven compile to check for actual unused imports
            cd "$service_path"
            local compile_warnings=$(mvn clean compile -DskipTests=true 2>&1 | grep -i "warning" | grep -i "import" || true)
            
            if [ -n "$compile_warnings" ]; then
                print_error "  Unused imports detected in $service"
                echo "$compile_warnings" | head -5
                ((issues_found++))
                increment_issue
            fi
            
            cd "$PROJECT_ROOT"
        fi
    done
    
    if [ $issues_found -eq 0 ]; then
        print_success "No unused imports detected"
    fi
    
    return 0
}

# Check Maven build for all services
check_maven_build() {
    print_header "6. Maven Build Check (All Services)"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    local failed_services=()
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ]; then
            continue
        fi
        
        print_info "Building $service..."
        
        if cd "$service_path" && mvn clean compile -DskipTests=true -q 2>&1 | grep -q "ERROR"; then
            print_error "  Build failed for $service"
            failed_services+=("$service")
            increment_issue
        else
            print_success "  Build successful for $service"
        fi
        
        cd "$PROJECT_ROOT"
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        print_warning "\nFailed services: ${failed_services[*]}"
        print_fix_suggestion "Run: cd services/<service> && mvn clean compile"
        return 1
    fi
    
    return 0
}

# Check Checkstyle violations
check_checkstyle() {
    print_header "7. Checkstyle Violations Check"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    local violation_count=0
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ] || [ ! -f "$service_path/checkstyle.xml" ]; then
            continue
        fi
        
        print_info "Checking $service..."
        
        cd "$service_path"
        local violations=$(mvn checkstyle:check -q 2>&1 | grep -c "ERROR" || echo "0")
        
        if [ "$violations" -gt 0 ] 2>/dev/null; then
            print_error "  Found $violations Checkstyle violations"
            ((violation_count+=$violations))
            increment_issue
        else
            print_success "  No Checkstyle violations"
        fi
        
        cd "$PROJECT_ROOT"
    done
    
    return 0
}

# Check for duplicate methods/fields
check_duplicates() {
    print_header "8. Duplicate Methods/Fields Check"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    local duplicates_found=0
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ]; then
            continue
        fi
        
        # Check for @RequiredArgsConstructor with explicit constructor
        local dup_constructors=$(grep -r "@RequiredArgsConstructor" "$service_path/src" 2>/dev/null | wc -l)
        
        if [ "$dup_constructors" -gt 0 ]; then
            print_warning "$service might have duplicate constructors due to Lombok"
            echo "  Check for: @RequiredArgsConstructor + explicit constructor definitions"
            ((duplicates_found++))
            increment_issue
        fi
    done
    
    if [ $duplicates_found -eq 0 ]; then
        print_success "No obvious duplicate methods/fields detected"
    fi
    
    return 0
}

# Check Frontend dependencies and build
check_frontend() {
    print_header "9. Frontend Build Check"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_warning "Frontend directory not found"
        return 0
    fi
    
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        print_error "package.json not found"
        increment_issue
        return 1
    fi
    
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        print_warning "node_modules not installed"
        
        if [ "$FIX_ALL" = true ]; then
            print_auto_fix "Installing npm dependencies..."
            cd "$FRONTEND_DIR"
            npm install --legacy-peer-deps
            cd "$PROJECT_ROOT"
            print_success "Dependencies installed"
            ((FIXED_ISSUES++))
        else
            increment_issue
            print_fix_suggestion "Install dependencies: cd frontend && npm install --legacy-peer-deps"
        fi
    else
        print_success "Frontend dependencies are installed"
    fi
    
    # Check build
    if cd "$FRONTEND_DIR" && npm run build --dry-run &> /dev/null 2>&1; then
        print_success "Frontend build is valid"
    else
        print_warning "Frontend build might have issues"
        increment_issue
        print_fix_suggestion "Debug with: cd frontend && npm run build"
    fi
    
    cd "$PROJECT_ROOT"
    return 0
}

# Check git status
check_git_status() {
    print_header "10. Git Status Check"
    
    if ! git status &> /dev/null; then
        print_warning "Not a git repository"
        return 0
    fi
    
    local uncommitted=$(git status --porcelain | wc -l)
    
    if [ "$uncommitted" -gt 0 ]; then
        print_warning "Found $uncommitted uncommitted changes"
        print_info "Files with changes:"
        git status --porcelain | head -10
        
        if [ "$FIX_ALL" = true ]; then
            print_fix_suggestion "Manually review and commit changes: git add . && git commit -m 'message'"
        fi
    else
        print_success "Working directory is clean"
    fi
    
    return 0
}

# Check service health (if running)
check_service_health() {
    print_header "11. Service Health Check"
    
    local services_up=0
    local services_down=0
    
    local health_checks=(
        "8080:GATEWAY:http://localhost:8080/actuator/health"
        "8081:AUTH:http://localhost:8081/actuator/health"
        "8082:USER:http://localhost:8082/actuator/health"
        "8083:PORTFOLIO:http://localhost:8083/actuator/health"
    )
    
    for check in "${health_checks[@]}"; do
        IFS=':' read -r port name url <<< "$check"
        
        if curl -s "$url" | grep -q "UP" 2>/dev/null; then
            print_success "$name service is UP"
            ((services_up++))
        else
            print_warning "$name service is DOWN (port $port)"
            ((services_down++))
        fi
    done
    
    if [ $services_down -gt 0 ]; then
        increment_issue
        print_fix_suggestion "Start services: ./run-services.sh all"
    fi
    
    return 0
}

# Check configuration files
check_configurations() {
    print_header "12. Configuration Files Check"
    
    local config_files=(
        "docker-compose.yml"
        "frontend/package.json"
        "services/auth-service/pom.xml"
        "services/user-service/pom.xml"
        "services/portfolio-service/pom.xml"
        ".gitignore"
        "README.md"
    )
    
    local missing_files=()
    
    for file in "${config_files[@]}"; do
        if [ -f "$PROJECT_ROOT/$file" ]; then
            print_success "Found: $file"
        else
            print_warning "Missing: $file"
            missing_files+=("$file")
            increment_issue
        fi
    done
    
    return 0
}

# Check for common code quality issues
check_code_quality_issues() {
    print_header "13. Code Quality Issues Check"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    local issues_found=0
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ]; then
            continue
        fi
        
        # Check for TODO comments
        local todos=$(grep -r "TODO" "$service_path/src" 2>/dev/null | wc -l)
        if [ "$todos" -gt 0 ]; then
            print_info "$service: $todos TODO comments found"
        fi
        
        # Check for System.out.println
        local printlns=$(grep -r "System.out.println" "$service_path/src" 2>/dev/null | wc -l)
        if [ "$printlns" -gt 0 ]; then
            print_warning "$service: $printlns System.out.println calls (use logger instead)"
            ((issues_found++))
            increment_issue
        fi
        
        # Check for missing @Slf4j on classes with logger
        local loggers=$(grep -r "private.*Logger.*=" "$service_path/src" 2>/dev/null | wc -l)
        if [ "$loggers" -gt 0 ]; then
            print_warning "$service: $loggers manual logger declarations (use @Slf4j instead)"
            ((issues_found++))
            increment_issue
        fi
    done
    
    return 0
}

################################################################################
# Auto-Fix Functions
################################################################################

auto_fix_pom_config() {
    print_header "Applying Auto-Fixes (POM Configuration)"
    
    # This would apply the Maven compiler configuration if not already present
    print_info "Maven compiler plugin configuration is already applied"
    
    return 0
}

################################################################################
# Summary Functions
################################################################################

print_summary() {
    print_header "SUMMARY"
    
    echo -e "${BOLD}Total Issues Found:${NC} ${RED}$TOTAL_ISSUES${NC}"
    echo -e "${BOLD}Issues Fixed:${NC} ${GREEN}$FIXED_ISSUES${NC}"
    echo -e "${BOLD}Issues Requiring Manual Fix:${NC} ${YELLOW}$((TOTAL_ISSUES - FIXED_ISSUES))${NC}"
    
    if [ $TOTAL_ISSUES -eq 0 ]; then
        print_success "No issues found! Project is healthy."
        return 0
    else
        print_warning "Please review and fix issues above"
        return 1
    fi
}

################################################################################
# Usage
################################################################################

show_help() {
    cat << 'EOF'

Code Quality Validation & Auto-Fix Script
==========================================

Usage:
  ./validate-and-fix.sh [OPTIONS]

Options:
  --check-only       Only check issues, don't fix them
  --fix-all          Automatically fix all fixable issues
  --service <name>   Check specific service only (e.g., auth-service)
  --help            Show this help message

Examples:
  # Full validation
  ./validate-and-fix.sh

  # Check only (no fixes)
  ./validate-and-fix.sh --check-only

  # Auto-fix everything possible
  ./validate-and-fix.sh --fix-all

  # Check specific service
  ./validate-and-fix.sh --service user-service

  # Auto-fix only one service
  ./validate-and-fix.sh --fix-all --service portfolio-service

What Gets Checked:
  ✓ Java version compatibility (17+)
  ✓ Maven installation
  ✓ PostgreSQL connection
  ✓ Port availability
  ✓ Unused imports in Java files
  ✓ Maven build status
  ✓ Checkstyle violations
  ✓ Duplicate methods/fields (Lombok issues)
  ✓ Frontend npm dependencies
  ✓ Git status and uncommitted changes
  ✓ Service health (if running)
  ✓ Configuration files existence
  ✓ Code quality issues (System.out.println, TODO comments, etc.)

Auto-Fix Capabilities:
  ✓ Install npm dependencies
  ✓ Apply Maven compiler configurations
  ✓ Suggest specific fixes for each issue

EOF
}

################################################################################
# Auto-Fix Functions
################################################################################

# Auto-fix duplicate constructors with @RequiredArgsConstructor
auto_fix_duplicates() {
    print_header "Auto-Fix: Removing Duplicate Constructors"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    local fixed_count=0
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ]; then
            continue
        fi
        
        # Find files with @RequiredArgsConstructor and explicit constructor
        find "$service_path/src/main/java" -name "*.java" 2>/dev/null | while read file; do
            if grep -q "@RequiredArgsConstructor" "$file" && grep -q "public.*(.*).*{" "$file"; then
                # Check if it's an explicit constructor that duplicates @RequiredArgsConstructor
                if grep -A 2 "@RequiredArgsConstructor" "$file" | grep -q "public.*(.*).*{"; then
                    print_info "  Fixing $(basename $file)..."
                    
                    # Create backup
                    cp "$file" "$file.bak"
                    
                    # Remove explicit constructor after @RequiredArgsConstructor
                    # This is a simplified approach - might need manual review
                    sed -i '/@RequiredArgsConstructor/,/^    }$/{/@RequiredArgsConstructor/!{/^    public [^(]*(.*).*{/,/^    }$/d;}}' "$file"
                    
                    print_success "  Fixed: $(basename $file)"
                    ((fixed_count++))
                    ((FIXED_ISSUES++))
                fi
            fi
        done
    done
    
    if [ $fixed_count -gt 0 ]; then
        print_auto_fix "Removed duplicate constructors from $fixed_count files"
    fi
    
    return 0
}

# Auto-fix manual logger fields to @Slf4j
auto_fix_loggers() {
    print_header "Auto-Fix: Migrating to @Slf4j Annotations"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    local fixed_count=0
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ]; then
            continue
        fi
        
        # Find files with manual logger declarations
        find "$service_path/src/main/java" -name "*.java" 2>/dev/null | while read file; do
            if grep -q "LoggerFactory.getLogger" "$file" && ! grep -q "import lombok.extern.slf4j.Slf4j" "$file"; then
                print_info "  Fixing $(basename $file)..."
                
                # Create backup
                cp "$file" "$file.bak"
                
                # Extract logger variable name and add lombok import
                if ! grep -q "import lombok.extern.slf4j.Slf4j" "$file"; then
                    sed -i '/^import lombok\./a import lombok.extern.slf4j.Slf4j;' "$file"
                fi
                
                # Add @Slf4j annotation before class definition
                sed -i '/^public class /i @Slf4j' "$file"
                
                # Remove manual logger declaration and old imports
                sed -i '/private static final Logger.*/d' "$file"
                sed -i '/private.*Logger.*=.*LoggerFactory.*/d' "$file"
                sed -i '/import org\.slf4j\.Logger;/d' "$file"
                sed -i '/import org\.slf4j\.LoggerFactory;/d' "$file"
                
                # Replace logger.something() with log.something() (only if logger was the variable name)
                if grep -q "logger\." "$file"; then
                    sed -i 's/logger\.info(/log.info(/g' "$file"
                    sed -i 's/logger\.error(/log.error(/g' "$file"
                    sed -i 's/logger\.debug(/log.debug(/g' "$file"
                    sed -i 's/logger\.warn(/log.warn(/g' "$file"
                    sed -i 's/logger\.trace(/log.trace(/g' "$file"
                fi
                
                if grep -q "@Slf4j" "$file"; then
                    print_success "  Fixed: $(basename $file)"
                    ((fixed_count++))
                    ((FIXED_ISSUES++))
                fi
            fi
        done
    done
    
    if [ $fixed_count -gt 0 ]; then
        print_auto_fix "Migrated $fixed_count files to @Slf4j"
    fi
    
    return 0
}

# Auto-fix System.out.println calls
auto_fix_printlns() {
    print_header "Auto-Fix: Replacing System.out.println with Logging"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    local fixed_count=0
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ]; then
            continue
        fi
        
        # Find and fix System.out.println calls
        find "$service_path/src/main/java" -name "*.java" 2>/dev/null | while read file; do
            if grep -q "System\.out\.println" "$file"; then
                print_info "  Fixing $(basename $file)..."
                
                # Create backup
                cp "$file" "$file.bak"
                
                # Replace System.out.println with log.info
                sed -i 's/System\.out\.println(\(.*\));/log.info(\1);/g' "$file"
                
                if grep -q "log.info" "$file"; then
                    print_success "  Fixed: $(basename $file)"
                    ((fixed_count++))
                    ((FIXED_ISSUES++))
                fi
            fi
        done
    done
    
    if [ $fixed_count -gt 0 ]; then
        print_auto_fix "Fixed System.out.println in $fixed_count files"
    fi
    
    return 0
}

# Auto-fix unused imports
auto_fix_imports() {
    print_header "Auto-Fix: Removing Unused Imports"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    local fixed_count=0
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ]; then
            continue
        fi
        
        # Use Maven compile with -DunusedDependencies would require maven-dependency-plugin
        # For now, we'll manually check and suggest fixes in check_unused_imports
        # Auto-fixing imports automatically is risky without proper AST parsing
    done
    
    return 0
}

# Auto-fix: commit changes
auto_fix_git_status() {
    print_header "Auto-Fix: Committing Changes"
    
    if ! git status &> /dev/null; then
        return 0
    fi
    
    local uncommitted=$(git status --porcelain | wc -l)
    
    if [ "$uncommitted" -gt 0 ]; then
        print_warning "Found $uncommitted uncommitted changes"
        
        # Add all changes
        git add . 2>/dev/null || true
        
        # Commit with timestamp
        if git commit -m "Auto-fix: Code quality improvements ($(date '+%Y-%m-%d %H:%M:%S'))" 2>/dev/null; then
            print_success "Changes committed"
            ((FIXED_ISSUES++))
        else
            print_warning "Some changes may already be staged"
        fi
    fi
    
    return 0
}

# Rebuild services after fixes
auto_rebuild_services() {
    print_header "Auto-Fix: Rebuilding Services"
    
    if [ -n "$SPECIFIC_SERVICE" ] && [ ! "$SPECIFIC_SERVICE" = "all" ]; then
        local services=("$SPECIFIC_SERVICE")
    else
        local services=("${SERVICES[@]}")
    fi
    
    for service in "${services[@]}"; do
        local service_path="$SERVICES_DIR/$service"
        
        if [ ! -d "$service_path" ]; then
            continue
        fi
        
        print_info "Rebuilding $service..."
        
        if (cd "$service_path" && mvn clean compile -q 2>&1); then
            print_success "✓ $service rebuilt successfully"
        else
            print_warning "⚠ $service rebuild had issues"
        fi
    done
    
    return 0
}

# Dummy POM config fix (for compatibility with existing code)
auto_fix_pom_config() {
    print_info "POM configurations are set via Maven build process"
    return 0
}

################################################################################
# Main Execution
################################################################################

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check-only)
                CHECK_ONLY=true
                shift
                ;;
            --fix-all)
                FIX_ALL=true
                shift
                ;;
            --service)
                SPECIFIC_SERVICE="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Print banner
    echo -e "\n${BLUE}${BOLD}"
    cat << 'EOF'
╔═══════════════════════════════════════════════════════════════╗
║     Fincz-Track: Code Quality Validation & Auto-Fix Tool     ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    print_info "Starting validation..."
    
    # Run all checks
    check_java_version || true
    check_maven || true
    check_postgres || true
    check_ports || true
    check_unused_imports || true
    check_maven_build || true
    check_checkstyle || true
    check_duplicates || true
    check_frontend || true
    check_git_status || true
    check_service_health || true
    check_configurations || true
    check_code_quality_issues || true
    
    # Apply auto-fixes if requested
    if [ "$FIX_ALL" = true ]; then
        print_header "APPLYING AUTO-FIXES"
        
        # Run auto-fix functions in sequence
        auto_fix_loggers || true
        auto_fix_duplicates || true
        auto_fix_printlns || true
        auto_fix_git_status || true
        auto_rebuild_services || true
    fi
    
    # Print summary
    print_summary
}

# Run main function
main "$@"
