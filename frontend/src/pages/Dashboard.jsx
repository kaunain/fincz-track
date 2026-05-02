import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { portfolioAPI, marketAPI } from '../utils/api';
import { TrendingUp, DollarSign, Percent, Lightbulb, AlertCircle, Info, CheckCircle2, Pencil, Trash2, RefreshCw, Upload, Download, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDeleteInvestment } from '../hooks/useDeleteInvestment';
import { formatCurrency } from '../utils/formatters';
import { calculateInvestmentValue } from '../utils/portfolioUtils';
import { usePagination } from '../hooks/usePagination';
import { useSearch } from '../context/SearchContext';
import SystemHealthFooter from '../components/SystemHealthFooter';

const COLORS = ['#2563eb', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];
const ITEMS_PER_PAGE = 5;

const Dashboard = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [hasUnsavedPrices, setHasUnsavedPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const { searchTerm } = useSearch();
  const { theme } = useTheme();

  const chartData = useMemo(() => portfolio ? portfolio.map(item => ({
    name: item.name,
    value: parseFloat(item.currentValue || 0),
  })) : [], [portfolio]);

  const filteredPortfolio = useMemo(() => {
    if (!portfolio) return [];
    if (!searchTerm) return portfolio;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const hasCommas = lowerCaseSearchTerm.includes(',');

    return portfolio.filter(item => {
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
      } else {
        return itemName.includes(lowerCaseSearchTerm) ||
               itemSymbol.includes(lowerCaseSearchTerm) ||
               itemType.includes(lowerCaseSearchTerm) ||
               itemTags.some(tag => tag.includes(lowerCaseSearchTerm));
      }
    });
  }, [portfolio, searchTerm]);

  const { 
    paginatedData: paginatedPortfolio, 
    totalPages, 
    currentPage, 
    nextPage, 
    prevPage 
  } = usePagination({
    data: filteredPortfolio,
    itemsPerPage: ITEMS_PER_PAGE,
    dependencies: [searchTerm]
  });

  const concentrationData = useMemo(() => {
    if (!analytics || !analytics.concentrationRisk) return [];
    return Object.entries(analytics.concentrationRisk).map(([name, value]) => ({
      name: name.toUpperCase(),
      value: value,
    }));
  }, [analytics]);

  const historyData = useMemo(() => {
    if (!analytics || !analytics.netWorthHistory) return [];
    // Sort by date to ensure the line chart displays chronologically
    return Object.entries(analytics.netWorthHistory)
      .map(([date, value]) => ({ date, value: parseFloat(value) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [analytics]);

  // Derived metrics from portfolio array to ensure UI updates on live price refresh
  const totalValue = useMemo(() => {
    if (portfolio && portfolio.length > 0) {
      return portfolio.reduce((sum, item) => sum + parseFloat(item.currentValue || 0), 0);
    }
    return netWorth ? parseFloat(netWorth.currentValue || 0) : 0;
  }, [portfolio, netWorth]);

  const profitLoss = useMemo(() => {
    if (portfolio && portfolio.length > 0) {
      return portfolio.reduce((sum, item) => sum + parseFloat(item.pnl || 0), 0);
    }
    return netWorth ? parseFloat(netWorth.totalPnl || 0) : 0;
  }, [portfolio, netWorth]);

  const profitPercentage = useMemo(() => {
    if (portfolio && portfolio.length > 0) {
      const totalInv = portfolio.reduce((sum, item) => sum + (parseFloat(item.units) * parseFloat(item.buyPrice)), 0);
      return totalInv > 0 ? parseFloat(((profitLoss / totalInv) * 100).toFixed(2)) : 0;
    }
    return netWorth ? parseFloat(netWorth.pnlPercentage || 0) : 0;
  }, [portfolio, netWorth, profitLoss]);

  const insights = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return [];
    
    const list = [];
    // Concentration Insight
    if (chartData.length > 0) {
      const topAsset = chartData.reduce((prev, current) => (prev.value > current.value) ? prev : current, chartData[0]);
      if (topAsset.value / totalValue > 0.5) {
        list.push({
          type: 'warning',
          icon: AlertCircle,
          text: `High concentration in ${topAsset.name} (${((topAsset.value / totalValue) * 100).toFixed(1)}%). Consider diversifying.`
        });
      }
    }

    // Diversification Insight
    const mfCount = portfolio.filter(item => item.type === 'mf').length;
    if (mfCount > 5) {
      list.push({
        type: 'info',
        icon: Info,
        text: "You have more than 5 mutual funds. Check for portfolio overlap to reduce duplicate fees."
      });
    }

    // Tax-Loss Harvesting Insight
    if (analytics?.taxLossOpportunities?.length > 0) {
      const totalPotentialOffset = analytics.taxLossOpportunities.reduce((sum, opp) => sum + parseFloat(opp.unrealizedLoss || 0), 0);
      list.push({
        type: 'info',
        icon: Info,
        text: `Tax-Loss Harvesting: Found ${analytics.taxLossOpportunities.length} opportunities to offset capital gains (Potential: ₹${formatCurrency(totalPotentialOffset)}).`
      });
    }

    return list;
  }, [portfolio, chartData, totalValue, analytics]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      setIsOffline(false);
      const [portfolioRes, netWorthRes, analyticsRes] = await Promise.all([
        portfolioAPI.getPortfolio(),
        portfolioAPI.getNetWorth(),
        portfolioAPI.getAnalyticsSummary(),
      ]);

      // Handle Spring Data Page object or List
      if (portfolioRes.data && portfolioRes.data.content) {
        setPortfolio(portfolioRes.data.content);
      } else {
        setPortfolio(portfolioRes.data || []);
      }
      setNetWorth(netWorthRes.data);
      setAnalytics(analyticsRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard data error:', err);
      const msg = err.userMessage || 'Failed to load dashboard data. Please try again.';
      setError(msg);
      if (err.code === 'ERR_NETWORK' || msg.includes('unreachable') || msg.includes('unavailable')) {
        setIsOffline(true);
      }
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
      
      // Sequential fetch with slight delay to respect API rate limits (e.g. Alpha Vantage free tier)
      for (let i = 0; i < symbols.length; i++) {
        const res = await marketAPI.getPrice(symbols[i]);
        results.push(res);
        if (symbols.length > 1) await new Promise(r => setTimeout(r, 200)); // 200ms gap
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
      fetchDashboardData(); // Sync backend state (Net Worth etc.)
    } catch (err) {
      toast.error('Failed to save prices to database', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleExportRegistry = async () => {
    try {
      const response = await portfolioAPI.exportMarketRegistry();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Fin-Track - Live-Market-Data.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Market Registry exported successfully");
    } catch (error) {
      toast.error(error.userMessage || "Failed to export registry");
    }
  };

  const {
    isModalOpen: isDeleteModalOpen,
    isDeleting,
    itemToDelete,
    handleDeleteRequest: handleDelete,
    confirmDelete,
    closeModal
  } = useDeleteInvestment(fetchDashboardData);

  const handleEdit = (item) => {
    navigate('/add-investment', { 
      state: { 
        investment: item,
        isEdit: true 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
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
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center justify-center p-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={handleExportRegistry}
              disabled={loading || !portfolio?.length}
              className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm font-medium disabled:opacity-50"
              title="Export assets for Google Sheets"
            >
              <Download size={18} />
              <span className="hidden md:inline">Export Registry</span>
            </button>
            <button 
              onClick={() => navigate('/import')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-md font-medium"
            >
              <Upload size={18} />
              Import Data
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-danger rounded-xl">
            {error}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card loading={loading}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Net Worth</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  ₹{formatCurrency(totalValue)}
                </p>
              </div>
              <DollarSign className="text-primary dark:text-blue-400" size={40} />
            </div>
          </Card>

          <Card loading={loading}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Profit/Loss</p>
                <p className={`text-3xl font-bold mt-2 ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                  ₹{formatCurrency(Math.abs(profitLoss))}
                </p>
              </div>
              <TrendingUp className={profitLoss >= 0 ? 'text-success' : 'text-danger'} size={40} />
            </div>
          </Card>

          <Card loading={loading}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Return %</p>
                <p className={`text-3xl font-bold mt-2 ${profitPercentage >= 0 ? 'text-success' : 'text-danger'}`}>
                  {profitPercentage}%
                </p>
              </div>
              <Percent className={profitPercentage >= 0 ? 'text-success' : 'text-danger'} size={40} />
            </div>
          </Card>
        </div>

        {/* Portfolio Insights (Data Storytelling) */}
        {!loading && (insights.length > 0 || (portfolio && portfolio.length > 0)) && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-yellow-500" size={20} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Portfolio Insights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${
                  insight.type === 'warning' ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900/30' : 'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30'
                }`}>
                  <insight.icon size={18} className={insight.type === 'warning' ? 'text-orange-600' : 'text-blue-600'} />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{insight.text}</p>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="p-4 rounded-xl border bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30 flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-green-600" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">Your portfolio allocation looks healthy and well-diversified.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portfolio Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`₹${formatCurrency(value)}`, 'Net Worth']}
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
                <p className="text-gray-500 dark:text-gray-400">Add diversified investments to see risk analysis.</p>
              </div>
            )}
          </Card>

          {/* Pie Chart */}
          <Card title="Asset Allocation" loading={loading}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                      borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                      color: theme === 'dark' ? '#f3f4f6' : '#111827'
                    }}
                    itemStyle={{ color: theme === 'dark' ? '#f3f4f6' : '#111827' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No investments yet. Add some to get started!</p>
              </div>
            )}
          </Card>

          {/* Portfolio Details */}
          <Card title="Your Portfolio" loading={loading && !portfolio}>
            {filteredPortfolio && filteredPortfolio.length > 0 ? (
              <div className="flex flex-col h-full relative">
                {/* Portfolio Loading Overlay */}
                <AnimatePresence>
                  {loading && portfolio && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/40 dark:bg-gray-800/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl"
                    >
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3 mb-4">
                  {paginatedPortfolio.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300 font-mono uppercase">
                          {item.symbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400 capitalize">
                        <span>{item.type}</span>
                        <span>•</span>
                        <span>{parseFloat(item.units).toLocaleString('en-IN')} units</span>
                        {item.currentPrice && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">@ ₹{formatCurrency(item.currentPrice)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          ₹{formatCurrency(item.currentValue)}
                        </p>
                        <div className="flex flex-col items-end">
                          <p className={`text-[10px] font-bold ${parseFloat(item.pnl || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                            {parseFloat(item.pnl || 0) >= 0 ? '▲' : '▼'} ₹{formatCurrency(Math.abs(item.pnl || 0))}
                          </p>
                          <p className={`text-[10px] opacity-70 ${parseFloat(item.pnl || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                            ({parseFloat(item.pnlPercentage || 0).toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                
                {totalPages > 1 && (
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="p-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronLeft size={16} className="dark:text-white" />
                      </button>
                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="p-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <ChevronRight size={16} className="dark:text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No investments yet</p>
            )}
          </Card>
        </div>

        <SystemHealthFooter />
      </div>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeModal}
        onConfirm={confirmDelete}
        title="Remove Investment?"
        loading={isDeleting}
        actions={
          <>
            <button 
              onClick={() => toast.info("Check our documentation for help on deleting assets.")}
              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Get Help"
            >
              <Info size={20} />
            </button>
            <button 
              onClick={closeModal}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              disabled={isDeleting}
              className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg shadow-red-500/30 hover:bg-red-700 transition-colors flex items-center justify-center gap-2 ${isDeleting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isDeleting && <RefreshCw size={16} className="animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">{itemToDelete?.name}</span>? This action cannot be undone.
      </ConfirmDialog>
    </div>
  );
};

export default Dashboard;
