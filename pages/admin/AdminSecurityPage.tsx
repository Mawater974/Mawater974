
import React, { useState } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { Shield, Lock, Users, AlertTriangle, Key, Smartphone, Globe } from 'lucide-react';

export const AdminSecurityPage: React.FC = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  const logs = [
      { id: 1, action: 'Failed Login Attempt', user: 'admin@mawater.com', ip: '192.168.1.45', location: 'Doha, QA', time: '10 mins ago', status: 'danger' },
      { id: 2, action: 'Password Changed', user: 'dealer_elite', ip: '45.12.33.11', location: 'Dubai, AE', time: '2 hours ago', status: 'success' },
      { id: 3, action: 'Role Update', user: 'Super Admin', ip: '10.0.0.1', location: 'Server', time: 'Yesterday', status: 'warning' },
      { id: 4, action: 'Successful Login', user: 'admin@mawater.com', ip: '192.168.1.45', location: 'Doha, QA', time: 'Yesterday', status: 'success' },
  ];

  return (
    <div>
      <AdminHeader 
        title="Security Center" 
        description="Monitor activity logs and configure security policies."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Logs Column */}
          <div className="lg:col-span-2 space-y-8">
              {/* Active Sessions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                      <Users className="w-5 h-5 text-green-500" /> Active Admin Sessions
                  </h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800">
                          <div className="flex items-center gap-4">
                              <div className="bg-white dark:bg-gray-800 p-2 rounded-full text-green-600">
                                  <Smartphone className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="font-bold text-sm dark:text-white">Current Session (You)</p>
                                  <p className="text-xs text-gray-500">Chrome on Windows • 192.168.1.45</p>
                              </div>
                          </div>
                          <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-1 rounded">Active Now</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-600">
                          <div className="flex items-center gap-4">
                              <div className="bg-white dark:bg-gray-800 p-2 rounded-full text-gray-500">
                                  <Globe className="w-5 h-5" />
                              </div>
                              <div>
                                  <p className="font-bold text-sm dark:text-white">Secondary Admin</p>
                                  <p className="text-xs text-gray-500">Safari on macOS • 82.11.22.41</p>
                              </div>
                          </div>
                          <button className="text-xs font-bold text-red-600 hover:underline">Revoke</button>
                      </div>
                  </div>
              </div>

              {/* Audit Logs */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-bold text-lg dark:text-white">Security Audit Log</h3>
                  </div>
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                          <tr>
                              <th className="px-6 py-4">Action</th>
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">IP Address</th>
                              <th className="px-6 py-4">Time</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {logs.map(log => (
                              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                  <td className="px-6 py-4">
                                      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold ${
                                          log.status === 'danger' ? 'bg-red-100 text-red-700' :
                                          log.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-green-100 text-green-700'
                                      }`}>
                                          {log.status === 'danger' && <AlertTriangle className="w-3 h-3" />}
                                          {log.action}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 dark:text-white">{log.user}</td>
                                  <td className="px-6 py-4 text-gray-500">{log.ip} <span className="text-xs ml-1 opacity-60">({log.location})</span></td>
                                  <td className="px-6 py-4 text-gray-500">{log.time}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* Settings Sidebar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 h-fit">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 dark:text-white">
                  <Shield className="w-5 h-5 text-primary-600" /> Policies
              </h3>
              
              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="font-bold text-sm dark:text-white">Maintenance Mode</p>
                          <p className="text-xs text-gray-500">Disable public access</p>
                      </div>
                      <button 
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${maintenanceMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${maintenanceMode ? 'left-7' : 'left-1'}`}></span>
                      </button>
                  </div>

                  <div className="flex items-center justify-between">
                      <div>
                          <p className="font-bold text-sm dark:text-white">Two-Factor Auth</p>
                          <p className="text-xs text-gray-500">Enforce for all admins</p>
                      </div>
                      <button 
                        onClick={() => setTwoFactor(!twoFactor)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${twoFactor ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${twoFactor ? 'left-7' : 'left-1'}`}></span>
                      </button>
                  </div>

                  <hr className="dark:border-gray-700" />

                  <div>
                      <label className="block text-sm font-bold mb-2 dark:text-white">Password Expiry</label>
                      <select className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 dark:text-white outline-none">
                          <option>Never</option>
                          <option>Every 30 Days</option>
                          <option>Every 90 Days</option>
                          <option>Every Year</option>
                      </select>
                  </div>

                  <button className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-2">
                      <Key className="w-4 h-4" /> Reset All Admin Passwords
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};
