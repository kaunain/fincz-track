import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, User, Settings, Search, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../utils/auth';
import { useUser } from '../hooks/useUser';
import { getInitials } from '../utils/stringUtils';
import { useSearch } from '../context/SearchContext';
import ThemeToggle from './ThemeToggle';
import { useDebounce } from '../hooks/useDebounce';
import apiClient from '../utils/api';

const Navbar = () => {
  const { logout, isAuthenticated } = useAuth();
  const { user } = useUser();
  const { searchTerm, setSearchTerm } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef(null);
  
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const [avatarError, setAvatarError] = useState(false);

  // Reset avatar error state if user avatar URL changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);

  // Local state for debouncing
  const [localSearch, setLocalSearch] = useState(searchTerm || '');
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    if (debouncedSearch !== searchTerm) {
      setSearchTerm(debouncedSearch);
    }
  }, [debouncedSearch, setSearchTerm]);

  useEffect(() => {
    if (searchTerm !== debouncedSearch) {
      setLocalSearch(searchTerm || '');
    }
  }, [searchTerm]);

  // Fetch auto-suggestions when user types at least 3 characters
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearch.length >= 3 && isAuthenticated) {
        try {
          // Fetching global list to extract unique matching terms
          const res = await apiClient.get('/portfolio?page=0&size=1000');
          const items = res.data?.content || res.data || [];
          const searchLower = debouncedSearch.toLowerCase();
          
          const matched = new Set();
          items.forEach(item => {
            if (item.name?.toLowerCase().includes(searchLower)) matched.add(item.name);
            if (item.symbol?.toLowerCase().includes(searchLower)) matched.add(item.symbol);
            if (item.type?.toLowerCase().includes(searchLower)) matched.add(item.type);
            item.tags?.forEach(tag => {
              if (tag.toLowerCase().includes(searchLower)) matched.add(tag);
            });
          });
          setSuggestions(Array.from(matched).slice(0, 6)); // Top 6 suggestions
        } catch (err) {
          console.error("Failed to fetch suggestions:", err);
        }
      } else {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [debouncedSearch, isAuthenticated]);

  // Global shortcut to focus search input using '/'
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => location.pathname === path;
  const linkClass = (path) => 
    `transition ${isActive(path) ? 'text-blue-600 font-bold' : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'}`;

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
                  ref={searchInputRef}
                  placeholder="Search assets, types, or tags..." 
                  title="Separate multiple terms with commas to search for multiple tags or assets at once (e.g., tech, crypto, HDFC)"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setLocalSearch('');
                      e.target.blur();
                    }
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="w-full pl-10 pr-10 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all"
                />
            {!localSearch && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex pointer-events-none">
                <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-xs font-mono text-gray-400 font-bold shadow-sm">
                  /
                </kbd>
              </div>
            )}
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
            
            {/* Auto-suggest Dropdown */}
            {isFocused && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50 py-1">
                {suggestions.map((suggestion, idx) => (
                  <li 
                    key={idx}
                    onClick={() => {
                      setLocalSearch(suggestion);
                      setSearchTerm(suggestion);
                      setIsFocused(false);
                    }}
                    className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <Search size={14} className="text-gray-400" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
              </div>
            </div>
          )}

          {isAuthenticated && (
            <>
              <div className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => navigate('/dashboard')}
                  className={linkClass('/dashboard')}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/add-investment')}
                  className={linkClass('/add-investment')}
                >
                  Add Investment
                </button>
                <button
                  onClick={() => navigate('/import')}
                  className={linkClass('/import')}
                >
                  Import
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className={linkClass('/reports')}
                >
                  Reports
                </button>
                <div className="flex items-center space-x-4 border-l border-gray-200 dark:border-gray-700 pl-8 relative" ref={profileDropdownRef}>
                  <ThemeToggle />
                  
                  {/* Profile Dropdown Trigger */}
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    {user ? (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-white dark:ring-gray-800 hover:ring-blue-500 transition-all overflow-hidden">
                        {user.avatarUrl && !avatarError ? (
                          <img 
                            src={user.avatarUrl} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          getInitials(user.name || user.email)
                        )}
                      </div>
                    ) : (
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        <User size={20} />
                      </div>
                    )}
                  </button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                      {user && (
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        </div>
                      )}
                      <div className="py-2">
                        <button
                          onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                          <Settings size={16} className="text-gray-400 dark:text-gray-500" />
                          Profile Settings
                        </button>
                        <button
                          onClick={() => { handleLogout(); setIsProfileOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
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
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {user.avatarUrl && !avatarError ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    getInitials(user.name || user.email)
                  )}
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
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive('/add-investment') ? 'text-blue-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
            >
              Add Investment
            </button>
            <button
              onClick={() => { navigate('/import'); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive('/import') ? 'text-blue-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
            >
              Import Data
            </button>
            <button
              onClick={() => { navigate('/reports'); setIsOpen(false); }}
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive('/reports') ? 'text-blue-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}
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
