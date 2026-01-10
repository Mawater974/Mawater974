
import React, { useState } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { BarChart, PieChart, TrendingUp, Calendar, ArrowUpRight, Users, Car, DollarSign } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    alert("Downloading PDF Report...");
  };

  // Mock Data for Charts
  const revenueData = [45, 60, 75, 50, 80, 95, 120, 110, 130, 145, 160, 175]; // Heights for bars
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const topBrands = [
      { name: 'Toyota', count: 450, percent: 85 },
      { name: 'Nissan', count: 320, percent: 65 },
      { name: 'Lexus', count: 210, percent: 45 },
      { name: 'Mercedes', count: 180, percent: 35 },
      { name: 'BMW', count: 150, percent: 30 },
  ];

  return (
    <div className="pb-12">
      <AdminHeader 
        title="Analytics & Reports" 
        description="View system performance, user growth, and financial reports."
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onExport={handleExport}
        addLabel="Create Report"
        onAdd={() => alert("Report builder coming soon")}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-gray-500 text-sm font-bold">Total Revenue (Est)</p>
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">QAR 124,500</h3>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-lg">
                 <DollarSign className="w-6 h-6" />
              </div>
           </div>
           <div className="flex items-center gap-1 text-sm text-green-600 font-bold">
              <ArrowUpRight className="w-4 h-4" /> +15.3% <span className="text-gray-400 font-normal ml-1">vs last month</span>
           </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-gray-500 text-sm font-bold">Active Listings</p>
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">1,402</h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                 <Car className="w-6 h-6" />
              </div>
           </div>
           <div className="flex items-center gap-1 text-sm text-blue-600 font-bold">
              <ArrowUpRight className="w-4 h-4" /> +5.2% <span className="text-gray-400 font-normal ml-1">vs last month</span>
           </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-gray-500 text-sm font-bold">Total Users</p>
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">3,850</h3>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                 <Users className="w-6 h-6" />
              </div>
           </div>
           <div className="text-sm text-gray-500 mt-2">
              <span className="font-bold text-gray-900 dark:text-white">68%</span> of traffic is mobile.
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         {/* Revenue Chart */}
         <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg dark:text-white">Revenue Overview</h3>
                 <select className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 outline-none dark:text-white">
                     <option>This Year</option>
                     <option>Last Year</option>
                 </select>
             </div>
             
             {/* Custom CSS Bar Chart */}
             <div className="h-64 flex items-end justify-between gap-2 md:gap-4 mt-8">
                 {revenueData.map((height, idx) => (
                     <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                         <div className="w-full relative">
                             {/* Tooltip */}
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                 QAR {height * 100}
                             </div>
                             <div 
                                style={{ height: `${height * 1.5}px` }} 
                                className={`w-full rounded-t-lg transition-all hover:opacity-80 ${idx === 11 ? 'bg-primary-600' : 'bg-primary-200 dark:bg-primary-900/40'}`}
                             ></div>
                         </div>
                         <span className="text-xs text-gray-400 font-medium">{months[idx]}</span>
                     </div>
                 ))}
             </div>
         </div>

         {/* Top Brands */}
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="font-bold text-lg mb-6 dark:text-white">Top Performing Brands</h3>
             <div className="space-y-5">
                 {topBrands.map((brand, idx) => (
                     <div key={idx}>
                         <div className="flex justify-between text-sm mb-1">
                             <span className="font-medium dark:text-gray-200">{brand.name}</span>
                             <span className="text-gray-500">{brand.count} cars</span>
                         </div>
                         <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                             <div 
                                style={{ width: `${brand.percent}%` }}
                                className="h-full bg-primary-500 rounded-full"
                             ></div>
                         </div>
                     </div>
                 ))}
             </div>
             <button className="w-full mt-6 py-2 text-sm text-primary-600 font-bold hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition">
                 View All Brands
             </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Demographics */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-6 dark:text-white">User Demographics</h3>
              <div className="flex flex-col sm:flex-row items-center gap-8">
                  {/* Conic Gradient Donut */}
                  <div className="w-40 h-40 rounded-full relative flex-shrink-0" style={{ background: 'conic-gradient(#8A1538 0% 65%, #3B82F6 65% 85%, #E5E7EB 85% 100%)' }}>
                      <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                          <div className="text-center">
                              <span className="block text-2xl font-black dark:text-white">3.8K</span>
                              <span className="text-xs text-gray-500">Users</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex-1 w-full space-y-3">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-primary-600"></span>
                              <span className="text-sm dark:text-gray-300">Buyers</span>
                          </div>
                          <span className="font-bold dark:text-white">65%</span>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                              <span className="text-sm dark:text-gray-300">Sellers</span>
                          </div>
                          <span className="font-bold dark:text-white">20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600"></span>
                              <span className="text-sm dark:text-gray-300">Dealers</span>
                          </div>
                          <span className="font-bold dark:text-white">15%</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg mb-6 dark:text-white">Recent System Events</h3>
              <div className="space-y-0 relative">
                  {/* Timeline Line */}
                  <div className="absolute left-2.5 top-2 bottom-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                  
                  {[
                      { title: 'New Dealer Registered', time: '2 hours ago', type: 'info' },
                      { title: 'Database Backup Completed', time: '5 hours ago', type: 'success' },
                      { title: 'Failed Login Attempt (Admin)', time: 'Yesterday', type: 'warning' },
                      { title: 'System Update v2.1', time: '2 days ago', type: 'info' },
                  ].map((event, i) => (
                      <div key={i} className="flex gap-4 pb-6 last:pb-0 relative">
                          <div className={`w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 z-10 flex-shrink-0 ${
                              event.type === 'info' ? 'bg-blue-500' : 
                              event.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                              <p className="text-sm font-bold dark:text-white leading-none">{event.title}</p>
                              <span className="text-xs text-gray-500 mt-1 block">{event.time}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
