
import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Activity, Server, Database, Wifi, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const AdminHealthPage: React.FC = () => {
  const [latency, setLatency] = useState(120);

  useEffect(() => {
      const interval = setInterval(() => {
          setLatency(Math.floor(Math.random() * (200 - 80 + 1) + 80));
      }, 2000);
      return () => clearInterval(interval);
  }, []);

  const services = [
      { name: 'Supabase Database', status: 'operational', uptime: '99.99%' },
      { name: 'Storage Buckets', status: 'operational', uptime: '99.95%' },
      { name: 'Authentication Auth', status: 'operational', uptime: '100%' },
      { name: 'Image Compression API', status: 'degraded', uptime: '98.50%', note: 'High Load' },
  ];

  return (
    <div>
      <AdminHeader 
        title="System Health" 
        description="Real-time monitoring of infrastructure and services."
      />

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 font-bold">API Latency</span>
                  <Wifi className={`w-5 h-5 ${latency > 150 ? 'text-yellow-500' : 'text-green-500'}`} />
              </div>
              <h3 className="text-3xl font-black dark:text-white">{latency} ms</h3>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${latency > 150 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${latency / 3}%` }}></div>
              </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 font-bold">CPU Usage</span>
                  <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-3xl font-black dark:text-white">24%</h3>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-blue-500 w-[24%]"></div>
              </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 font-bold">Memory</span>
                  <Server className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="text-3xl font-black dark:text-white">4.2 GB</h3>
              <p className="text-xs text-gray-400 mt-1">of 16 GB Available</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 font-bold">Active Connections</span>
                  <Database className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="text-3xl font-black dark:text-white">85</h3>
              <p className="text-xs text-gray-400 mt-1">Pool limit: 500</p>
          </div>
      </div>

      {/* Service Status Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg dark:text-white">Service Status</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {services.map((service, i) => (
                  <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                      <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${service.status === 'operational' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'}`}></div>
                          <div>
                              <p className="font-bold text-gray-900 dark:text-white">{service.name}</p>
                              {service.note && <span className="text-xs text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded font-bold">{service.note}</span>}
                          </div>
                      </div>
                      <div className="flex items-center gap-8">
                          <div className="text-right">
                              <p className="text-xs text-gray-500 font-bold uppercase">Uptime</p>
                              <p className="font-mono font-bold dark:text-gray-300">{service.uptime}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-gray-500 font-bold uppercase">Status</p>
                              <p className={`font-bold capitalize ${service.status === 'operational' ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {service.status}
                              </p>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};
