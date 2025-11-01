'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import DatabaseManager from '../../../components/admin/DatabaseManager';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface DatabaseStats {
  tables: {
    name: string;
    rowCount: number;
    lastUpdated: string;
  }[];
  totalRows: number;
  lastBackup: string;
}

const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const rows = data.map(item => 
    headers.map(header => {
      const cell = item[header];
      const value = typeof cell === 'object' && cell !== null ? JSON.stringify(cell) : cell;
      return typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    })
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const exportToJSON = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function AdminDatabasePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<DatabaseStats>({
    tables: [],
    totalRows: 0,
    lastBackup: ''
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || authLoading) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (profile?.role !== 'admin') {
          router.push('/');
          return;
        }

        setIsAdmin(true);
        fetchDatabaseStats();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
      }
    };

    checkAdminStatus();
  }, [user, router, authLoading]);

  const fetchDatabaseStats = async () => {
    setLoading(true);
    try {
      // Fetch table statistics
      const tables = ['cars', 'brands', 'models', 'profiles', 'cities', 'countries'];
      const tableStats = await Promise.all(
        tables.map(async (tableName) => {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (error) throw error;

          const { data: lastRow } = await supabase
            .from(tableName)
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            name: tableName,
            rowCount: count || 0,
            lastUpdated: lastRow?.created_at || new Date().toISOString()
          };
        })
      );

      const totalRows = tableStats.reduce((sum, table) => sum + table.rowCount, 0);

      setStats({
        tables: tableStats,
        totalRows,
        lastBackup: new Date().toISOString() // This would come from your backup system
      });
    } catch (error) {
      console.error('Error fetching database stats:', error);
      setError('Failed to fetch database statistics');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Database Management</h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                View and manage database statistics, tables, and backups.
              </p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  const currentDate = new Date().toISOString().split('T')[0];
                  exportToCSV(stats.tables, `database-export-${currentDate}.csv`);
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentDate = new Date().toISOString().split('T')[0];
                  exportToJSON(stats.tables, `database-export-${currentDate}.json`);
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export JSON
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 py-4">
              {error}
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {/* Database Overview */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Overview</h2>
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Total Records</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.totalRows}</dd>
                  </div>
                  <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Total Tables</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{stats.tables.length}</dd>
                  </div>
                  <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Last Backup</dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {new Date(stats.lastBackup).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Table Statistics */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Table Statistics</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Table Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Row Count
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.tables.map((table) => (
                        <tr key={table.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {table.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {table.rowCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {new Date(table.lastUpdated).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Database Manager */}
              <DatabaseManager />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
