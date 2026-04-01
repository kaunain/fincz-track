# 🚀 Fincz-Track (Smart Investment Manager)

A full-stack **microservices-based financial tracking platform** where users can manage and track their investments (Stocks, Mutual Funds, NPS) in one place and get **tax optimization insights**.

---

## 🧠 Problem Statement

Managing investments across multiple platforms is difficult. Users lack:

* Unified portfolio tracking
* Real-time valuation
* Tax-saving insights

**Fincz-Track solves this by providing a centralized intelligent dashboard.**

---

## 🎯 Key Features

### ✅ Core Features

* User Authentication (JWT-based)
* Portfolio Management (Stocks, MF, NPS)
* Net Worth Calculation
* Unified Dashboard

### 📊 Advanced Features

* Real-time Market Data Integration
* Tax Saving Suggestions (80C, 80CCD)
* Asset Allocation Visualization (Pie Charts)
* Profit / Loss Tracking

### 🔔 Optional / Upcoming

* Email Notifications & Alerts
* Budget Planning
* Export Reports (PDF/Excel)

---

## 🏗️ Architecture

Microservices-based architecture:

```text
Frontend (React + Vite)
        ↓
API Gateway (Spring Cloud Gateway)
        ↓
-------------------------------------
Auth Service (Node.js)
User Service (Spring Boot)
Portfolio Service (Spring Boot)
Market Data Service (Node.js)
Notification Service (Spring Boot)
-------------------------------------
        ↓
PostgreSQL + MongoDB
```

---

## ⚙️ Tech Stack

### 🖥️ Frontend

* React (Vite)
* Tailwind CSS
* Recharts (for data visualization)

### 🧩 Backend

* Java 17 + Spring Boot 3
* Spring Security + JWT
* Node.js + Express

### 🗄️ Database

* PostgreSQL (Neon)
* MongoDB Atlas

### 🌐 Deployment

* Frontend: Vercel
* Backend: Render
* Database: Neon / MongoDB Atlas

---

## 📁 Project Structure

```text
fincz-track/
│
├── services/
│   ├── auth-service/
│   ├── user-service/
│   ├── portfolio-service/
│   ├── market-data-service/
│   ├── notification-service/
│   └── api-gateway/
│
├── frontend/
│   └── web-app/
│
├── docs/
│
├── scripts/
│
└── README.md
```

---

## 🔐 Security

* JWT-based authentication
* Role-based authorization (USER / ADMIN)
* Secure API Gateway validation

---

## 🔄 Data Flow (Example)

1. User logs in → JWT generated
2. Frontend sends token with requests
3. API Gateway validates token
4. Portfolio Service processes data
5. Market Data Service fetches latest prices
6. Response displayed on dashboard

---

## 🚀 Getting Started

### Prerequisites

* Java 17+
* Node.js 18+
* PostgreSQL
* MongoDB

---

### Clone the Repository

```bash
git clone https://github.com/<your-username>/fincz-track.git
cd fincz-track
```

---

### Run Services (Example: Auth Service)

```bash
cd services/auth-service
mvn spring-boot:run
```

---

### Run Frontend

```bash
cd frontend/web-app
npm install
npm run dev
```

---

## 🌍 Deployment Plan

| Component  | Platform |
| ---------- | -------- |
| Frontend   | Vercel   |
| Backend    | Render   |
| PostgreSQL | Neon     |
| MongoDB    | Atlas    |

---

## 📌 Roadmap

* [ ] Auth Service (JWT Complete)
* [ ] User Service
* [ ] Portfolio Service (Core Logic)
* [ ] Market Data Integration
* [ ] Frontend Dashboard
* [ ] Deployment
* [ ] Notifications
* [ ] Reports Export

---

## 🤝 Contribution

This is an open project. Contributions, suggestions, and improvements are welcome.

---

## 📄 License

Apache License
Version 2.0

---

## 👨‍💻 Author

Developed by **Kaunain Ahmad**

---

## ⭐ Why This Project?

This project demonstrates:

* Real-world microservices architecture
* Full-stack development (Java + Node + React)
* Scalable system design
* Financial domain expertise

---

🔥 If you like this project, don't forget to give it a star!
