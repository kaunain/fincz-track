import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { portfolioAPI } from '../utils/api';
import { Plus, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateInvestmentValue } from '../utils/portfolioUtils';
import { formatCurrency } from '../utils/formatters';

const AddInvestment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.state?.isEdit || false;
  const editData = location.state?.investment;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'stock',
    units: '',
    buyPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isEdit && editData) {
      setFormData({
        name: editData.name || '',
        symbol: editData.symbol || '',
        type: editData.type || 'stock',
        units: editData.units?.toString() || '',
        buyPrice: editData.buyPrice?.toString() || '',
        purchaseDate: editData.purchaseDate || new Date().toISOString().split('T')[0],
      });
    }
  }, [isEdit, editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        symbol: formData.symbol,
        type: formData.type,
        units: parseFloat(formData.units),
        buyPrice: parseFloat(formData.buyPrice),
        purchaseDate: formData.purchaseDate,
      };

      if (isEdit && editData?.id) {
        await portfolioAPI.updateInvestment(editData.id, payload);
        setSuccess('Investment updated successfully!');
      } else {
        await portfolioAPI.addInvestment(payload);
        setSuccess('Investment added successfully!');
      }
      
      setFormData({
        name: '',
        symbol: '',
        type: 'stock',
        units: '',
        buyPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0],
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Add investment error:', err);
      let errorMessage = `Failed to ${isEdit ? 'update' : 'add'} investment. Please try again.`;
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error || err.response.data.status === 405) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-8">
            {isEdit ? (
              <Pencil className="text-primary mr-3" size={32} />
            ) : (
              <Plus className="text-primary mr-3" size={32} />
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Investment' : 'Add Investment'}
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-danger rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-success rounded-xl">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Investment Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., TCS, SBI, Axis Bank"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Symbol/Code
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g., TCS.NS, SBIN.NS, AXISBANK.NS"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Investment Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="stock">Stock</option>
                <option value="mf">Mutual Fund</option>
                <option value="elss">ELSS (Tax Saving MF)</option>
                <option value="nps">NPS</option>
                <option value="ppf">PPF</option>
                <option value="lic">LIC / Insurance</option>
                <option value="gold">Gold</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="bond">Bond</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Units
                </label>
                <input
                  type="number"
                  name="units"
                  value={formData.units}
                  onChange={handleChange}
                  placeholder="e.g., 10"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buy Price (₹)
                </label>
                <input
                  type="number"
                  name="buyPrice"
                  value={formData.buyPrice}
                  onChange={handleChange}
                  placeholder="e.g., 1500.50"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Total Investment:</strong> ₹
                {formatCurrency(calculateInvestmentValue(formData.units, formData.buyPrice))}
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-secondary text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (isEdit ? 'Updating...' : 'Adding...') 
                  : (isEdit ? 'Update Investment' : 'Add Investment')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default AddInvestment;
