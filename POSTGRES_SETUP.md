# Fincz Track - PostgreSQL Configuration Guide

## 🐘 PostgreSQL Setup with Docker

This project uses PostgreSQL running in Docker for persistent data storage across all microservices.

---

## 📦 Prerequisites

- Docker installed and running
- Docker Compose installed
- .env.postgres file configured (see Configuration section)

---

## 🚀 Quick Start

### 1. Start PostgreSQL Only

```bash
# Using the start script
./start-postgres.sh

# Or using the management script
./manage-postgres.sh start
```

### 2. Start Everything (PostgreSQL + All Services)

```bash
chmod +x start-all.sh
./start-all.sh
```

### 3. Stop PostgreSQL

```bash
./stop-postgres.sh

# Or using the management script
./manage-postgres.sh stop
```

---

## 📋 Available Management Scripts

### `./start-postgres.sh`
Starts PostgreSQL container with proper initialization

```bash
./start-postgres.sh
```

Output shows connection details:
- Host: localhost
- Port: 5432
- User: fincz_user
- Database: fincz_db

---

### `./stop-postgres.sh`
Stops and optionally removes PostgreSQL container and data

```bash
./stop-postgres.sh
```

---

### `./manage-postgres.sh [COMMAND]`
Comprehensive PostgreSQL management tool

**Available Commands:**

| Command | Description |
|---------|-------------|
| `start` | Start PostgreSQL container |
| `stop` | Stop PostgreSQL container |
| `restart` | Restart PostgreSQL container |
| `status` | Show container status |
| `logs` | View PostgreSQL logs |
| `logs-f` | Follow PostgreSQL logs |
| `psql` | Open interactive shell |
| `backup` | Backup all databases |
| `restore <file>` | Restore from backup |
| `reset` | Drop and recreate databases |
| `clean` | Remove container and data |
| `info` | Show connection info |
| `help` | Show this help message |

**Examples:**

```bash
# Check status
./manage-postgres.sh status

# Open psql shell
./manage-postgres.sh psql

# Create backup
./manage-postgres.sh backup

# Restore from backup
./manage-postgres.sh restore postgres-backup-20260404-142930.sql

# View logs
./manage-postgres.sh logs

# Full reset (careful!)
./manage-postgres.sh reset
```

---

## ⚙️ Configuration

### 1. PostgreSQL Environment Variables (`.env.postgres`)

```bash
# Database Credentials
POSTGRES_USER=fincz_user          # PostgreSQL user
POSTGRES_PASSWORD=fincz_password  # PostgreSQL password
POSTGRES_DB=fincz_db              # Main database
POSTGRES_PORT=5432                # PostgreSQL port

# Individual service databases
DB_URL_AUTH=jdbc:postgresql://localhost:5432/auth_db
DB_URL_USER=jdbc:postgresql://localhost:5432/user_db
DB_URL_PORTFOLIO=jdbc:postgresql://localhost:5432/portfolio_db
DB_URL_NOTIFICATION=jdbc:postgresql://localhost:5432/notification_db
```

### 2. Service Environment Variables

Each service uses PostgreSQL with these environment variables:

```bash
# Set these before running services
export DB_USER=fincz_user
export DB_PASS=fincz_password

# For Spring Boot (User, Portfolio, Notification)
export DB_URL=jdbc:postgresql://localhost:5432/user_db

# For Node.js/Express (Auth, Market)
export DB_URL=postgresql://fincz_user:fincz_password@localhost:5432/auth_db
```

---

## 🗄️ Database Schema

### Databases Created

1. **auth_db** - User authentication data
   - users table (email, password_hash, timestamps)

2. **user_db** - User profile information
   - user_profiles table (name, phone, address, etc.)

3. **portfolio_db** - Investment portfolio data
   - portfolio table (name, type, units, buy_price, etc.)

4. **notification_db** - Notification and alerts
   - notifications table (title, message, is_read, etc.)

See `scripts/init-db.sh` for complete schema and initialization logic.

---

## 🔌 Spring Boot Configuration

### `application.yaml` Configuration

Each service's `application.yaml` is configured for PostgreSQL:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/service_db
    username: fincz_user
    password: fincz_password
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 20000
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
```

---

## 🧪 Testing Connection

### 1. Using psql

```bash
# Open psql shell
./manage-postgres.sh psql

