import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const LoadingOverlay = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/10 backdrop-blur-[2px] pointer-events-auto"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-gray-100 dark:border-gray-700">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Synchronizing data...</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;