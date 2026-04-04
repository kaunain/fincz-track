# Fincz Track Frontend

Modern investment portfolio management web application built with React, Vite, and Tailwind CSS.

## 🚀 Features

- **Authentication**: Secure signup and login with JWT tokens
- **Dashboard**: Real-time portfolio overview with net worth visualization
- **Asset Allocation**: Interactive pie chart showing portfolio composition
- **Portfolio Management**: Add and track various investment types (stocks, mutual funds, NPS, gold, crypto, bonds)
- **Analytics & Reports**: Detailed charts and statistics for investment analysis
- **Responsive Design**: Fully responsive UI for desktop and mobile devices
- **Real-time Sync**: Updates synchronized with backend services

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 📦 Prerequisites

- Node.js 16+ and npm/yarn
- Backend services running on `http://localhost:8080/api`
- Environment configuration (see `.env.example`)

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `VITE_API_BASE_URL` if your API Gateway is running on a different URL.

### 3. Start Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

### 5. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation bar
│   │   └── ProtectedRoute.jsx   # Route protection HOC
│   ├── pages/
│   │   ├── AuthPage.jsx         # Login/Signup
│   │   ├── Dashboard.jsx        # Main dashboard
│   │   ├── AddInvestment.jsx    # Add investment form
│   │   └── ReportsPage.jsx      # Analytics & reports
│   ├── utils/
│   │   ├── api.js               # API client & endpoints
│   │   └── auth.jsx             # Auth context & hooks
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Tailwind styling
├── public/                      # Static assets
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
└── postcss.config.js           # PostCSS configuration
```

## 🔑 Key Components

### Authentication Flow
- Users can signup with email and password
- Login redirects to dashboard
- JWT tokens stored in localStorage
- Protected routes require authentication
- Auto-logout on token expiration

### Dashboard
- Displays net worth summary
- Shows profit/loss metrics
- Asset allocation pie chart
- Portfolio breakdown with investment details

### Add Investment
- Form for adding investments
- Support for multiple asset types
- Real-time total calculation
- Validation and error handling

### Reports
- Investment value charts
- Asset type distribution
- Detailed investment table
- Summary statistics

## 🔌 API Integration

The frontend connects to the API Gateway at `http://localhost:8080/api`:

```
POST   /auth/signup          # Create new account
POST   /auth/login           # Login user
GET    /users/me             # Current user info
GET    /users/profile        # User profile
GET    /portfolio            # Get all investments
POST   /portfolio/add        # Add investment
GET    /portfolio/networth   # Get portfolio metrics
GET    /market/price         # Get market price
```

## 🎨 Styling

The application uses Tailwind CSS with custom color scheme:
- **Primary**: Blue (#2563eb)
- **Secondary**: Dark Blue (#1e40af)
- **Success**: Green (#16a34a)
- **Danger**: Red (#dc2626)
- **Warning**: Orange (#f97316)

## 🔒 Security

- JWT tokens manage authentication
- Tokens sent with every authenticated request
- Automatic token refresh on 401 responses
- Protected routes prevent unauthorized access
- Environment variables for sensitive config

## 📱 Responsive Design

- Mobile-first design approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly navigation
- Optimized for all screen sizes

## 🐛 Troubleshooting

### API Connection Issues
- Ensure backend is running on port 8080
- Check VITE_API_BASE_URL in .env file
- Verify CORS configuration in API Gateway

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf dist .vite`
- Check Node.js version: `node --version`

### Port Already in Use
- Change port in `vite.config.js`
- Or kill existing process: `lsof -ti:5173 | xargs kill -9`

## 📝 License

This project is part of Fincz Track - Investment Portfolio Manager

## 👨‍💻 Development

For local development with hot module replacement:

```bash
npm run dev
```

The dev server will automatically reload on file changes.