# Or use docker exec
docker exec -it fincz-track-postgres psql -U fincz_user -d fincz_db

# Once in psql
\l                 # List databases
\dt                # List tables
SELECT * FROM users;  # Query example
\q                 # Exit
```

### 2. Using DBeaver or GUI Tools

Connection details:
- Host: localhost
- Port: 5432
- User: fincz_user
- Password: fincz_password
- Database: fincz_db

### 3. Using Adminer (Browser Based)

Adminer is restricted to **Development Mode** only. To use it, you must explicitly start it:

```bash
# Start Adminer
./manage-postgres.sh ui-start

# Stop Adminer when finished
./manage-postgres.sh ui-stop
```

Once started, access it at: [http://localhost:8088](http://localhost:8088)

**Login Details:**
- **System**: PostgreSQL
- **Server**: `postgres` (This is the Docker service name)
- **Username**: `fincz_dbo` (or your configured `POSTGRES_USER`)
- **Password**: `fincz_dbo`
- **Database**: `auth_db` (or any of the service databases)

### 3. Using Java/Spring Boot

Services automatically connect and initialize schema via Spring Data JPA with `ddl-auto: update`

---

## 💾 Backup & Restore

### Create Backup

```bash
./manage-postgres.sh backup

# Output: postgres-backup-YYYYMMDD-HHMMSS.sql
```

### Restore from Backup

```bash
./manage-postgres.sh restore postgres-backup-20260404-142930.sql
```

### Manual Backup via Docker

```bash
docker exec fincz-track-postgres pg_dump -U fincz_user --all-databases > backup.sql
```

### Manual Restore via Docker

```bash
docker exec -i fincz-track-postgres psql -U fincz_user < backup.sql
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
./manage-postgres.sh logs

# Check if port 5432 is in use
lsof -i :5432

# Kill conflicting process
kill -9 <PID>
```

### Connection Refused

```bash
# Verify container is running
./manage-postgres.sh status

# Check if PostgreSQL is ready
docker exec fincz-track-postgres pg_isready -U fincz_user
```

### Data Persistence Issues

```bash
# Check Docker volumes
docker volume ls

# Inspect volume
docker volume inspect fincz-track_postgres_data

# Clean and restart (loses data!)
./manage-postgres.sh clean
./manage-postgres.sh start
```

### Service Can't Connect

1. Verify PostgreSQL is running: `./manage-postgres.sh status`
2. Check environment variables are set
3. Ensure correct database name in application.yaml
4. Check logs: `./manage-postgres.sh logs`

---

## 📊 Docker Compose Structure

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: fincz-track-postgres
    environment: [credentials and settings]
    volumes: [data persistence]
    healthcheck: [auto-restart if unhealthy]
    networks: [fincz-network]

volumes:
  postgres_data: [persistent storage]

networks:
  fincz-network: [connects container]
```

---

## 🔐 Security Notes

⚠️ **For Development Only:**
- Credentials are simple for development
- Change in production to strong passwords
- Use environment variables from CI/CD
- Never commit .env.postgres to git

---

## 📝 Complete Workflow

### First Time Setup

```bash
# 1. Start PostgreSQL
./start-postgres.sh

# 2. Verify it's running
./manage-postgres.sh status

# 3. Check tables created
./manage-postgres.sh psql
# In psql: \dt

# 4. Exit psql
# In psql: \q

# 5. Start services
./run-services.sh all
```

### Daily Development

```bash
# Start everything
./start-all.sh

# Work on your code

# Stop with Ctrl+C
# Or in another terminal:
./stop-postgres.sh
```

### Before Deployment

```bash
# Create backup
./manage-postgres.sh backup

# Test backup
./manage-postgres.sh reset
./manage-postgres.sh restore postgres-backup-*.sql
```

---

## 🌐 Deployment Notes

For production deployment:

1. Use Neon PostgreSQL (neon.tech) or managed PostgreSQL
2. Update connection string in environment
3. Use strong passwords
4. Enable SSL connections
5. Set up automated backups
6. Monitor database performance

---

## 📚 References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa)
- [Postgres Docker Image](https://hub.docker.com/_/postgres)

---

**Last Updated**: April 2026
**PostgreSQL Version**: 15 (Alpine)
**Docker Compose Version**: 3.8+
