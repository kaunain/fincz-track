import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { portfolioAPI, marketAPI } from '../utils/api';
import { FileText, Pencil, Trash2, Download, Search, ArrowUpDown, Tag, Upload, ChevronLeft, ChevronRight, RefreshCw, TrendingUp, TrendingDown, Zap, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDeleteInvestment } from '../hooks/useDeleteInvestment';
import { formatCurrency } from '../utils/formatters';
import { calculateInvestmentValue } from '../utils/portfolioUtils';
import { usePagination } from '../hooks/usePagination';
import { useSearch } from '../context/SearchContext';
import ImportPreviewModal from '../components/ImportPreviewModal';
import { downloadCSV } from '../utils/exportUtils';
import SystemHealthFooter from '../components/SystemHealthFooter';

const COLORS = ['#2563eb', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];
const ITEMS_PER_PAGE = 10;

const ReportsPage = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedPrices, setHasUnsavedPrices] = useState(false);
  const [error, setError] = useState('');
  const { searchTerm, setSearchTerm } = useSearch();
  const [fileForImport, setFileForImport] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [totalItems, setTotalItems] = useState(0);
  const { theme } = useTheme();

  const filteredAndSortedPortfolio = useMemo(() => {
    if (!portfolio) return [];
    
    let items = [...portfolio];
    
    // Filtering
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const hasCommas = lowerCaseSearchTerm.includes(',');

      items = items.filter(item => {
        const itemName = item.name?.toLowerCase() || '';
        const itemSymbol = item.symbol?.toLowerCase() || '';
        const itemType = item.type?.toLowerCase() || '';
        const itemTags = item.tags?.map(tag => tag.toLowerCase()) || [];

        if (hasCommas) {
          const individualSearchTerms = lowerCaseSearchTerm.split(',').map(term => term.trim()).filter(term => term.length > 0);
          return individualSearchTerms.some(term => 
            itemName.includes(term) ||
            itemSymbol.includes(term) ||
            itemType.includes(term) ||
            itemTags.some(tag => tag.includes(term))
          );
        }
        return itemName.includes(lowerCaseSearchTerm) ||
               itemSymbol.includes(lowerCaseSearchTerm) ||
               itemType.includes(lowerCaseSearchTerm) ||
               itemTags.some(tag => tag.includes(lowerCaseSearchTerm));
      });
    }
    
    // Sorting
    items.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle calculated values
      if (sortConfig.key === 'totalValue') {
        aValue = parseFloat(a.currentValue || 0);
        bValue = parseFloat(b.currentValue || 0);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return items;
  }, [portfolio, searchTerm, sortConfig]);

  // Use the new custom hook
  const { 
    paginatedData: paginatedPortfolio, 
    totalPages, 
    currentPage, 
    nextPage, 
    prevPage,
    goToPage,
    startIndex,
    endIndex
  } = usePagination({
    data: portfolio || [],
    itemsPerPage: ITEMS_PER_PAGE,
    isServerSide: true,
    totalItems: totalItems,
    onPageChange: (newPage) => fetchPortfolioData(newPage),
    dependencies: [searchTerm, sortConfig]
  });

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
    total: parseFloat(item.currentValue || 0),
  })) : [], [portfolio]);

  const investmentByType = useMemo(() => portfolio
    ? Object.values(
      portfolio.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = { type: item.type, count: 0, value: 0 };
        }
        acc[item.type].count += 1;
        acc[item.type].value += parseFloat(item.currentValue || 0);
        return acc;
      }, {})
    )
    : [], [portfolio]);

  const concentrationData = useMemo(() => {
    if (!analytics || !analytics.concentrationRisk) return [];
    return Object.entries(analytics.concentrationRisk).map(([name, value]) => ({
      name: name.toUpperCase(),
      value: value,
    }));
  }, [analytics]);

  const totalPortfolioValue = useMemo(() => chartData.reduce((sum, item) => sum + item.total, 0), [chartData]);

  const taxStats = useMemo(() => {
    const total80C = parseFloat(analytics?.taxSummary?.totalInvested80C || 0);
    const remaining80C = parseFloat(analytics?.taxSummary?.remaining80CLimit || 0);
    const total80CCD = parseFloat(analytics?.taxSummary?.totalInvested80CCD || 0);
    const remaining80CCD = parseFloat(analytics?.taxSummary?.remaining80CCDLimit || 0);
    return { 
      total80C, 
      remaining80C, 
      progress80C: Math.min((total80C / 150000) * 100, 100),
      total80CCD,
      remaining80CCD,
      progress80CCD: Math.min((total80CCD / 50000) * 100, 100)
    };
  }, [analytics]);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async (page = 1) => {
    try {
      setLoading(true);
      const pageIndex = page - 1; // Backend is 0-indexed
      const [portfolioRes, analyticsRes] = await Promise.all([
        portfolioAPI.getPortfolio(pageIndex, ITEMS_PER_PAGE, `${sortConfig.key},${sortConfig.direction}`),
        portfolioAPI.getAnalyticsSummary(),
      ]);

      // Handle Spring Data Page object or List
      if (portfolioRes.data.content) {
        setPortfolio(portfolioRes.data.content);
        setTotalItems(portfolioRes.data.totalElements);
      } else {
        setPortfolio(portfolioRes.data);
        setTotalItems(portfolioRes.data.length);
      }
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Reports data error:', err);
      setError(err.userMessage || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshMarketPrices = async () => {
    if (!portfolio || portfolio.length === 0) return;
    
    const symbols = [...new Set(portfolio.map(item => item.symbol))];
    const loadingToast = toast.loading(`Refreshing ${symbols.length} market assets...`);
    
    try {
      setLoading(true);
      const results = [];
      
      // Sequential fetch with slight delay to respect API rate limits
      for (let i = 0; i < symbols.length; i++) {
        const res = await marketAPI.getPrice(symbols[i]);
        results.push(res);
        if (symbols.length > 1) await new Promise(r => setTimeout(r, 200));
      }
      
      const updatedPortfolio = portfolio.map(item => {
        const match = results.find(r => r.data.symbol === item.symbol);
        if (match && match.data.price) {
          const newPrice = parseFloat(match.data.price);
          const units = parseFloat(item.units);
          const buyPrice = parseFloat(item.buyPrice);
          const newValue = newPrice * units;
          const newPnl = newValue - (buyPrice * units);
          
          return {
            ...item,
            currentPrice: newPrice,
            currentValue: newValue,
            pnl: newPnl,
            pnlPercentage: (newPnl / (buyPrice * units)) * 100
          };
        }
        return item;
      });
      
      setPortfolio(updatedPortfolio);
      setHasUnsavedPrices(true);
      toast.success('Portfolio updated with latest market data', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to fetch market data. Check Market Service status.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const saveMarketPrices = async () => {
    if (!portfolio || portfolio.length === 0) return;
    
    const loadingToast = toast.loading('Saving updated prices to database...');
    try {
      setLoading(true);
      const priceUpdates = portfolio.map(item => ({
        symbol: item.symbol,
        currentPrice: item.currentPrice
      }));
      
      await portfolioAPI.updatePrices(priceUpdates);
      setHasUnsavedPrices(false);
      toast.success('All prices saved successfully', { id: loadingToast });
      fetchPortfolioData();
    } catch (err) {
      toast.error('Failed to save prices to database', { id: loadingToast });
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
      parseFloat(item.currentValue || 0).toFixed(2)
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
          <div className="flex items-center gap-3">
            <button 
              onClick={refreshMarketPrices}
              disabled={loading || !portfolio?.length}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-all shadow-md font-medium disabled:opacity-50"
              title="Get Live Market Prices"
            >
              <Zap size={18} fill="currentColor" />
              <span className="hidden md:inline">Live Prices</span>
            </button>
            {hasUnsavedPrices && (
              <button 
                onClick={saveMarketPrices}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all shadow-md font-medium animate-pulse"
              >
                <CheckCircle2 size={18} />
                <span className="hidden md:inline">Save Updates</span>
              </button>
            )}
            <button 
              onClick={() => navigate('/import')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-md font-medium"
            >
              <Upload size={18} />
              Import Data
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm font-medium"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-danger rounded-xl">
            {error}
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card loading={loading}>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Investments</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{totalItems}</p>
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
          <Card loading={loading}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Tax Saving (80C)</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">₹{formatCurrency(taxStats.total80C)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Limit: 1.5L</p>
                <p className="text-xs font-semibold text-orange-500 mt-1">₹{formatCurrency(taxStats.remaining80C)} left</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${taxStats.progress80C}%` }}
                className="bg-blue-600 h-full rounded-full"
              ></motion.div>
            </div>
          </Card>
          <Card loading={loading}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">NPS Extra (80CCD)</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">₹{formatCurrency(taxStats.total80CCD)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Limit: 50K</p>
                <p className="text-xs font-semibold text-orange-500 mt-1">₹{formatCurrency(taxStats.remaining80CCD)} left</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${taxStats.progress80CCD}%` }}
                className="bg-indigo-600 h-full rounded-full"
              ></motion.div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Concentration Risk Chart */}
          <Card title="Concentration Risk" loading={loading}>
            {concentrationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={concentrationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {concentrationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Allocation']}
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                    itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No risk data available</p>
              </div>
            )}
          </Card>

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
                  title="Separate multiple terms with commas to search for multiple tags or assets at once (e.g., tech, crypto, HDFC)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all w-full md:w-64"
                />
              </div>
            </div>
          } 
          noPadding 
          loading={loading && !portfolio}
        >
          {portfolio && portfolio.length > 0 ? (
            <div className="overflow-x-auto relative">
              {/* Table Loading Overlay */}
              <AnimatePresence>
                {loading && portfolio && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/40 dark:bg-gray-800/40 backdrop-blur-[1px] z-10 flex items-center justify-center"
                  >
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>

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
                    <th onClick={() => handleSort('cagr')} className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center justify-end gap-1">CAGR % <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th onClick={() => handleSort('pnl')} className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center justify-end gap-1">Gain/Loss <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th onClick={() => handleSort('totalValue')} className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center justify-end gap-1">Total Value <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="px-6 py-3 text-center font-semibold text-gray-900 dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedPortfolio.map((item, index) => (
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
                      <td className={`px-6 py-4 text-right font-semibold ${parseFloat(item.cagr || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.cagr !== undefined ? (
                          `${parseFloat(item.cagr).toFixed(2)}%`
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${parseFloat(item.pnl) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            {parseFloat(item.pnl) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            ₹{formatCurrency(Math.abs(item.pnl))}
                          </div>
                          <span className="text-[10px] opacity-80">
                            {parseFloat(item.pnlPercentage).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                        ₹{formatCurrency(item.currentValue)}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium">{startIndex}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{filteredAndSortedPortfolio.length}</span> investments
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} className="dark:text-white" />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => goToPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} className="dark:text-white" />
                </button>
              </div>
            </div>
          )}
        </Card>

        <SystemHealthFooter />
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
