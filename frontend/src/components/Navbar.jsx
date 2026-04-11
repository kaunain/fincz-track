import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../utils/auth';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img 
              src="https://fincz.com/images/fincz-logo-black.png" 
              alt="Fincz Logo" 
              className="h-8 w-auto dark:invert transition-all" 
            />
          </div>

          {isAuthenticated && (
            <>
              <div className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/add-investment')}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Add Investment
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  Reports
                </button>
                <div className="flex items-center space-x-4 border-l border-gray-200 dark:border-gray-700 pl-8">
                  <ThemeToggle />
                  <button
                    onClick={() => navigate('/profile')}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                  >
                    <User size={20} />
                  </button>
                  {user && <span className="text-xs text-gray-500 hidden lg:block">{user.email}</span>}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-sm"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>

              <div className="md:hidden flex items-center">
                <ThemeToggle />
                <button onClick={() => setIsOpen(!isOpen)} className="ml-4 text-gray-700 dark:text-gray-300">
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </>
          )}
        </div>

        {isOpen && isAuthenticated && (
          <div className="md:hidden pb-4 space-y-2">
            <button
              onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Dashboard
            </button>
            <button
              onClick={() => { navigate('/add-investment'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Add Investment
            </button>
            <button
              onClick={() => { navigate('/reports'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Reports
            </button>
            <button
              onClick={() => { navigate('/profile'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Profile Settings
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
