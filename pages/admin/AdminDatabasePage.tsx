
import React, { useState } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Database, HardDrive, RefreshCw, Trash2, Save, CheckCircle } from 'lucide-react';
import { exportAllDataJSON } from '../../services/dataService';

export const AdminDatabasePage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const tables = [
      { name: 'cars', rows: 1420, size: '4.2 MB', lastUpdated: '5 mins ago' },
      { name: 'users', rows: 3850, size: '2.8 MB', lastUpdated: '1 hour ago' },
      { name: 'dealerships', rows: 45, size: '0.5 MB', lastUpdated: '2 days ago' },
      { name: 'spare_parts', rows: 890, size: '1.2 MB', lastUpdated: '10 mins ago' },
      { name: 'brands', rows: 62, size: '0.1 MB', lastUpdated: '1 week ago' },
      { name: 'models', rows: 840, size: '0.4 MB', lastUpdated: '1 week ago' },
  ];

  const handleRefresh = () => {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBackup = async () => {
      setBackingUp(true);
      await exportAllDataJSON();
      setBackingUp(false);
  };

  return (
    <div>
      <AdminHeader 
        title="Database Management" 
        description="Monitor table statistics and manage data backups."
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                  <Database className="w-8 h-8" />
              </div>
              <div>
                  <p className="text-gray-500 text-sm font-bold">Total Records</p>
                  <h3 className="text-2xl font-black dark:text-white">7,107</h3>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                  <HardDrive className="w-8 h-8" />
              </div>
              <div>
                  <p className="text-gray-500 text-sm font-bold">Storage Used</p>
                  <h3 className="text-2xl font-black dark:text-white">9.2 MB</h3>
              </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-xl">
                  <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                  <p className="text-gray-500 text-sm font-bold">Health Status</p>
                  <h3 className="text-2xl font-black dark:text-white">Optimal</h3>
              </div>
          </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-8">
          <button 
            onClick={handleBackup}
            disabled={backingUp}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition disabled:opacity-50"
          >
              <Save className={`w-5 h-5 ${backingUp ? 'animate-pulse' : ''}`} /> 
              {backingUp ? 'Creating Backup...' : 'Backup Database Now'}
          </button>
          <button className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm">
              <RefreshCw className="w-5 h-5" /> Optimize Tables
          </button>
          <button className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 px-6 py-3 rounded-lg font-bold hover:bg-red-100 transition ml-auto">
              <Trash2 className="w-5 h-5" /> Clear Cache
          </button>
      </div>

      {/* Tables List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg dark:text-white">Table Statistics</h3>
          </div>
          <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                  <tr>
                      <th className="px-6 py-4">Table Name</th>
                      <th className="px-6 py-4">Row Count</th>
                      <th className="px-6 py-4">Size (Est)</th>
                      <th className="px-6 py-4">Last Updated</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {tables.map((table, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 font-mono text-primary-600 font-bold">{table.name}</td>
                          <td className="px-6 py-4 dark:text-gray-300">{table.rows.toLocaleString()}</td>
                          <td className="px-6 py-4 dark:text-gray-300">{table.size}</td>
                          <td className="px-6 py-4 text-gray-500">{table.lastUpdated}</td>
                          <td className="px-6 py-4 text-right">
                              <button className="text-blue-600 hover:underline">View Data</button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
};
