# 🔧 Environment Configuration Guide

## Overview

Fincz Track uses environment variables for all configuration to ensure:
- ✅ Security (no hardcoded secrets)
- ✅ Flexibility (different environments without code changes)
- ✅ Production readiness (CI/CD friendly)
- ✅ Docker compatibility

## Quick Setup

### 1. Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env
```

### 2. Set Required Variables

```bash
# Essential - Must be set!
JWT_SECRET=your_base64_encoded_secret_key_here_minimum_32_bytes
DB_URL=postgresql://fincz_user:fincz_password@localhost:5432/fincz_db
DB_USER=fincz_user
DB_PASS=fincz_password
```

### 3. Load Environment (Optional)

```bash
# Load from .env file automatically when running services
./run-services.sh all

# Or manually export
export $(cat .env | grep -v '#' | xargs)
./run-services.sh all
```

## Environment Variables Reference

### 🔐 Security Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **YES** | - | Base64-encoded JWT secret (min 32 bytes) |
| `JWT_EXPIRATION` | NO | 86400000 | Token expiration in milliseconds |

**Generate JWT Secret:**
```bash
# Python
python3 -c "import base64, os; print(base64.b64encode(os.urandom(32)).decode())"

# OpenSSL
openssl rand -base64 32
```

### 🗄️ Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_URL` | **YES** | - | PostgreSQL connection URL |
| `DB_USER` | **YES** | - | Database username |
| `DB_PASS` | **YES** | - | Database password |
| `DB_POOL_SIZE` | NO | 10 | Connection pool size |
| `DB_CONNECTION_TIMEOUT` | NO | 20000 | Connection timeout (ms) |
| `DB_MAX_IDLE_TIME` | NO | 600000 | Max idle time (ms) |
| `JPA_HIBERNATE_DDL_AUTO` | NO | update | Schema auto-update mode |
| `JPA_SHOW_SQL` | NO | false | Log SQL queries |

**DB_URL Format:**
```
# PostgreSQL (Docker/Compose)
postgresql://user:password@postgres:5432/database_name

# PostgreSQL (Local)
postgresql://user:password@localhost:5432/database_name

# With SSL
postgresql://user:password@host:5432/database_name?sslmode=require
```

### 🌐 Microservices Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AUTH_SERVICE_URL` | NO | http://localhost:8081 | Auth service endpoint |
| `USER_SERVICE_URL` | NO | http://localhost:8082 | User service endpoint |
| `PORTFOLIO_SERVICE_URL` | NO | http://localhost:8083 | Portfolio service endpoint |
| `MARKET_SERVICE_URL` | NO | http://localhost:8084 | Market data service endpoint |
| `NOTIFICATION_SERVICE_URL` | NO | http://localhost:8085 | Notification service endpoint |

**Values for Different Environments:**
```bash
# Local Development
AUTH_SERVICE_URL=http://localhost:8081

# Docker Compose
AUTH_SERVICE_URL=http://auth-service:8081

# Production (with domain)
AUTH_SERVICE_URL=https://api.fincz.com/auth
```

### 📧 Email Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_HOST` | **YES** | - | SMTP server hostname |
| `EMAIL_PORT` | **YES** | - | SMTP port (usually 587 or 465) |
| `EMAIL_USERNAME` | **YES** | - | Email account username |
| `EMAIL_PASSWORD` | **YES** | - | Email account password |
| `EMAIL_FROM` | NO | noreply@fincz.com | Sender email address |

**Example for Gmail:**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password  # NOT your account password
EMAIL_FROM=noreply@your-domain.com
```

### 📊 Market Data Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MARKET_API_BASE_URL` | NO | https://api.example.com | Market data API endpoint |
| `MARKET_API_KEY` | **YES*** | - | API key for market data service |
| `MARKET_GOOGLE_SHEET_URL` | NO | - | Google Sheet CSV export URL for market data |

*Required only if using real market data API

### 🔔 Notification Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TAX_REMINDER_DAYS` | NO | 30 | Days before tax deadline for reminder |
| `PORTFOLIO_ALERT_THRESHOLD` | NO | 5.0 | Percentage change to trigger alert |
| `CACHE_TTL` | NO | 300000 | Cache time-to-live (ms) |

### 🐳 Docker Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POSTGRES_DB` | NO | fincz_db | PostgreSQL database name |
| `POSTGRES_USER` | NO | fincz_user | PostgreSQL username |
| `POSTGRES_PASSWORD` | NO | fincz_password | PostgreSQL password |
| `POSTGRES_PORT` | NO | 5432 | PostgreSQL port |

### 🎯 Server Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SERVER_PORT` | NO | 8080 | Server port (Gateway) |
| `SPRING_PROFILES_ACTIVE` | NO | dev | Spring profile (dev/test/prod) |
| `LOGGING_LEVEL_ROOT` | NO | INFO | Root logging level |
| `LOGGING_LEVEL_COM_FINCZ` | NO | DEBUG | Application logging level |

