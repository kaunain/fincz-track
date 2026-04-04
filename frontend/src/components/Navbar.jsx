import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../utils/auth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <h1 className="text-2xl font-bold text-primary">💰 Fincz Track</h1>
          </div>

          {user && (
            <>
              <div className="hidden md:flex items-center space-x-8">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-700 hover:text-primary transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/add-investment')}
                  className="text-gray-700 hover:text-primary transition"
                >
                  Add Investment
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="text-gray-700 hover:text-primary transition"
                >
                  Reports
                </button>
                <div className="flex items-center space-x-4 border-l pl-8">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-danger text-white px-4 py-2 rounded hover:bg-red-700 transition"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              <div className="md:hidden flex items-center">
                <button onClick={() => setIsOpen(!isOpen)}>
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </>
          )}
        </div>

        {isOpen && user && (
          <div className="md:hidden pb-4 space-y-2">
            <button
              onClick={() => { navigate('/dashboard'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </button>
            <button
              onClick={() => { navigate('/add-investment'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Add Investment
            </button>
            <button
              onClick={() => { navigate('/reports'); setIsOpen(false); }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Reports
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-danger hover:bg-gray-100"
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
