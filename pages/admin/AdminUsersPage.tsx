
import React, { useEffect, useState, useRef } from 'react';
import { getAllUsers, exportToCSV } from '../../services/dataService';
import { Profile } from '../../types';
import { Mail, Shield, MoreHorizontal, Search } from 'lucide-react';
import { AdminHeader } from '../../components/admin/AdminHeader';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'dealers'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setRefreshing(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = activeTab === 'all' 
    ? users 
    : users.filter(u => u.role === 'dealer');

  const handleExport = () => {
      exportToCSV(filteredUsers, `users_export_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleImport = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files?.length) {
          alert("Import feature coming soon! File selected: " + e.target.files[0].name);
      }
  };

  return (
    <div>
      <AdminHeader 
        title="User Management"
        description="Manage user accounts, roles, and dealer permissions."
        onRefresh={fetchUsers}
        refreshing={refreshing}
        onExport={handleExport}
        onImport={handleImport}
        onAdd={() => alert("To add a user, please use the Signup page or Import feature.")}
        addLabel="Add User"
      />
      
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv,.json" />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
         <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between gap-4">
             <div className="flex gap-4 text-sm font-medium">
                <button 
                   onClick={() => setActiveTab('all')}
                   className={`pb-2 px-1 border-b-2 transition ${activeTab === 'all' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                   All Users
                </button>
                <button 
                   onClick={() => setActiveTab('dealers')}
                   className={`pb-2 px-1 border-b-2 transition ${activeTab === 'dealers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                   Dealers & Showrooms
                </button>
             </div>
             <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search users..." className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64" />
             </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                   <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                   {loading ? (
                      <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                   ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-500">No users found.</td></tr>
                   ) : (
                      filteredUsers.map(user => (
                         <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                                     {user.full_name?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                     <p className="font-bold text-gray-900 dark:text-white">{user.full_name}</p>
                                     <div className="flex items-center gap-1 text-gray-500 text-xs">
                                        <Mail className="w-3 h-3" /> {user.email || 'No email'}
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                  user.role === 'dealer' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                               }`}>
                                  {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                  {user.role || 'User'}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold">Active</span>
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                               {new Date(user.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                  <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
