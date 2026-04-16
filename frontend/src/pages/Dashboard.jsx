import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { portfolioAPI } from '../utils/api';
import { TrendingUp, DollarSign, Percent, Lightbulb, AlertCircle, Info, CheckCircle2, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/Card';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDeleteInvestment } from '../hooks/useDeleteInvestment';
import { formatCurrency } from '../utils/formatters';
import { calculateInvestmentValue } from '../utils/portfolioUtils';

const COLORS = ['#2563eb', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const chartData = useMemo(() => portfolio ? portfolio.map(item => ({
    name: item.name,
    value: parseFloat(item.currentValue || 0),
  })) : [], [portfolio]);

  const concentrationData = useMemo(() => {
    if (!analytics || !analytics.concentrationRisk) return [];
    return Object.entries(analytics.concentrationRisk).map(([name, value]) => ({
      name: name.toUpperCase(),
      value: value,
    }));
  }, [analytics]);

  const totalValue = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);
  const profitLoss = useMemo(() => netWorth ? parseFloat(netWorth.totalPnl || 0) : 0, [netWorth]);
  const profitPercentage = useMemo(() => netWorth ? parseFloat(netWorth.pnlPercentage || 0) : 0, [netWorth]);

  const insights = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return [];
    
    const list = [];
    // Concentration Insight
    if (chartData.length > 0) {
      const topAsset = chartData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
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
      const [portfolioRes, netWorthRes, analyticsRes] = await Promise.all([
        portfolioAPI.getPortfolio(),
        portfolioAPI.getNetWorth(),
        portfolioAPI.getAnalyticsSummary(),
      ]);

      setPortfolio(portfolioRes.data);
      setNetWorth(netWorthRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Dashboard data error:', err);
      let errorMessage = 'Failed to load dashboard data';
      
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

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
          <Card title="Your Portfolio" loading={loading}>
            {portfolio && portfolio.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {portfolio.map((item, index) => (
                  <div key={item.id || index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {item.type} • {parseFloat(item.units).toLocaleString('en-IN')} units
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-primary dark:text-blue-400">
                        ₹{formatCurrency(item.currentValue)}
                      </p>
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
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No investments yet</p>
            )}
          </Card>
        </div>
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
