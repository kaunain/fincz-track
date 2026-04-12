import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { portfolioAPI } from '../utils/api';
import { FileText, Pencil, Trash2, Download, Search, ArrowUpDown, Tag } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDeleteInvestment } from '../hooks/useDeleteInvestment';
import { formatCurrency } from '../utils/formatters';
import { calculateInvestmentValue } from '../utils/portfolioUtils';
import { downloadCSV } from '../utils/exportUtils';

const ReportsPage = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const { theme } = useTheme();

  const filteredAndSortedPortfolio = useMemo(() => {
    if (!portfolio) return [];
    
    let items = [...portfolio];
    
    // Filtering
    if (searchTerm) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }
    
    // Sorting
    items.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle calculated values
      if (sortConfig.key === 'totalValue') {
        aValue = calculateInvestmentValue(a.units, a.buyPrice);
        bValue = calculateInvestmentValue(b.units, b.buyPrice);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return items;
  }, [portfolio, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const chartData = useMemo(() => portfolio ? portfolio.map(item => ({
    name: item.name,
    investment: parseFloat(item.buyPrice),
    units: parseFloat(item.units),
    total: calculateInvestmentValue(item.units, item.buyPrice),
  })) : [], [portfolio]);

  const investmentByType = useMemo(() => portfolio
    ? Object.values(
      portfolio.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = { type: item.type, count: 0, value: 0 };
        }
        acc[item.type].count += 1;
        acc[item.type].value += calculateInvestmentValue(item.units, item.buyPrice);
        return acc;
      }, {})
    )
    : [], [portfolio]);

  const totalPortfolioValue = useMemo(() => chartData.reduce((sum, item) => sum + item.total, 0), [chartData]);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getPortfolio();
      setPortfolio(response.data);
    } catch (err) {
      console.error('Reports data error:', err);
      let errorMessage = 'Failed to load reports';
      
      if (err.response?.data) {
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

  const {
    isModalOpen: isDeleteModalOpen,
    isDeleting,
    itemToDelete,
    handleDeleteRequest: handleDelete,
    confirmDelete,
    closeModal
  } = useDeleteInvestment(fetchPortfolioData);

  const handleEdit = (item) => {
    navigate('/add-investment', { 
      state: { 
        investment: item,
        isEdit: true 
      } 
    });
  };

  const exportToCSV = () => {
    if (!portfolio || portfolio.length === 0) return;
    
    const headers = ['Name', 'Type', 'Units', 'Buy Price', 'Total Value'];
    const rows = filteredAndSortedPortfolio.map(item => [
      item.name,
      item.type,
      item.units,
      item.buyPrice,
      calculateInvestmentValue(item.units, item.buyPrice).toFixed(2)
    ]);

    downloadCSV(rows, headers, `fincz_portfolio_report_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('Report exported successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <FileText className="text-blue-600 dark:text-blue-400 mr-3" size={32} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          </div>
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm font-medium"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-danger rounded-xl">
            {error}
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card loading={loading}>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Investments</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{portfolio?.length || 0}</p>
          </Card>
          <Card loading={loading}>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Value</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              ₹{formatCurrency(totalPortfolioValue)}
            </p>
          </Card>
          <Card loading={loading}>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Stock Investments</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {portfolio?.filter(item => item.type === 'stock').length || 0}
            </p>
          </Card>
          <Card loading={loading}>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Mutual Funds</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {portfolio?.filter(item => item.type === 'mf').length || 0}
            </p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Investment Value by Asset */}
          <Card title="Investment Value by Asset" loading={loading}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#4b5563' }}
                  />
                  <YAxis tick={{ fill: theme === 'dark' ? '#9ca3af' : '#4b5563' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                    itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
                  />
                  <Bar dataKey="total" fill="#2563eb" name="Total Value" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No data to display</p>
              </div>
            )}
          </Card>

          {/* Investment by Type */}
          <Card title="Investments by Type" loading={loading}>
            {investmentByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={investmentByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fill: theme === 'dark' ? '#9ca3af' : '#4b5563' }}
                  />
                  <YAxis tick={{ fill: theme === 'dark' ? '#9ca3af' : '#4b5563' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                    itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
                  />
                  <Bar dataKey="value" fill="#1e40af" name="Total Value" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No data to display</p>
              </div>
            )}
          </Card>
        </div>

        {/* Detailed Table */}
        <Card 
          title={
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
              <span>Investment Details</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter table..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all w-full md:w-64"
                />
              </div>
            </div>
          } 
          noPadding 
          loading={loading}
        >
          {portfolio && portfolio.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th onClick={() => handleSort('name')} className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center gap-1">Name <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th onClick={() => handleSort('type')} className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center gap-1">Type <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th onClick={() => handleSort('units')} className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center justify-end gap-1">Units <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th onClick={() => handleSort('buyPrice')} className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center justify-end gap-1">Buy Price <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th onClick={() => handleSort('totalValue')} className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center justify-end gap-1">Total Value <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-900 dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedPortfolio.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-200">{item.name}</div>
                        {item.tags && (
                          <div className="flex gap-1 mt-1">
                            {item.tags.map(tag => (
                              <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                <Tag size={8} className="mr-1" /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 capitalize">{item.type}</td>
                      <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{parseFloat(item.units).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                        ₹{formatCurrency(parseFloat(item.buyPrice))}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                        ₹{formatCurrency(calculateInvestmentValue(item.units, item.buyPrice))}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No investments to display</p>
          )}
        </Card>
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeModal}
        onConfirm={confirmDelete}
        title="Remove Investment?"
        loading={isDeleting}
      >
        Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{itemToDelete?.name}</span>? This action cannot be undone.
      </ConfirmDialog>
    </div>
  );
};

export default ReportsPage;
