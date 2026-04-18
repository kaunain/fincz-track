import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle2, Filter } from 'lucide-react';

const ImportPreviewModal = ({ isOpen, onClose, onConfirm, onFilterInvalid, data, loading }) => {
  const invalidCount = data.filter(item => !item.isValid).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold dark:text-white">Review Import Data</h2>
              <p className="text-sm text-gray-500">
                Found {data.length} records. {invalidCount > 0 ? (
                  <span className="text-red-500 font-medium">Please review {invalidCount} invalid entries highlighted below.</span>
                ) : (
                  <span className="text-green-500 font-medium">All entries look valid!</span>
                )}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <X size={20} className="dark:text-white" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Symbol</th>
                  <th className="px-4 py-3 text-right">Units</th>
                  <th className="px-4 py-3 text-right">Avg. Price</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className={`transition-colors ${!item.isValid ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                  >
                    <td className="px-4 py-3 font-medium dark:text-white">
                      {item.symbol}
                    </td>
                    <td className="px-4 py-3 text-right dark:text-gray-300">
                      {item.units.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right dark:text-gray-300">
                      ₹{item.buyPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {item.isValid ? (
                        <div className="flex items-center text-green-500 gap-1">
                          <CheckCircle2 size={14} /> Valid
                        </div>
                      ) : (
                        <div className="flex items-center text-red-500 gap-1" title={item.errors?.join(', ')}>
                          <AlertCircle size={14} /> {item.errors?.[0]}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center gap-3">
            <div className="flex-1">
              {invalidCount > 0 && onFilterInvalid && (
                <button
                  onClick={onFilterInvalid}
                  className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
                >
                  <Filter size={16} /> Discard {invalidCount} invalid rows
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl font-medium dark:text-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || invalidCount > 0}
                className={`px-6 py-2 rounded-xl font-bold text-white transition-all ${
                  loading || invalidCount > 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                }`}
              >
                {loading ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};

export default ImportPreviewModal;