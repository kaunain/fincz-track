# Frontend Setup Instructions

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

## Build & Deploy

```bash
npm run build  # Creates optimized production build
npm run preview  # Preview production build locally
```

## Environment Variables

Create `.env.local`:
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Fincz Track
```

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Features

✅ **Login/Signup** - User authentication with JWT
✅ **Dashboard** - Net worth display with charts
✅ **Asset Allocation** - Pie chart visualization
✅ **Add Investment** - Form to add stocks, mutual funds, etc.
✅ **Reports** - Detailed analytics and reports
✅ **Responsive UI** - Mobile and desktop friendly
✅ **Error Handling** - Comprehensive error messages
✅ **Loading States** - Smooth loading indicators

## Page Routes

- `/login` - Login page
- `/signup` - Signup page (redirects to login)
- `/dashboard` - Main dashboard (protected)
- `/add-investment` - Add investment form (protected)
- `/reports` - Analytics & reports (protected)

## Tech Stack Used

- React 18
- Vite
- Tailwind CSS
- Recharts
- Axios
- React Router
- Lucide Icons
