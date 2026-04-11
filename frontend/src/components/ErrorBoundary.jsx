import React from 'react';
import { AlertTriangle, RefreshCw, Home, Send, CheckCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, isReporting: false, reportSent: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, reportSent: false });
    window.location.href = '/dashboard';
  };

  handleReport = async () => {
    this.setState({ isReporting: true });
    try {
      // Log to backend endpoint
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: this.state.error?.toString(),
          stack: this.state.errorInfo?.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });
      this.setState({ reportSent: true });
    } catch (err) {
      console.error('Failed to report issue:', err);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200 text-gray-900 dark:text-white">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-600 dark:text-red-400 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm">
              An unexpected error occurred in the application UI. We've been notified and are working to fix it.
            </p>
            {this.state.error && (
              <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-xl text-left overflow-auto max-h-40 border border-gray-200 dark:border-gray-700">
                <code className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={this.handleReport}
                disabled={this.state.isReporting || this.state.reportSent}
                className={`flex items-center justify-center gap-2 w-full font-semibold py-3 rounded-lg transition-all shadow-md ${
                  this.state.reportSent 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                }`}
              >
                {this.state.isReporting ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : this.state.reportSent ? (
                  <CheckCircle size={18} />
                ) : (
                  <Send size={18} />
                )}
                {this.state.reportSent ? 'Issue Reported' : this.state.isReporting ? 'Reporting...' : 'Report Issue'}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md"
              >
                <RefreshCw size={18} />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-semibold py-3 rounded-lg transition-all"
              >
                <Home size={18} />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;