### 🔒 CORS Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | NO | http://localhost:5173 | Comma-separated allowed origins |

**Example with multiple origins:**
```bash
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://app.fincz.com
```

## Complete .env Example

```bash
# Security
JWT_SECRET=yzEGd1mDkZZWObvq4vm3EIW4k1cpNM71ZFP8AcLg/zg=
JWT_EXPIRATION=86400000

# Database (PostgreSQL via Docker)
DB_URL=postgresql://fincz_user:fincz_password@postgres:5432/fincz_db
DB_USER=fincz_user
DB_PASS=fincz_password
DB_POOL_SIZE=10

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@fincz.com

# Market Data
MARKET_API_KEY=your_market_api_key

# Notifications
TAX_REMINDER_DAYS=30
PORTFOLIO_ALERT_THRESHOLD=5.0

# Server
SPRING_PROFILES_ACTIVE=dev
```

## Running with Environment Variables

### Option 1: Load from .env file
```bash
# run-services.sh automatically loads .env if present
./run-services.sh all
```

### Option 2: Export before running
```bash
export $(cat .env | grep -v '#' | xargs)
./run-services.sh all
```

### Option 3: Inline environment variables
```bash
JWT_SECRET=$(openssl rand -base64 32) \
DB_URL=postgresql://user:pass@localhost:5432/db \
DB_USER=user \
DB_PASS=pass \
./run-services.sh all
```

### Option 4: Docker Compose
```bash
# Create .env in root directory
# docker-compose will automatically load it
docker-compose up -d

# Or explicitly pass .env file
docker-compose --env-file .env up -d
```

## Environment by Stage

### Development
```bash
SPRING_PROFILES_ACTIVE=dev
JPA_HIBERNATE_DDL_AUTO=update
JPA_SHOW_SQL=true
LOGGING_LEVEL_COM_FINCZ=DEBUG
```

### Production
```bash
SPRING_PROFILES_ACTIVE=prod
JPA_HIBERNATE_DDL_AUTO=validate
JPA_SHOW_SQL=false
LOGGING_LEVEL_COM_FINCZ=INFO
```

### Testing
```bash
SPRING_PROFILES_ACTIVE=test
JPA_HIBERNATE_DDL_AUTO=create-drop
```

## Security Best Practices

### ✅ DO:
- ✅ Generate strong JWT secrets (min 32 bytes)
- ✅ Use environment variables for all secrets
- ✅ Keep `.env` file in `.gitignore`
- ✅ Use different secrets per environment
- ✅ Rotate secrets regularly
- ✅ Use app-specific passwords (not account passwords)
- ✅ Store secrets in secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)

### ❌ DON'T:
- ❌ Commit `.env` file to git
- ❌ Share `.env` files via email or chat
- ❌ Use same secrets for dev and prod
- ❌ Hardcode secrets in application files
- ❌ Log sensitive information
- ❌ Check secrets into version control
- ❌ Use default/weak secrets

## Troubleshooting

### Service won't start
```bash
# Check if variables are set
echo $JWT_SECRET
echo $DB_URL

# Load variables and try again
set -a
source .env
set +a
./run-services.sh all
```

### Database connection error
```bash
# Verify connection string format
# Should be: postgresql://user:password@host:port/database

# Test connection
psql "postgresql://user:password@localhost:5432/database"
```

### JWT validation fails
```bash
# Ensure JWT_SECRET is same across all services
# Regenerate if needed
python3 -c "import base64, os; print(base64.b64encode(os.urandom(32)).decode())"
```

## CI/CD Integration

### GitHub Actions
```yaml
env:
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
  DB_URL: ${{ secrets.DB_URL }}
  DB_USER: ${{ secrets.DB_USER }}
  DB_PASS: ${{ secrets.DB_PASS }}
```

### GitLab CI
```yaml
variables:
  JWT_SECRET: $JWT_SECRET
  DB_URL: $DB_URL
  DB_USER: $DB_USER
  DB_PASS: $DB_PASS
```

## Validation Checklist

Before running services, ensure:

- [ ] `.env` file created from `.env.example`
- [ ] `JWT_SECRET` set (generated with 32+ bytes)
- [ ] `DB_URL` configured correctly
- [ ] `DB_USER` and `DB_PASS` set
- [ ] PostgreSQL database is running
- [ ] Email credentials configured (if using notifications)
- [ ] All required variables are present
- [ ] MySQL password doesn't contain special chars (if using MySQL)

Run this to validate:
```bash
bash -c 'source .env && \
echo "JWT_SECRET: ${JWT_SECRET:0:10}..." && \
echo "DB_URL: $DB_URL" && \
echo "DB_USER: $DB_USER" && \
echo "EMAIL_HOST: $EMAIL_HOST"'
```

---

**Last Updated**: April 2026  
**Version**: 1.0  
**Status**: ✅ Production Ready
