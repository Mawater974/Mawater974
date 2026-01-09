
import React, { useState } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { BarChart, PieChart, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    alert("Downloading PDF Report...");
  };

  return (
    <div>
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
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                 <TrendingUp className="w-6 h-6" />
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
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                 <BarChart className="w-6 h-6" />
              </div>
           </div>
           <div className="flex items-center gap-1 text-sm text-blue-600 font-bold">
              <ArrowUpRight className="w-4 h-4" /> +5.2% <span className="text-gray-400 font-normal ml-1">vs last month</span>
           </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-gray-500 text-sm font-bold">Traffic Source</p>
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white mt-1">Mobile</h3>
              </div>
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                 <PieChart className="w-6 h-6" />
              </div>
           </div>
           <div className="text-sm text-gray-500 mt-2">
              <span className="font-bold text-gray-900 dark:text-white">68%</span> of users visit via mobile app.
           </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-80 flex flex-col justify-center items-center">
             <BarChart className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
             <p className="text-gray-500 font-medium">User Growth Chart (Placeholder)</p>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-80 flex flex-col justify-center items-center">
             <Calendar className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" />
             <p className="text-gray-500 font-medium">Monthly Activity (Placeholder)</p>
         </div>
      </div>
    </div>
  );
};
