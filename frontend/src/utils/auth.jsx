import { createContext, useContext, useEffect, useState } from 'react';
import { userAPI } from './api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // रिफ्रेश पर यूजर की बेसिक जानकारी को बहाल करें
  const [user, setUser] = useState(localStorage.getItem('user_email') ? { email: localStorage.getItem('user_email') } : null);
  
  // Optimistic Initialization: Check localStorage immediately to prevent refresh-redirects
  const tokenExists = !!localStorage.getItem('auth_token');
  const [isAuthenticated, setIsAuthenticated] = useState(tokenExists);
  const [loading, setLoading] = useState(tokenExists);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchUser(false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (showOverlay = true) => {
    if (showOverlay) setIsRefreshing(true);
    try {
      const response = await userAPI.getCurrentUser();
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only clear auth if it's a definitive 401 error from the server
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const login = (email, token) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_email', email);
    setUser({ email });
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isRefreshing, isAuthenticated, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
