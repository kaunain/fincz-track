# Code Quality Validation & Auto-Fix Script

## Overview

This comprehensive bash script validates the entire Fincz-Track project for code quality issues, configuration problems, and infrastructure readiness. It can either report issues or automatically fix them.

## Quick Start

```bash
# Make executable (first time only)
chmod +x validate-and-fix.sh

# Run full validation
./validate-and-fix.sh

# Check only (don't fix)
./validate-and-fix.sh --check-only

# Auto-fix all issues
./validate-and-fix.sh --fix-all

# Check specific service
./validate-and-fix.sh --service user-service

# Auto-fix one service
./validate-and-fix.sh --fix-all --service portfolio-service
```

## What Gets Checked

### 1. **Java Version** ✓
- Verifies Java 17+ is installed
- **Auto-fix**: None (requires manual Java upgrade)
- **Manual fix**: Install Java 17 from [java.com](https://www.oracle.com/java/technologies/downloads/)

### 2. **Maven Installation** ✓
- Checks if Maven is available in PATH
- **Auto-fix**: None
- **Manual fix**: Install Apache Maven 3.6+

### 3. **PostgreSQL Connection** ✓
- Attempts to connect to PostgreSQL (optional)
- **Auto-fix**: None
- **Manual fix**: `./start-postgres.sh` or `/docker-compose.yml`

### 4. **Port Availability** ✓
- Checks all required ports (5432, 8080-8085)
- **Auto-fix**: None (process cleanup advice)
- **Manual fix**: `killall java` or `lsof -i :PORT -t | xargs kill -9`

### 5. **Unused Imports** ✓
- Scans Java files for unused imports
- Runs Maven compile with lint warnings
- **Auto-fix**: None (Pylance/IDE auto-fix recommended)
- **Manual fix**: IDE shows unused imports with quick-fix option

### 6. **Maven Build** ✓
- Compiles all services
- **Auto-fix**: None
- **Manual fix**: `mvn clean compile` in each service directory

### 7. **Checkstyle Violations** ✓
- Validates code style against `checkstyle.xml`
- **Auto-fix**: None (requires code formatting)
- **Manual fix**: `mvn checkstyle:check` to see violations

### 8. **Duplicate Methods/Fields** ✓
- Detects Lombok annotation issues (@RequiredArgsConstructor with explicit constructor)
- **Auto-fix**: Will suggest removal of duplicate constructors
- **Manual fix**: Remove explicit constructors when using `@RequiredArgsConstructor`

### 9. **Frontend Dependencies** ✓
- Checks if npm dependencies are installed
- Validates frontend build
- **Auto-fix**: `npm install --legacy-peer-deps` ✓
- **Manual fix**: `cd frontend && npm install`

### 10. **Git Status** ✓
- Checks for uncommitted changes
- **Auto-fix**: None (requires manual commit)
- **Manual fix**: `git add . && git commit -m 'message'`

### 11. **Service Health** ✓
- Pings actuator endpoints (if services are running)
- **Auto-fix**: None
- **Manual fix**: `./run-services.sh all`

### 12. **Configuration Files** ✓
- Verifies essential config files exist
- **Auto-fix**: None
- **Manual fix**: Create missing files based on templates

### 13. **Code Quality** ✓
- Detects System.out.println (use logger instead)
- Finds manual logger declarations (use @Slf4j instead)
- Counts TODO comments
- **Auto-fix**: Partial (suggest @Slf4j usage)
- **Manual fix**: Replace with proper logger annotations

## Usage Examples

### Full Validation Report
```bash
./validate-and-fix.sh
```

Checks all 13 aspects and provides:
- ✓/✗ status for each check
- Count of issues found
- Specific fix suggestions
- Summary at the end

### Check Only (No Fixes)
```bash
./validate-and-fix.sh --check-only
```

Only reports issues without attempting any fixes. Good for CI/CD pipelines.

### Auto-Fix Everything
```bash
./validate-and-fix.sh --fix-all
```

Automatically fixes all fixable issues:
- Installs npm dependencies
- Applies Maven configurations
- Provides detailed suggestions for manual fixes

### Check Single Service
```bash
./validate-and-fix.sh --service user-service
```

Validates only the specified service:
- Checks Maven build
- Validates code quality
- Reviews Lombok usage
- Checks Checkstyle

### Combined Options
```bash
# Auto-fix only portfolio-service
./validate-and-fix.sh --fix-all --service portfolio-service

# Check only auth-service (no fixes)
./validate-and-fix.sh --check-only --service auth-service
```

## Output Format

### Color-Coded Messages
```
✓ GREEN   = Success / Healthy
✗ RED     = Error / Failed
⚠ YELLOW  = Warning / Needs Attention
ℹ BLUE    = Information / Status
```

### Issue Types

**Auto-Fixed** (shown in GREEN [AUTO-FIX]:
- npm dependencies installation
- Maven compiler configurations

**Suggested Fixes** (shown in YELLOW [FIX SUGGESTION]):
- Java upgrade
- Maven/Java installation
- Service startup commands
- Build commands with exact paths

**Manual Investigation** (shown in RED ✗):
- Build failures
- Checkstyle violations
- Duplicate method definitions
- Port conflicts

## Sample Output

```
╔═══════════════════════════════════════════════════════════════╗
║     Fincz-Track: Code Quality Validation & Auto-Fix Tool     ║
╚═══════════════════════════════════════════════════════════════╝

ℹ Starting validation...

=== 1. Java Version Check ===
✓ Java version 26 is compatible

=== 2. Maven Installation Check ===
✓ Maven is installed

=== 6. Maven Build Check (All Services) ===
ℹ Building user-service...
✓   Build successful for user-service

⚠ auth-service might have duplicate constructors due to Lombok
  Check for: @RequiredArgsConstructor + explicit constructor definitions

=== SUMMARY ===
Total Issues Found: 3
Issues Fixed: 0
Issues Requiring Manual Fix: 3
⚠ Please review and fix issues above
```

## Exit Codes

- `0` - All checks passed (0 issues found)
- `1` - Issues found (see summary)

## Integration with CI/CD

```bash
#!/bin/bash
# .github/workflows/validate.yml or equivalent

./validate-and-fix.sh --check-only
if [ $? -ne 0 ]; then
    echo "Code quality checks failed!"
    exit 1
fi
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or stop all Java services
killall java
```

### Build Failures
```bash
# Clean and rebuild
cd services/user-service
mvn clean compile
```

### Duplicate Constructor Errors
```bash
# Remove explicit constructor when using @RequiredArgsConstructor
# Wrong:
@RequiredArgsConstructor
public class MyClass {
    private final Dependency dep;
    
    public MyClass(Dependency dep) { // REMOVE THIS
        this.dep = dep;
    }
}

# Correct:
@RequiredArgsConstructor
public class MyClass {
    private final Dependency dep;
    // Constructor generated by @RequiredArgsConstructor
}
```

## Future Enhancements

- [ ] Database schema validation
- [ ] Automatic dependency update checks
- [ ] Docker container health checks
- [ ] Load testing validation
- [ ] Security vulnerability scanning
- [ ] Auto-fix for unused imports
- [ ] Performance profiling

## Requirements

- Bash 4.0+
- Java 17+
- Maven 3.6+
- Git
- PostgreSQL (optional)
- npm/Node.js (for frontend checks)

## Related Documentation

- [CODE_QUALITY_SETUP.md](./CODE_QUALITY_SETUP.md) - Maven compiler configuration details
- [README.md](./README.md) - Project overview
- [QUICK_START.md](./QUICK_START.md) - Getting started guide

## Support

For issues or suggestions:
1. Run the script with `--check-only` to get a full report
2. Review the specific service's logs
3. Check the error message in the [FIX SUGGESTION] block
4. Follow the recommended manual fix commands

---

**Last Updated**: April 5, 2026  
**Maintained By**: Fincz Development Team
