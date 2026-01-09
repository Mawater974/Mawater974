
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats, getCars, getAllUsers } from '../../services/dataService';
import { Car, Profile } from '../../types';
import { 
    Users, Car as CarIcon, Building2, ShoppingBag, TrendingUp, 
    ShieldAlert, ArrowRight, PlusCircle
} from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ carsCount: 0, usersCount: 0, dealersCount: 0, partsCount: 0 });
  const [recentCars, setRecentCars] = useState<Car[]>([]);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
        const [statsData, carsResponse, usersData] = await Promise.all([
            getAdminStats(),
            getCars({}, 1, 5), // Latest 5 cars
            getAllUsers() // We'll slice first 5
        ]);
        
        setStats(statsData);
        setRecentCars(carsResponse.data);
        setRecentUsers(usersData.slice(0, 5));
    } catch (e) {
        console.error("Failed to fetch dashboard data", e);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
      <div className="flex h-screen items-center justify-center">
          <LoadingSpinner className="w-16 h-16" />
      </div>
  );

  const statCards = [
    { label: 'Total Listings', value: stats.carsCount, icon: CarIcon, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Registered Users', value: stats.usersCount, icon: Users, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Active Dealers', value: stats.dealersCount, icon: Building2, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Spare Parts', value: stats.partsCount, icon: ShoppingBag, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ];

  return (
    <div className="space-y-8 pb-12">
      <AdminHeader 
        title="Admin Dashboard" 
        description="Overview of system performance and recent activity."
        onRefresh={fetchData}
        refreshing={refreshing}
        onAdd={() => window.location.hash = '/admin/cars'}
        addLabel="Add Listing"
      />

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
           <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition">
              <div>
                 <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                 <h3 className="text-3xl font-black mt-1 dark:text-white">{stat.value}</h3>
                 <span className="text-green-500 text-xs font-bold flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3" /> +12% this week
                 </span>
              </div>
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                 <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
           </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Column */}
         <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4 dark:text-white">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/admin/cars" className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition group text-center flex flex-col items-center justify-center gap-2">
                        <CarIcon className="w-6 h-6 text-gray-400 group-hover:text-primary-600" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary-700">Manage Cars</span>
                    </Link>
                    <Link to="/admin/dealers" className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition group text-center flex flex-col items-center justify-center gap-2">
                        <Building2 className="w-6 h-6 text-gray-400 group-hover:text-purple-600" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-purple-700">Approve Dealers</span>
                    </Link>
                    <Link to="/admin/users" className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition group text-center flex flex-col items-center justify-center gap-2">
                        <Users className="w-6 h-6 text-gray-400 group-hover:text-green-600" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-green-700">User Roles</span>
                    </Link>
                    <Link to="/admin/settings" className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition group text-center flex flex-col items-center justify-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-gray-400 group-hover:text-orange-600" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-orange-700">Security Audit</span>
                    </Link>
                </div>
            </div>

            {/* Recent Cars */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">Recent Car Listings</h3>
                    <Link to="/admin/cars" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500">
                            <tr>
                                <th className="px-6 py-4">Vehicle</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {recentCars.map(car => (
                                <tr key={car.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                                {car.car_images?.[0] && <img src={car.car_images[0].thumbnail_url || car.car_images[0].image_url} alt="" className="w-full h-full object-cover" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{car.brands?.name} {car.models?.name}</p>
                                                <p className="text-xs text-gray-500">{car.year}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-primary-600">{car.price.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                                            car.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            car.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {car.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(car.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
         </div>

         {/* Side Column */}
         <div className="space-y-8">
            {/* User Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">New Users</h3>
                    <Link to="/admin/users" className="text-sm text-primary-600 hover:underline">View All</Link>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {recentUsers.map(user => (
                        <div key={user.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                                {user.full_name?.[0] || 'U'}
                            </div>
                            <div className="flex-grow">
                                <p className="font-bold text-sm text-gray-900 dark:text-white">{user.full_name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <span className="text-xs text-gray-400">{new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Mini-Charts (Mock) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                 <h3 className="font-bold text-lg mb-4 dark:text-white">System Health</h3>
                 <div className="space-y-4">
                     <div>
                         <div className="flex justify-between text-xs mb-1">
                             <span className="text-gray-500">Server Load</span>
                             <span className="text-green-500 font-bold">24%</span>
                         </div>
                         <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-green-500 w-[24%] rounded-full"></div>
                         </div>
                     </div>
                     <div>
                         <div className="flex justify-between text-xs mb-1">
                             <span className="text-gray-500">Database Storage</span>
                             <span className="text-blue-500 font-bold">65%</span>
                         </div>
                         <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500 w-[65%] rounded-full"></div>
                         </div>
                     </div>
                     <div>
                         <div className="flex justify-between text-xs mb-1">
                             <span className="text-gray-500">API Requests (Daily)</span>
                             <span className="text-purple-500 font-bold">85%</span>
                         </div>
                         <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-purple-500 w-[85%] rounded-full"></div>
                         </div>
                     </div>
                 </div>
            </div>
            
            {/* Notifications Box (Mock) */}
            <div className="bg-gradient-to-br from-primary-900 to-primary-800 p-6 rounded-xl text-white shadow-lg">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-yellow-400" /> Admin Alerts
                </h3>
                <ul className="space-y-3 text-sm text-primary-100">
                    <li className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0"></span>
                        <p>3 new dealer applications pending approval.</p>
                    </li>
                    <li className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                        <p>System update scheduled for 2:00 AM UTC.</p>
                    </li>
                    <li className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></span>
                        <p>Database backup completed successfully.</p>
                    </li>
                </ul>
            </div>
         </div>
      </div>
    </div>
  );
};
