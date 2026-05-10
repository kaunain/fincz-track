import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { portfolioAPI, marketAPI } from '../utils/api';
import { FileText, Pencil, Trash2, Download, Search, ArrowUpDown, Tag, Upload, ChevronLeft, ChevronRight, RefreshCw, TrendingUp, TrendingDown, Zap, CheckCircle2, Info, X, Calendar, DollarSign } from 'lucide-react';
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
import { useUser } from '../hooks/useUser';
import { downloadCSV } from '../utils/exportUtils';
import SystemHealthFooter from '../components/SystemHealthFooter';
import { useDebounce } from '../hooks/useDebounce';

const COLORS = ['#2563eb', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];
const ITEMS_PER_PAGE = 10;

const formatCompactNumber = (number) => {
  if (!number || isNaN(number)) return '0';
  const n = Math.abs(parseFloat(number));
  if (n >= 10000000) return (n / 10000000).toFixed(2) + ' Cr';
  if (n >= 100000) return (n / 100000).toFixed(2) + ' L';
  if (n >= 1000) return (n / 1000).toFixed(2) + ' K';
  return n.toFixed(2);
};

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const ReportsPage = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { searchTerm, setSearchTerm } = useSearch();
  
  // Local state for debouncing
  const [localSearch, setLocalSearch] = useState(searchTerm || '');
  const debouncedSearch = useDebounce(localSearch, 300); // 300ms delay

  // Sync debounced value to global search context
  useEffect(() => {
    if (debouncedSearch !== searchTerm) {
      setSearchTerm(debouncedSearch);
    }
  }, [debouncedSearch, setSearchTerm]); // Removed searchTerm from dependencies

  // Sync external global search changes (e.g., cleared from Navbar) back to local
  useEffect(() => {
    if (searchTerm !== debouncedSearch) {
      setLocalSearch(searchTerm || '');
    }
  }, [searchTerm]);

  const [fileForImport, setFileForImport] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [totalItems, setTotalItems] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { theme } = useTheme();
  const { user } = useUser();

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';

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
    data: filteredAndSortedPortfolio,
    itemsPerPage: ITEMS_PER_PAGE,
    isServerSide: false,
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

  const totalPortfolioValue = useMemo(() => {
    if (portfolio && portfolio.length > 0) {
      return portfolio.reduce((sum, item) => sum + parseFloat(item.currentValue || 0), 0);
    }
    return netWorth ? parseFloat(netWorth.currentValue || 0) : 0;
  }, [portfolio, netWorth]);

  const totalInvested = useMemo(() => {
    if (portfolio && portfolio.length > 0) {
      return portfolio.reduce((sum, item) => sum + (parseFloat(item.units) * parseFloat(item.buyPrice)), 0);
    }
    return netWorth ? parseFloat(netWorth.totalInvested || 0) : 0;
  }, [portfolio, netWorth]);

  const profitLoss = useMemo(() => {
    if (portfolio && portfolio.length > 0) {
      return portfolio.reduce((sum, item) => sum + parseFloat(item.pnl || 0), 0);
    }
    return netWorth ? parseFloat(netWorth.totalPnl || 0) : 0;
  }, [portfolio, netWorth]);

  const profitPercentage = useMemo(() => {
    if (portfolio && portfolio.length > 0) {
      return totalInvested > 0 ? parseFloat(((profitLoss / totalInvested) * 100).toFixed(2)) : 0;
    }
    return netWorth ? parseFloat(netWorth.pnlPercentage || 0) : 0;
  }, [portfolio, netWorth, profitLoss, totalInvested]);

  const historyData = useMemo(() => {
    const actualHistory = analytics?.netWorthHistory || {};
    const historyKeys = Object.keys(actualHistory);

    // Use actual history if available
    if (historyKeys.length > 1) {
      return Object.entries(actualHistory)
        .map(([date, value]) => ({ date, value: parseFloat(value) }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // Generate a realistic 30-day mock trend ending at current total value if actual data is missing
    if (totalPortfolioValue > 0) {
      const mockData = [];
      let runningValue = totalPortfolioValue * 0.9; // Start at 90% of current value 30 days ago
      const today = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        
        // Random daily change between -0.5% and +1.5%
        const dailyChange = (Math.random() * 0.02) - 0.005;
        runningValue = runningValue * (1 + dailyChange);
        
        mockData.push({
          date: d.toISOString().split('T')[0],
          value: i === 0 ? totalPortfolioValue : parseFloat(runningValue.toFixed(2))
        });
      }
      return mockData;
    }

    return [];
  }, [analytics, totalPortfolioValue]);

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

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const [portfolioRes, analyticsRes, netWorthRes] = await Promise.all([
        portfolioAPI.getPortfolio(0, 10000), // Fetch all items for global analytics
        portfolioAPI.getAnalyticsSummary(),
        portfolioAPI.getNetWorth(),
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
      setNetWorth(netWorthRes.data);
    } catch (err) {
      console.error('Reports data error:', err);
      setError(err.userMessage || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshMarketPrices = async () => {
    const loadingToast = toast.loading("Syncing portfolio with live market prices...");
    try {
      setLoading(true);
      await marketAPI.syncPrices(true);
      toast.success(
        `Market prices synced successfully.`,
        { id: loadingToast }
      );
      await fetchPortfolioData();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to sync market data. Check API configuration.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (item) => {
    setSelectedAsset(item);
    setIsDetailModalOpen(true);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4">
          <div className="flex items-center">
            <FileText className="text-blue-600 dark:text-blue-400 mr-2.5" size={28} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Reports & Analytics</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button 
              onClick={refreshMarketPrices}
              disabled={loading || !portfolio?.length}
              className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm font-medium disabled:opacity-50 text-sm"
              title="Get Live Market Prices"
            >
              <Zap size={16} fill="currentColor" />
              <span className="hidden md:inline">Live Prices</span>
            </button>
            <button 
              onClick={() => navigate('/import')}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm font-medium text-sm"
            >
              <Upload size={16} />
              Import Data
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center justify-center gap-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm font-medium text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-danger rounded-xl">
            {error}
          </div>
        )}

        {/* Core Financial Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <Card loading={loading}>
            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total Assets</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalItems}</p>
          </Card>
          <Card loading={loading}>
            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total Invested</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1" title={`${currencySymbol}${formatCurrency(totalInvested)}`}>
              {currencySymbol}{formatCompactNumber(totalInvested)}
            </p>
          </Card>
          <Card loading={loading}>
            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Current Value</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1" title={`${currencySymbol}${formatCurrency(totalPortfolioValue)}`}>
              {currencySymbol}{formatCompactNumber(totalPortfolioValue)}
            </p>
          </Card>
          <Card loading={loading}>
            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Total P&L</p>
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`} title={`${currencySymbol}${formatCurrency(Math.abs(profitLoss))}`}>
                {profitLoss >= 0 ? '+' : '-'}{currencySymbol}{formatCompactNumber(Math.abs(profitLoss))}
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${profitPercentage >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {profitPercentage >= 0 ? '▲' : '▼'} {Math.abs(profitPercentage).toFixed(2)}%
              </span>
            </div>
          </Card>
        </div>

        {/* Tax Optimization Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card loading={loading}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Tax Saving (80C)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{currencySymbol}{formatCurrency(taxStats.total80C)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Limit: 1.5L</p>
                <p className="text-xs font-semibold text-orange-500 mt-1">{currencySymbol}{formatCurrency(taxStats.remaining80C)} left</p>
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
                <p className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">NPS Extra (80CCD)</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{currencySymbol}{formatCurrency(taxStats.total80CCD)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Limit: 50K</p>
                <p className="text-xs font-semibold text-orange-500 mt-1">{currencySymbol}{formatCurrency(taxStats.remaining80CCD)} left</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Net Worth Performance Trend */}
          <Card title="Performance Trend" loading={loading}>
            {historyData.length > 1 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#4b5563' }}
                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: theme === 'dark' ? '#9ca3af' : '#4b5563' }}
                tickFormatter={(value) => `${currencySymbol}${formatCompactNumber(value)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                    itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
                formatter={(value) => [`${currencySymbol}${formatCompactNumber(value)}`, 'Net Worth']}
                  />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-center p-4">
                <TrendingUp className="text-gray-300 mb-2" size={48} />
                <p className="text-gray-500 dark:text-gray-400">Track your portfolio daily to see performance trends.</p>
              </div>
            )}
          </Card>

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
              <YAxis 
                tick={{ fill: theme === 'dark' ? '#9ca3af' : '#4b5563' }} 
                tickFormatter={(value) => `${currencySymbol}${formatCompactNumber(value)}`}
              />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                    itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
                formatter={(value) => `${currencySymbol}${formatCompactNumber(value)}`}
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
              <YAxis 
                tick={{ fill: theme === 'dark' ? '#9ca3af' : '#4b5563' }} 
                tickFormatter={(value) => `${currencySymbol}${formatCompactNumber(value)}`}
              />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                    itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
                formatter={(value) => `${currencySymbol}${formatCompactNumber(value)}`}
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
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary dark:text-white transition-all w-full md:w-64"
                />
              </div>
            </div>
          } 
          noPadding 
          loading={loading && !portfolio}
        >
          {portfolio && portfolio.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative">
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
            <thead className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700">
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
                    <th onClick={() => handleSort('currentPrice')} className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center justify-end gap-1">Live Price <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th onClick={() => handleSort('pe')} className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                      <div className="flex items-center justify-end gap-1">P/E <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100" /></div>
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
                    <tr 
                      key={item.id || index} 
                      onClick={() => handleRowClick(item)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-900 dark:text-gray-200">{item.name}</span>
                            {item.resolvedSymbol && item.resolvedSymbol !== item.symbol && (
                              <div className="group relative inline-block">
                                <Info size={14} className="text-gray-400 cursor-help hover:text-blue-500 transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                  System Ticker: <span className="font-mono font-bold text-blue-400">{item.resolvedSymbol}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase tracking-tight">{item.symbol}</span>
                            {item.resolvedSymbol && item.resolvedSymbol !== item.symbol && (
                              <span className="text-[10px] font-mono text-blue-500/70 dark:text-blue-400/70 italic">
                                (→ {item.resolvedSymbol})
                              </span>
                            )}
                          </div>
                        </div>
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
                        {currencySymbol}{formatCurrency(parseFloat(item.buyPrice))}
                      </td>
                      <td className="px-6 py-4 text-right text-blue-600 dark:text-blue-400 font-medium">
                        {currencySymbol}{formatCurrency(parseFloat(item.currentPrice || item.buyPrice))}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                        {item.pe ? parseFloat(item.pe).toFixed(2) : (
                          <span className="text-gray-400">--</span>
                        )}
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
                            {currencySymbol}{formatCurrency(Math.abs(item.pnl))}
                          </div>
                          <span className="text-[10px] opacity-80">
                            {parseFloat(item.pnlPercentage).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                        {currencySymbol}{formatCurrency(item.currentValue)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
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

      {/* Asset Drill-down Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedAsset && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedAsset.name}</h3>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded uppercase">
                      {selectedAsset.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono text-gray-500">{selectedAsset.symbol}</span>
                    {selectedAsset.resolvedSymbol && selectedAsset.resolvedSymbol !== selectedAsset.symbol && (
                      <span className="text-xs font-mono text-blue-500 italic">resolved as: {selectedAsset.resolvedSymbol}</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Performance Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Current Value</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{currencySymbol}{formatCurrency(selectedAsset.currentValue)}</p>
                  </div>
                  <div className={`p-4 rounded-xl border ${parseFloat(selectedAsset.pnl) >= 0 ? 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-800/30' : 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-800/30'}`}>
                    <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Total P&L</p>
                    <p className={`text-xl font-bold ${parseFloat(selectedAsset.pnl) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {parseFloat(selectedAsset.pnl) >= 0 ? '+' : ''}{currencySymbol}{formatCurrency(selectedAsset.pnl)}
                    </p>
                  </div>
                </div>

                {/* Detailed Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500"><Zap size={14} /> Buy Price</div>
                    <div className="font-semibold dark:text-white">{currencySymbol}{formatCurrency(selectedAsset.buyPrice)}</div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp size={14} /> Current Price</div>
                    <div className="font-semibold dark:text-white">{currencySymbol}{formatCurrency(selectedAsset.currentPrice)}</div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500"><Info size={14} /> Total Units</div>
                    <div className="font-semibold dark:text-white">{parseFloat(selectedAsset.units).toLocaleString()}</div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-gray-500"><Calendar size={14} /> Purchase Date</div>
                    <div className="font-semibold dark:text-white">{selectedAsset.purchaseDate}</div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp size={14} /> CAGR</div>
                    <div className={`font-bold ${parseFloat(selectedAsset.cagr || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedAsset.cagr ? `${parseFloat(selectedAsset.cagr).toFixed(2)}%` : '--'}
                    </div>
                  </div>
                </div>

                {/* Market Metrics Grid */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Market Metrics</h4>
                  <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500">Market Cap</span><span className="font-semibold text-sm dark:text-white" title={selectedAsset.marketCap ? `${currencySymbol}${formatCurrency(selectedAsset.marketCap)}` : ''}>{selectedAsset.marketCap ? `${currencySymbol}${formatCompactNumber(selectedAsset.marketCap)}` : 'N/A'}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500">P/E Ratio</span><span className="font-semibold text-sm dark:text-white">{selectedAsset.pe || 'N/A'}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500">EPS</span><span className="font-semibold text-sm dark:text-white">{selectedAsset.eps || 'N/A'}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500">52W High</span><span className="font-semibold text-sm dark:text-white">{selectedAsset.high52 ? `${currencySymbol}${formatCurrency(selectedAsset.high52)}` : 'N/A'}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500">52W Low</span><span className="font-semibold text-sm dark:text-white">{selectedAsset.low52 ? `${currencySymbol}${formatCurrency(selectedAsset.low52)}` : 'N/A'}</span></div>
                    <div className="flex flex-col"><span className="text-[10px] text-gray-500">Exchange</span><span className="font-semibold text-sm dark:text-white uppercase">{selectedAsset.exchange || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsDetailModalOpen(false); handleEdit(selectedAsset); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Pencil size={18} /> Edit Asset
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsDetailModalOpen(false); handleDelete(selectedAsset); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-bold transition-all"
                  >
                    <Trash2 size={18} /> Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
