import { Navigate } from 'react-router-dom';
import { useAuth } from '../utils/auth';
import ErrorBoundary from './ErrorBoundary';

const ProtectedRoute = ({ children, withErrorBoundary = false }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return withErrorBoundary ? <ErrorBoundary>{children}</ErrorBoundary> : children;
};

export default ProtectedRoute;
