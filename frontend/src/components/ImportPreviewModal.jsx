import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';

const ImportPreviewModal = ({ isOpen, onClose, onConfirm, data, loading }) => {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 dark:bg-opacity-75"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-3xl p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800"
          >
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Confirm Import from Zerodha CSV
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Review the investments below. Existing investments with the same symbol will be updated, and new ones will be added.
            </p>

            <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="sticky top-0 text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Symbol</th>
                    <th scope="col" className="px-6 py-3 text-right">Units</th>
                    <th scope="col" className="px-6 py-3 text-right">Avg. Buy Price</th>
                    <th scope="col" className="px-6 py-3 text-right">Current Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length > 0 ? (
                    data.map((item, index) => (
                      <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.symbol}</td>
                        <td className="px-6 py-4 text-right">{item.units}</td>
                        <td className="px-6 py-4 text-right">₹{formatCurrency(item.buyPrice)}</td>
                        <td className="px-6 py-4 text-right">₹{formatCurrency(item.currentPrice)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white dark:bg-gray-800">
                      <td colSpan="4" className="px-6 py-4 text-center">No valid investments found in the CSV.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading && <RefreshCw size={16} className="animate-spin" />}
                {loading ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              disabled={loading}
            >
              <X size={20} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImportPreviewModal;