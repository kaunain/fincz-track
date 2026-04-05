# Code Quality Configuration - Fincz Track

## Maven Compiler Plugin Configuration

All service `pom.xml` files have been updated with enhanced Maven compiler plugin configuration for automatic code validation.

### Configuration Details

**Updated Files:**
- `services/auth-service/pom.xml`
- `services/user-service/pom.xml`
- `services/portfolio-service/pom.xml`
- `services/market-data-service/pom.xml`
- `services/notification-service/pom.xml`
- `services/api-gateway/pom.xml`

**Settings:**
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <source>17</source>
        <target>17</target>
        <showWarnings>true</showWarnings>
        <showDeprecation>true</showDeprecation>
        <failOnWarning>false</failOnWarning>
        <compilerArgs>
            <arg>-Xlint:all</arg>
            <arg>-Xlint:-processing</arg>
        </compilerArgs>
        <annotationProcessorPaths>
            <path>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
            </path>
        </annotationProcessorPaths>
    </configuration>
</plugin>
```

### Lint Warnings Enabled

- **-Xlint:all**: Enables all recommended warnings
  - Unused variables
  - Missing serialVersionUID
  - Type safety issues
  - Unchecked casts
  - Deprecation warnings
  
- **-Xlint:-processing**: Excludes annotation processing warnings (to reduce noise from Lombok)

### Validation During Build

When building any service, the compiler will now:

1. **Report warnings** for code quality issues
2. **Not fail the build** on warnings (`failOnWarning=false`)
3. **Show deprecation warnings** for deprecated API usage
4. **Show all compiler warnings** with full context

### Example: Detecting Issues

**Build command:**
```bash
mvn clean compile
```

**Output:**
```
[WARNING] /path/to/file.java:[line,col] [warning message]
```

**Common warnings detected:**
- Unused imports (when variables are imported but not used)
- Missing `serialVersionUID` for serializable classes
- Type coercion warnings
- Unchecked generics

### Checkstyle Integration

The project also uses **Checkstyle** for code style validation:

**Active plugins:**
- maven-checkstyle-plugin v3.6.0 / v3.3.1
- Configuration file: `checkstyle.xml` (in each service root)

**Runs in:** `validate` phase

**Checks:**
- Header comments
- Naming conventions
- Code formatting
- Import statements
- Documentation requirements

**Current status**: Warnings only (failsOnError=false)

### Disabled Plugins (Needs Java 26 Update)

The following tools are configured but currently disabled due to Java version compatibility:

1. **PMD Plugin** (configured in pom.xml)
   - Use: Complex code analysis
   - Status: Disabled
   - Reason: Rule compatibility with PMD 7.3.0
   - Config: `pmd-ruleset.xml`

2. **SpotBugs Plugin** (configured in pom.xml)
   - Use: Runtime bug detection
   - Status: Disabled
   - Reason: Java 26 compatibility issues
   - Config: `spotbugs-exclude.xml`
   - Note: Has potential to detect unused imports

### JaCoCo Code Coverage

- **Status**: Enabled
- **Phases**: `test` and `verify`
- **Generates**: HTML coverage reports in `target/site/jacoco/`

### Usage

**To compile and check code quality:**
```bash
cd services/user-service
mvn clean compile
```

**To compile with full build:**
```bash
mvn clean package
```

**To run style checks only:**
```bash
mvn checkstyle:check
```

**To generate coverage report:**
```bash
mvn clean test jacoco:report
```

### Future Improvements

1. **Enable SpotBugs**: Once Java 26 compatibility is fully addressed
2. **Enable PMD**: Update ruleset for PMD 7.3.0 compatibility
3. **Fail on Critical Warnings**: Change `failOnWarning` to `true` for stricter enforcement
4. **Configure IDE Integration**: Import Checkstyle configuration in IDE settings

### IDE Integration (VS Code)

To see warnings in VS Code:
1. Install Checkstyle plugin: `ajermakovics.java-checkstyle`
2. Configure to use project's `checkstyle.xml`
3. Eclipse default formatter can be imported from project

### References

- [Maven Compiler Plugin Documentation](https://maven.apache.org/plugins/maven-compiler-plugin/)
- [Java Compiler Lint Warnings](https://docs.oracle.com/en/java/javase/17/docs/specs/man/javac.html)
- [Checkstyle Documentation](https://checkstyle.sourceforge.io/)
