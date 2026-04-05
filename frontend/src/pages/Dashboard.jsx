import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { portfolioAPI } from '../utils/api';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const COLORS = ['#2563eb', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const chartData = portfolio ? portfolio.map(item => ({
    name: item.name,
    value: parseFloat(item.units) * parseFloat(item.buyPrice),
  })) : [];

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  const profitLoss = netWorth ? parseFloat(netWorth.totalPnl || 0) : 0;
  const profitPercentage = netWorth ? parseFloat(netWorth.pnlPercentage || 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-danger rounded">
            {error}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Net Worth</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="text-primary" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Profit/Loss</p>
                <p className={`text-3xl font-bold mt-2 ${profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                  ₹{Math.abs(profitLoss).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className={profitLoss >= 0 ? 'text-success' : 'text-danger'} size={40} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Return %</p>
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Asset Allocation</h2>
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500">No investments yet. Add some to get started!</p>
              </div>
            )}
          </div>

          {/* Portfolio Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Portfolio</h2>
            {portfolio && portfolio.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {portfolio.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.type} • {item.units} units</p>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      ₹{(parseFloat(item.units) * parseFloat(item.buyPrice)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No investments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
