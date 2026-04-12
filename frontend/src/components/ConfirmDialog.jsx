import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  children, 
  confirmText = "Delete", 
  cancelText = "Cancel",
  variant = "danger",
  actions,
  loading = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border-t-4 ${
              variant === 'danger' ? 'border-red-500' : 'border-blue-500'
            }`}
          >
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <AlertTriangle className={variant === 'danger' ? 'text-red-600 w-8 h-8' : 'text-blue-600 w-8 h-8'} />
              </div>
              <h3 className="text-xl font-bold dark:text-white">{title}</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {children}
              </div>
              <div className="flex gap-3">
                {actions ? (
                  actions
                ) : (
                  <>
                    <button 
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {cancelText}
                    </button>
                    <button 
                      onClick={onConfirm}
                      disabled={loading}
                      className={`flex-1 px-4 py-2 text-white rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2 ${
                        variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                      } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {loading && <RefreshCw size={16} className="animate-spin" />}
                      {loading ? 'Processing...' : confirmText}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;