import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { portfolioAPI } from '../utils/api';
import { Plus, Pencil, Upload, Briefcase, Tag, Hash, CalendarDays, Wallet, TrendingUp, Info, ShieldCheck, ArrowLeft, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateInvestmentValue } from '../utils/portfolioUtils';
import { formatCurrency } from '../utils/formatters';
import ConfirmDialog from '../components/ConfirmDialog';

const AddInvestment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.state?.isEdit || false;
  const editData = location.state?.investment;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
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

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isDirty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
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
      setIsDirty(false);
      
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
      setError(err.userMessage || `Failed to ${isEdit ? 'update' : 'add'} investment. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl mx-auto"
      >
        <button 
          onClick={handleCancel} 
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex items-center mb-8">
          <div className={`p-3 rounded-xl mr-4 text-white shadow-lg ${isEdit ? 'bg-amber-500 shadow-amber-500/30' : 'bg-blue-600 shadow-blue-500/30'}`}>
            {isEdit ? <Pencil size={24} /> : <Plus size={24} />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {isEdit ? 'Update Asset' : 'New Investment'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isEdit ? 'Modify your existing investment details.' : 'Add a new asset to start tracking its performance.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 shadow-sm">
            <Info size={20} /> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-xl flex items-center gap-3 shadow-sm">
            <ShieldCheck size={20} /> {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Asset Details Group */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Asset Details</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Investment Name</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g., Tata Consultancy Services"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Symbol / Ticker</label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="symbol"
                            value={formData.symbol}
                            onChange={handleChange}
                            placeholder="e.g., TCS.NS"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Asset Type</label>
                        <div className="relative">
                          <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                          >
                            <option value="stock">Stock</option>
                            <option value="mf">Mutual Fund</option>
                            <option value="etf">ETF</option>
                            <option value="elss">ELSS (Tax Saving MF)</option>
                            <option value="nps">NPS</option>
                            <option value="ppf">PPF</option>
                            <option value="lic">LIC / Insurance</option>
                            <option value="gold">Gold</option>
                            <option value="crypto">Cryptocurrency</option>
                            <option value="bond">Bond</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction Details Group */}
                <div>
                  <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">Transaction Details</h3>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Purchase Date</label>
                        <div className="relative">
                          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="date"
                            name="purchaseDate"
                            value={formData.purchaseDate}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            max={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Number of Units</label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="number"
                            name="units"
                            value={formData.units}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.0001"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Average Buy Price</label>
                        <div className="relative">
                          <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input
                            type="number"
                            name="buyPrice"
                            value={formData.buyPrice}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Investment')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Summary & Info Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Real-time Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
              <TrendingUp className="absolute right-[-20px] top-[-20px] text-white/10" size={120} />
              <div className="relative z-10">
                <h3 className="text-blue-200 text-sm font-medium mb-1 uppercase tracking-wider">Total Investment</h3>
                <p className="text-4xl font-bold mb-6 tracking-tight">
                  ₹{formatCurrency(calculateInvestmentValue(formData.units, formData.buyPrice))}
                </p>
                
                <div className="space-y-3 pt-4 border-t border-white/20 text-sm text-blue-100">
                  <div className="flex justify-between items-center">
                    <span>Units / Qty</span>
                    <span className="font-semibold text-white">{formData.units ? parseFloat(formData.units).toLocaleString() : '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg. Price</span>
                    <span className="font-semibold text-white">₹{formData.buyPrice ? formatCurrency(formData.buyPrice) : '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Info size={18} className="text-blue-500" /> Quick Tips
              </h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Use the exact exchange ticker (e.g., <strong>TCS.NS</strong> or <strong>AAPL</strong>) for live market price sync.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>For average buys, enter the total units and the weighted average buy price.</span>
                </li>
                {!isEdit && (
                  <li className="pt-3 border-t border-gray-100 dark:border-gray-700 mt-4">
                    <button 
                      onClick={() => navigate('/import')}
                      className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1.5"
                    >
                      <Upload size={14} /> Bulk import via CSV
                    </button>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <ConfirmDialog
          isOpen={showCancelConfirm}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={() => navigate(-1)}
          title="Discard Changes?"
          confirmText="Discard"
        >
          You have unsaved changes. Are you sure you want to discard them and leave this page?
        </ConfirmDialog>
      </motion.div>
    </div>
  );
};

export default AddInvestment;
