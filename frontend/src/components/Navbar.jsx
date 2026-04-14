import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, User, Settings, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../utils/auth';
import { useUser } from '../hooks/useUser';
import { getInitials } from '../utils/stringUtils';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { logout, isAuthenticated } = useAuth();
  const { user } = useUser();
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
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search assets, types, or tags..." 
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                />
              </div>
            </div>
          )}

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
                  {user && (
                    <div className="hidden lg:flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{user.name || 'User'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white dark:ring-gray-800">
                        {getInitials(user.name || user.email)}
                      </div>
                    </div>
                  )}
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
            {user && (
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {getInitials(user.name || user.email)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            )}
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
