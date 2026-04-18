import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../utils/api';

const SERVICE_MAP = {
  '8080': 'Main System',
  '8082': 'User Identity System',
  '8083': 'Portfolio Management System',
  '8084': 'Live Market Feed',
  '8085': 'Alert System'
};

const SystemHealthFooter = () => {
  const [serviceStatus, setServiceStatus] = useState({});

  const checkServicesHealth = async () => {
    const checks = [
      { id: '8080', path: '/test' },
      { id: '8082', path: '/users/test' },
      { id: '8083', path: '/portfolio/test' },
      { id: '8084', path: '/market/test' },
      { id: '8085', path: '/notification/test' },
    ];

    const results = {};
    await Promise.all(checks.map(async (s) => {
      try {
        await apiClient.get(s.path, { timeout: 5000 });
        results[s.id] = 'online';
      } catch (err) {
        const isOffline = err.code === 'ERR_NETWORK' || err.userMessage?.includes('unreachable') || err.message?.includes('Network Error');
        results[s.id] = isOffline ? 'offline' : 'online';
      }
    }));

    setServiceStatus(prev => {
      // Notify the user if a service status changes while they are on the page
      if (Object.keys(prev).length > 0) {
        Object.entries(results).forEach(([id, status]) => {
          if (prev[id] === 'online' && status === 'offline') {
            toast.error(`${SERVICE_MAP[id]} is now unreachable`, {
              description: 'Features associated with this system may be limited.',
              id: `health-alert-${id}`,
            });
          } else if (prev[id] === 'offline' && status === 'online') {
            toast.success(`${SERVICE_MAP[id]} has been restored`, {
              id: `health-alert-${id}`,
            });
          }
        });
      }
      return results;
    });
  };

  useEffect(() => {
    checkServicesHealth();
    
    // Poll system health every 30 seconds
    const healthInterval = setInterval(checkServicesHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  return (
    <footer className="mt-16 pb-12 border-t border-gray-200 dark:border-gray-800 pt-10">
      <div className="flex items-center justify-center gap-2 mb-8 text-gray-500 dark:text-gray-400">
        <Activity size={16} className="text-blue-500" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em]">System Infrastructure Status</h3>
      </div>
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
        {Object.entries(SERVICE_MAP).map(([port, name]) => (
          <div key={port} className="flex items-center gap-4 group">
            <div className="relative flex items-center justify-center">
              <div className={`w-3.5 h-3.5 rounded-full transition-all duration-700 ${
                serviceStatus[port] === 'online' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 
                serviceStatus[port] === 'offline' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 
                'bg-gray-300 animate-pulse'
              }`} />
              {serviceStatus[port] === 'online' && (
                <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-green-500 animate-ping opacity-20" />
              )}
            </div>
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-tighter mb-0.5 ${
                serviceStatus[port] === 'online' ? 'text-green-600 dark:text-green-500/80' : 
                serviceStatus[port] === 'offline' ? 'text-red-600 dark:text-red-500/80' : 'text-gray-400'
              }`}>
                {serviceStatus[port] || 'checking...'}
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition-colors">
                {name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
};

export default SystemHealthFooter;