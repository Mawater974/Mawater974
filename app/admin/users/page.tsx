'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Profile } from '../../../types/supabase';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface UserWithStats extends Profile {
  total_ads: number;
  country_name?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (!profile || profile.role !== 'admin') {
        router.push('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with their car counts
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          cars:cars(count)
        `);

      if (error) throw error;

      // Get country names
      const { data: countries } = await supabase
        .from('countries')
        .select('code, name');

      const countryMap = {};
      if (countries) {
        countries.forEach(country => {
          countryMap[country.code] = country.name;
        });
      }

      const usersWithStats = data.map(user => ({
        ...user,
        total_ads: user.cars?.[0]?.count || 0,
        country_name: user.country_code ? countryMap[user.country_code] : 'Unknown'
      }));

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleChange = async (userId: string, newRole: 'normal_user' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_logs').insert([{
        admin_id: user!.id,
        action_type: 'update_user_role',
        table_name: 'profiles',
        record_id: userId,
        changes: { role: newRole }
      }]);

      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast.success(`User role updated to ${newRole}`);
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error.message || 'Failed to update user role');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <p className="text-lg text-gray-600 dark:text-gray-400">Checking admin privileges...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users Management</h2>
          </div>
          
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cars</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.phone_number?.replace(/^(\+\d{1,3})(\d+)/, '$1-$2') || 'No Phone'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{user.country_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-qatar-maroon text-white' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.total_ads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {user.role === 'admin' ? (
                          <button
                            onClick={() => handleUserRoleChange(user.id, 'normal_user')}
                            className="text-qatar-maroon hover:text-qatar-maroon-dark dark:text-qatar-maroon-light"
                          >
                            Make Normal User
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserRoleChange(user.id, 'admin')}
                            className="text-qatar-maroon hover:text-qatar-maroon-dark dark:text-qatar-maroon-light"
                          >
                            Make Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
