import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI } from '../utils/api';
import { useAuth } from '../utils/auth';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [isSignup, setIsSignup] = useState(location.state?.isSignup || false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isUsingRecoveryCode, setIsUsingRecoveryCode] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await authAPI.signup(name, email, password);
        setIsSignup(false);
        setName('');
        setPassword('');
        setConfirmPassword('');
        setEmail('');
        toast.success('Signup successful! Please login.');
      } else if (isMfaStep) {
        const response = await authAPI.verifyMfa({ email, code: mfaCode, rememberMe: rememberDevice });
        const token = response.data.token || response.data.accessToken;
        
        // Save device token if returned by server
        const deviceToken = response.headers['x-device-token'];
        if (deviceToken) {
          localStorage.setItem('fincz_device_token', deviceToken);
        }

        login(email, token);
        navigate('/dashboard');
      } else {
        const deviceToken = localStorage.getItem('fincz_device_token');
        const response = await authAPI.login(email, password, deviceToken);

        if (response.data.mfaRequired) {
          setIsMfaStep(true);
          return;
        }

        const token = response.data.token || response.data.accessToken || response.data;
        if (token && typeof token === 'string') {
          login(email, token);
          navigate('/dashboard');
        } else {
          throw new Error('Invalid token structure received from server');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      let errorMessage = 'An error occurred. Please try again.';
      
      if (err.response?.data) {
        // Handle different error response formats
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center mb-8">
          <img 
            src="https://fincz.com/images/fincz-logo-black.png" 
            alt="Fincz Logo" 
            className="h-12 w-auto dark:invert" 
          />
        </div>

        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          {isSignup ? 'Create Account' : isMfaStep ? 'Two-Factor Auth' : 'Login'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-danger rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isMfaStep ? (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <ShieldCheck className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400 px-4">
                {isUsingRecoveryCode 
                  ? "Please enter one of your 8-character recovery codes." 
                  : "Please enter the 6-digit verification code from your authenticator app."}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isUsingRecoveryCode ? "Recovery Code" : "Verification Code"}
                </label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(isUsingRecoveryCode ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))}
                  className={`w-full text-center text-2xl ${isUsingRecoveryCode ? 'tracking-normal' : 'tracking-[0.5em]'} font-bold px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition`}
                  placeholder={isUsingRecoveryCode ? "ABC123DE" : "000000"}
                  maxLength={isUsingRecoveryCode ? 8 : 6}
                  required
                />
              </div>
              <div className="flex items-center gap-2 px-1">
                <input
                  type="checkbox"
                  id="rememberDevice"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="rememberDevice" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  Trust this device for 30 days
                </label>
              </div>

              <button
                type="button"
                onClick={() => { setIsUsingRecoveryCode(!isUsingRecoveryCode); setMfaCode(''); }}
                className="w-full text-xs text-primary hover:underline"
              >
                {isUsingRecoveryCode ? "Use Authenticator App" : "I lost my device, use a recovery code"}
              </button>
            </div>
          ) : (
            <>
              {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="John Doe"
                required={isSignup}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>
          )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isSignup ? 'Sign Up' : isMfaStep ? 'Verify' : 'Login'}
          </button>
        </form>

        {!isMfaStep && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary font-semibold hover:underline"
            >
              {isSignup ? 'Login here' : 'Sign up here'}
            </button>
          </div>
        )}

        {isMfaStep && (
          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsMfaStep(false); setMfaCode(''); }}
              className="text-sm text-gray-500 hover:text-primary flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              <ArrowLeft size={14} /> Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
