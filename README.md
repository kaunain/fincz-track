# 🚀 Fincz-Track (Smart Investment Manager)

A full-stack **microservices-based financial tracking platform** where users can manage and track their investments (Stocks, Mutual Funds, NPS) in one place and get **tax optimization insights**.

---

## 🎯 Key Features

### Authentication & Security
- User registration and login
- JWT token-based authentication
- Secure password hashing (BCrypt)
- Token expiration (24 hours)

### User Management
- Detailed user profiles
- Financial goals and occupation tracking
- Contact information management
- Real-time profile updates

### Portfolio Management
- Add and track investments (stocks, mutual funds, bonds)
- Calculate portfolio value and returns
- View investments by type
- Real-time net worth calculations

### Market Integration
- Stock price lookups by symbol
- Market data caching
- Real-time price updates

---

## 🏗️ Architecture & Tech Stack

### Backend
- **Java 17** - Programming language
- **Spring Boot 3/4** - Framework
- **Spring Cloud Gateway** - API Gateway
- **Spring Security** - Authentication/Authorization
- **JPA/Hibernate** - ORM
- **JWT (JJWT)** - Token generation
- **Maven** - Build tool

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Recharts** - Data visualization

### Infrastructure
- **PostgreSQL 15** - Database
- **Docker & Compose** - Containerization
- **Linux/Bash** - Orchestration

*Note: Auth and User metadata have been consolidated into `user-service` for atomic transactions.*

```text
┌─────────────────────────────────────────────────├─ Client (React Frontend)
│                                                  │ http://localhost:5173
│
├─────────────────────────────────────────────────├─ API Gateway
│                                                  │ http://localhost:8080
│                                                  │ (JWT Authentication)
│
├─────────────────────────────────────────────────├─ Microservices
│  ├─ User Service (8082)     - Identity, Auth & Profiles
│  ├─ Portfolio Service (8083) - Investments
│  ├─ Market Service (8084)   - Stock Data
│  └─ Notification Service (8085) - Alerts
│
└─────────────────────────────────────────────────├─ Data Layer
   ├─ PostgreSQL (5432)
   └─ Docker Network
```

---

## 📁 Project Structure

```text
/home/ahmad/JIDE/fincz-track/
├── frontend/                          # React Vite app
├── services/                          # Java Microservices
│   ├── api-gateway/                   # Request routing (Port 8080)
│   ├── user-service/                  # User profiles & Auth (Port 8082)
│   ├── portfolio-service/             # Investments (Port 8083)
│   ├── market-data-service/           # Stock prices (Port 8084)
│   └── notification-service/          # Notifications (Port 8085)
├── scripts/                           # Init, validation, and auto-fix scripts
├── docker-compose.yml                 # PostgreSQL configuration
├── run-services.sh                    # Service launcher script
└── validate-and-fix.sh                # Code quality enforcement
```

---

## � Quick Start (2 minutes)

### Prerequisites
```bash
# Check versions
java -version        # Should be 17+
mvn -version         # Should be 3.9+
node -version        # Should be 16+
docker -version      # Should be latest
```

### 1. Environment Configuration (`.env`)
```env
DB_URL=jdbc:postgresql://localhost:5432/fincz_db
DB_USER=fincz_user
DB_PASS=fincz_password

JWT_SECRET=your_base64_encoded_secret_key_here_minimum_32_bytes
JWT_EXPIRATION=86400000  # 24 hours in milliseconds

# Optional email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=app-specific-password
```

### 2. Start Database
```bash
./start-postgres.sh
```

