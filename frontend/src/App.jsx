import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/auth';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AddInvestment from './pages/AddInvestment';
import ReportsPage from './pages/ReportsPage';
import ProfileSettings from './pages/ProfileSettings';
import ForgotPassword from './pages/ForgotPassword';

const RootRedirect = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null; // Wait for auth check to complete
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

function App() {
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'icon';
    link.href = 'https://fincz.com/images/icons/favicon.ico';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Toaster position="top-right" richColors />
          <Navbar />
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<ErrorBoundary><AuthPage /></ErrorBoundary>} />
              <Route path="/signup" element={<ErrorBoundary><AuthPage /></ErrorBoundary>} />
              <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute withErrorBoundary>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/add-investment"
                element={
                  <ProtectedRoute withErrorBoundary>
                    <AddInvestment />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/reports"
                element={
                  <ProtectedRoute withErrorBoundary>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute withErrorBoundary>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/" element={<RootRedirect />} />
            </Routes>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
