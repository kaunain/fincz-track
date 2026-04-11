import { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { portfolioAPI } from '../utils/api';
import { FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/Card';

const ReportsPage = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  const chartData = useMemo(() => portfolio ? portfolio.map(item => ({
    name: item.name,
    investment: parseFloat(item.buyPrice),
    units: parseFloat(item.units),
    total: parseFloat(item.units) * parseFloat(item.buyPrice),
  })) : [], [portfolio]);

  const investmentByType = useMemo(() => portfolio
    ? Object.values(
      portfolio.reduce((acc, item) => {
        if (!acc[item.type]) {
          acc[item.type] = { type: item.type, count: 0, value: 0 };
        }
        acc[item.type].count += 1;
        acc[item.type].value += parseFloat(item.units) * parseFloat(item.buyPrice);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-8">
          <FileText className="text-blue-600 dark:text-blue-400 mr-3" size={32} />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
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
              ₹{totalPortfolioValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
        <Card title="Investment Details" noPadding loading={loading}>
          {portfolio && portfolio.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-200">Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-200">Type</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200">Units</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200">Buy Price</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {portfolio.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 dark:text-gray-200">{item.name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 capitalize">{item.type}</td>
                      <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{parseFloat(item.units).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                        ₹{parseFloat(item.buyPrice).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                        ₹{(parseFloat(item.units) * parseFloat(item.buyPrice)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
    </div>
  );
};

export default ReportsPage;