### 3. Start Backend Services
```bash
./run-services.sh all
./check-services.sh  # Verify API Gateway (8080) and other services are running
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Access the application at **http://localhost:5173**.

---

## 🔍 Service Ports

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| Frontend | 5173 | ⏳ Ready | React dev server |
| API Gateway | 8080 | ✅ Online | Request routing & JWT |
| User Service | 8082 | ✅ Online | Auth & Profiles |
| Portfolio Service | 8083 | ✅ Online | Investments |
| Market Service | 8084 | ✅ Online | Stock prices |
| Notification Service | 8085 | ✅ Online | Email/alerts |
| PostgreSQL | 5432 | ✅ Online | Database |

---

## ⚙️ Environment Variables Reference

The project relies on these environment variables in your `.env` file to function correctly across all microservices:

### 🔐 Security & Core
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **YES** | - | Base64-encoded JWT secret (min 32 bytes) |
| `JWT_EXPIRATION` | NO | 86400000 | Token expiration in milliseconds |
| `CORS_ALLOWED_ORIGINS` | NO | http://localhost:5173 | Comma-separated allowed frontend origins |

### 🗄️ Database
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_URL` | **YES** | - | PostgreSQL connection URL |
| `DB_USER` | **YES** | - | Database username |
| `DB_PASS` | **YES** | - | Database password |
| `DB_POOL_SIZE` | NO | 10 | Connection pool size |

### 📧 Email & Notifications
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_HOST` | **YES***| - | SMTP server hostname (e.g., smtp.gmail.com) |
| `EMAIL_PORT` | **YES***| - | SMTP port (usually 587 or 465) |
| `EMAIL_USERNAME` | **YES***| - | Email account username |
| `EMAIL_PASSWORD` | **YES***| - | App-specific password (not your main password) |

*\*Required only if Notification Service is active.*

> **Pro Tip:** Generate a strong JWT secret using `openssl rand -base64 32`

---

## 🗄️ Database Management

The PostgreSQL container provisions four separate databases automatically: `auth_db`, `user_db`, `portfolio_db`, and `notification_db`. We provide a comprehensive script (`./manage-postgres.sh`) for all database operations.

```bash
# Open interactive psql shell
./manage-postgres.sh psql

# Database Backup & Restore
./manage-postgres.sh backup
./manage-postgres.sh restore <backup-file.sql>

# View database logs
./manage-postgres.sh logs

# Full database reset (Drops and recreates all tables)
./manage-postgres.sh reset
```

**Adminer UI (Browser-based DB Manager)**
```bash
./manage-postgres.sh ui-start
# Access at http://localhost:8088
# System: PostgreSQL | Server: postgres | User: fincz_user | Password: fincz_password | Database: auth_db
```

---

## 🧪 API Reference & Quick Tests

### Core Endpoints
- **Auth**: `POST /api/auth/login`, `POST /api/auth/signup`
- **Users**: `GET /api/users/me`, `PUT /api/users/me`, `POST /api/users/me/avatar`
- **Portfolio**: `GET /api/portfolio`, `POST /api/portfolio/add`, `GET /api/portfolio/networth`
- **Market**: `GET /api/market/price/{symbol}`

### Quick cURL Tests

**1. Get Auth Token**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Pass123!"}'
```

**2. Get User Profile**
```bash
TOKEN="<paste-token-from-login>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/users/me
```

**3. Add Investment**
```bash
curl -X POST http://localhost:8080/api/portfolio/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "stock",
    "name": "Infosys Limited",
    "symbol": "INFY",
    "units": 5,
    "buyPrice": 150.0
  }'
```

---

## �️ Code Quality & Validation
We enforce strict code quality using Checkstyle, enhanced Maven compiler linting (`-Xlint:all`), JaCoCo for test coverage, and custom shell scripts.

### Automated Validation Script
To quickly validate the entire project and auto-fix common issues:
```bash
./validate-and-fix.sh --fix-all
```

---

## 📊 Project Status & Roadmap
**Current Status:** ✅ OPERATIONAL (Core Services & Frontend Complete)

**Completed:**
- Full microservices backbone (Gateway, User, Portfolio, Market).
- Database schema and migrations.
- Frontend dashboard, charts, and portfolio management.

**Next Steps:**
- Advanced CI/CD and deployments.
- PDF Export engine and Watchlist feature implementation.

---

## 📄 License
Apache License
Version 2.0

---

Developed by **Kaunain Ahmad**
