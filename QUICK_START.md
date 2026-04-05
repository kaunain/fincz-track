# Fincz-Track Quick Start Guide

## 🚀 Start the Application

### 1. Start Backend Services
```bash
cd /home/ahmad/JIDE/fincz-track
./run-services.sh all   # Starts all services except notification
./check-services.sh     # Verify all services are running
```

**Expected Output:**
```
✅ API Gateway (Port 8080): RUNNING
✅ Auth Service (Port 8081): RUNNING
✅ User Service (Port 8082): RUNNING
✅ Portfolio Service (Port 8083): RUNNING
✅ Market Data Service (Port 8084): RUNNING
❌ Notification Service (Port 8085): NOT RUNNING (known issue)
```

### 2. Start Frontend (in separate terminal)
```bash
cd /home/ahmad/JIDE/fincz-track/frontend
npm install              # First time only
npm run dev             # Start dev server on http://localhost:5173
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080
- **PostgreSQL**: localhost:5432 (user: fincz_user)

---

## 🧪 Quick API Tests

### Get Auth Token
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Pass123!"
  }'
```

### Get User Profile (requires token)
```bash
TOKEN="<paste-token-from-login>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/users/me
```

### Add Investment to Portfolio
```bash
TOKEN="<paste-token-here>"
curl -X POST http://localhost:8080/api/portfolio/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "stock",
    "name": "Apple Inc",
    "symbol": "AAPL",
    "units": 5,
    "buyPrice": 150.0
  }'
```

### Get Portfolio
```bash
TOKEN="<paste-token-here>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/portfolio
```

### Get Net Worth
```bash
TOKEN="<paste-token-here>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/portfolio/networth
```

---

## 📁 Project Structure

```
/home/ahmad/JIDE/fincz-track/
├── frontend/                          # React Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── utils/
│   └── vite.config.js
│
├── services/                          # Java Microservices
│   ├── api-gateway/                   # Request routing (Port 8080)
│   ├── auth-service/                  # Auth & JWT (Port 8081)
│   ├── user-service/                  # User profiles (Port 8082)
│   ├── portfolio-service/             # Investments (Port 8083)
│   ├── market-data-service/           # Stock prices (Port 8084)
│   └── notification-service/          # Notifications (Port 8085) [compilation issues]
│
├── scripts/
│   └── init-db.sh                     # Database initialization
│
├── docker-compose.yml                 # PostgreSQL & Adminer
├── run-services.sh                    # Service launcher script
├── check-services.sh                  # Health check script
├── start-postgres.sh                  # Start PostgreSQL
└── .env                               # Environment configuration
```

---

## 🐛 Troubleshooting

### Services Not Starting
```bash
# Kill all existing Java processes
pkill -f "java.*spring-boot"

# Start fresh
./run-services.sh all
./check-services.sh
```

### PostgreSQL Issues
```bash
# Restart PostgreSQL
./stop-postgres.sh
./start-postgres.sh

# Check if running
docker-compose ps
```

### JWT Token Issues
- Tokens expire after 24 hours
- Get a new token by logging in again with valid credentials
- Ensure `Authorization: Bearer <token>` header is included

### Frontend Can't Connect to Backend
- Ensure API Gateway (port 8080) is running
- Check `.env` in frontend if API_URL is configured
- Clear browser cache and cookies

---

## 📊 Database Access

### Access PostgreSQL directly
```bash
psql -h localhost -U fincz_user -d postgres
```

### Available Databases
- `auth_db` - Authentication users
- `user_service` - User profiles
- `portfolio_service` - Investment holdings
- `market_db` - Stock prices
- `notification_db` - Notifications

### View Adminer UI
Navigate to: http://localhost:8081 (if Adminer container is running)

---

## ⚙️ Service Management

### Start Individual Service
```bash
./run-services.sh auth              # Auth Service only
./run-services.sh user              # User Service only
./run-services.sh gateway           # API Gateway only
./run-services.sh portfolio         # Portfolio Service only
./run-services.sh market            # Market Data Service only
```

### Stop All Services
```bash
./run-services.sh stop
```

### View Service Logs
```bash
tail -f /tmp/auth.log               # Auth service logs
tail -f /tmp/user.log               # User service logs
tail -f /tmp/gateway.log            # Gateway logs
```

---

## 🔐 Default Test Credentials

```
Email: test@example.com
Password: Pass123!
```

This account is pre-populated in the database for testing.

---

## 📚 API Endpoints Reference

### Auth (Public)
- `POST /api/auth/signup` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/test` - Health check

### Users (Protected)
- `GET /api/users/me` - Get profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users/profile` - Create profile

### Portfolio (Protected)
- `POST /api/portfolio/add` - Add investment
- `GET /api/portfolio` - List investments
- `GET /api/portfolio/type/{type}` - Filter by type
- `GET /api/portfolio/networth` - Calculate net worth

### Market (Public)
- `GET /api/market/price/{symbol}` - Get stock price
- `GET /api/market/test` - Health check

### Notifications (Protected, Service Down)
- `POST /api/notifications/send` - Send notification
- `GET /api/notifications` - Get history

---

## 🎓 Development Notes

### Adding New Endpoints
1. Create controller in service
2. Add corresponding DTOs for request/response
3. Update service layer with business logic
4. Test via curl or API client
5. Frontend can use the provided API utilities

### Database Migrations
- Schemas are auto-created by JPA/Hibernate (ddl-auto=validate)
- To reset database: remove volume and restart PostgreSQL
- Seed data is in `scripts/init-db.sh`

### Known Issues to Fix
1. **Notification Service**: Lombok compilation issues - needs Lombok annotationProcessor path in pom.xml
2. **Auth /test Endpoint**: Gateway filter needs reloading to recognize new PUBLIC_PATHS
3. **Stock Prices**: Need to seed database with real stock symbols

---

## 💡 Tips

- Keep terminal windows open for service logs while developing
- Use valid JSON in API requests (test with Postman if unsure)
- Token expiration is 24 hours - login again if requests fail with 401
- Check service logs if APIs return 500 errors
- Database changes persist in Docker volume - use `docker-compose down -v` to reset

---

**Need Help?** Check `PROJECT_STATUS.md` for detailed troubleshooting and architecture overview.
