import { useEffect, useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { portfolioAPI } from '../utils/api';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const COLORS = ['#2563eb', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const chartData = useMemo(() => portfolio ? portfolio.map(item => ({
    name: item.name,
    value: parseFloat(item.units) * parseFloat(item.buyPrice),
  })) : [], [portfolio]);

  const totalValue = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);
  const profitLoss = useMemo(() => netWorth ? parseFloat(netWorth.totalPnl || 0) : 0, [netWorth]);
  const profitPercentage = useMemo(() => netWorth ? parseFloat(netWorth.pnlPercentage || 0) : 0, [netWorth]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [portfolioRes, netWorthRes] = await Promise.all([
        portfolioAPI.getPortfolio(),
        portfolioAPI.getNetWorth(),
      ]);

      setPortfolio(portfolioRes.data);
      setNetWorth(netWorthRes.data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Net Worth</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="text-primary dark:text-blue-400" size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Profit/Loss</p>
                <p className={`text-3xl font-bold mt-2 ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                  ₹{Math.abs(profitLoss).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className={profitLoss >= 0 ? 'text-success' : 'text-danger'} size={40} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Return %</p>
                <p className={`text-3xl font-bold mt-2 ${profitPercentage >= 0 ? 'text-success' : 'text-danger'}`}>
                  {profitPercentage}%
                </p>
              </div>
              <Percent className={profitPercentage >= 0 ? 'text-success' : 'text-danger'} size={40} />
            </div>
          </div>
        </div>

        {/* Portfolio Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Asset Allocation</h2>
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
          </div>

          {/* Portfolio Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Portfolio</h2>
            {portfolio && portfolio.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {portfolio.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {item.type} • {parseFloat(item.units).toLocaleString('en-IN')} units
                      </p>
                    </div>
                    <p className="text-lg font-bold text-primary dark:text-blue-400">
                      ₹{(parseFloat(item.units) * parseFloat(item.buyPrice)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No investments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
