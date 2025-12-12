'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { useCountry } from '../../../contexts/CountryContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

// Define the data types for each table
interface ExportableData {
  [key: string]: any[];
}

export default function AdminExportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [exportableData, setExportableData] = useState<ExportableData>({});
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();
  const { currentCountry } = useCountry();

  // Tables that can be exported
  const exportableTables = [
    { name: 'cars', label: 'Cars', description: 'All car listings with their details' },
    { name: 'profiles', label: 'Profiles', description: 'User accounts and profiles' },
    { name: 'brands', label: 'Brands', description: 'Car brands' },
    { name: 'models', label: 'Models', description: 'Car models for each brand' },
    { name: 'countries', label: 'Countries', description: 'Countries supported in the system' },
    { name: 'cities', label: 'Cities', description: 'Cities in each country' },
    { name: 'dealerships', label: 'Dealerships', description: 'Dealership information' },
    { name: 'notifications', label: 'Notifications', description: 'User notifications' },
    { name: 'contact_messages', label: 'Contact Messages', description: 'Messages from contact form' },
  ];

  useEffect(() => {
    checkAdminStatus();
  }, [user?.id]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    setIsLoading(true);
    try {
      let query = supabase.from(tableName).select('*');

      // Add special handling for certain tables
      if (tableName === 'cars') {
        // For cars, we need to fetch all statuses and include related data
        query = supabase.from(tableName).select(`
          id,
          user_id,
          brand_id,
          model_id,
          year,
          mileage,
          price,
          color,
          description,
          fuel_type,
          gearbox_type,
          body_type,
          condition,
          status,
          images,
          thumbnail,
          created_at,
          updated_at,
          image,
          is_featured,
          location,
          cylinders,
          views_count,
          dealership_id,
          country_id,
          city_id,
          exact_model,
          rejection_reason,
          expiration_date,
          brand:brand_id(id, name),
          model:model_id(id, name),
          user:user_id(id, full_name, email),
          country:country_id(id, name, code),
          city:city_id(id, name)
        `);
      } else if (tableName === 'profiles') {
        // For users, we need to fetch profiles and related data
        query = supabase.from(tableName).select(`
          id,
          full_name,
          email,
          phone_number,
          role,
          created_at,
          updated_at,
          country_id,
          password_plain
        `);
      } else if (tableName === 'models') {
        query = supabase.from(tableName).select('*, brand:brand_id(id, name)');
      } else if (tableName === 'cities') {
        query = supabase.from(tableName).select('*, country:country_id(id, name, code)');
      } else if (tableName === 'dealerships') {
        query = supabase.from(tableName).select('*, country:country_id(id, name, code), city:city_id(id, name)');
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        toast.error(`Failed to fetch ${tableName}: ${error.message}`);
        return [];
      }

      // Update the exportable data state
      setExportableData(prev => ({ ...prev, [tableName]: data || [] }));
      return data || [];
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      toast.error(`Failed to fetch ${tableName}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    if (!exportableData[tableName]) {
      await fetchTableData(tableName);
    }
  };

  const exportData = async () => {
    if (!selectedTable) {
      toast.error('Please select a table to export');
      return;
    }

    setIsExporting(true);
    const loadingToastId = toast.loading(`Preparing ${selectedTable} export...`);

    try {
      // If data isn't loaded yet, fetch it now
      let data = exportableData[selectedTable];
      if (!data || data.length === 0) {
        data = await fetchTableData(selectedTable);
        if (!data || data.length === 0) {
          toast.dismiss(loadingToastId);
          toast.error(`No data available for ${selectedTable}`);
          setIsExporting(false);
          return;
        }
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${selectedTable}_export_${timestamp}`;

      if (exportFormat === 'json') {
        // Export as JSON
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Export as CSV
        if (data.length === 0) {
          toast.dismiss(loadingToastId);
          toast.error('No data to export');
          setIsExporting(false);
          return;
        }

        // Get all unique keys from the data
        const allKeys = new Set<string>();
        data.forEach(item => {
          Object.keys(item).forEach(key => allKeys.add(key));
        });
        const columns = Array.from(allKeys);

        // Create CSV content
        const csvRows = [
          columns.join(','), // Header
          ...data.map(item =>
            columns.map(column => {
              const value = item[column];
              if (value === null || value === undefined) return '""';
              if (typeof value === 'object') {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              }
              return `"${String(value).replace(/"/g, '""').replace(/,/g, ';').replace(/\n/g, ' ')}"`;
            }).join(',')
          )
        ].join('\n');

        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.dismiss(loadingToastId);
      toast.success(`Exported ${data.length} ${selectedTable} records as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.dismiss(loadingToastId);
      toast.error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
        <p className="text-gray-700 dark:text-gray-300">
          You do not have permission to access this page. Please contact an administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Data Export</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Table Selection */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Data to Export</h2>
          <div className="space-y-4">
            {exportableTables.map((table) => (
              <div
                key={table.name}
                className={`p-3 rounded-lg cursor-pointer transition-all ${selectedTable === table.name
                  ? 'bg-qatar-maroon text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                onClick={() => handleTableSelect(table.name)}
              >
                <h3 className="font-medium">{table.label}</h3>
                <p className={`text-sm ${selectedTable === table.name ? 'text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                  {table.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Options</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Format
            </label>
            <div className="flex space-x-4">
              <button
                className={`px-4 py-2 rounded-md ${exportFormat === 'json'
                  ? 'bg-qatar-maroon text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                onClick={() => setExportFormat('json')}
              >
                JSON
              </button>
              <button
                className={`px-4 py-2 rounded-md ${exportFormat === 'csv'
                  ? 'bg-qatar-maroon text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                onClick={() => setExportFormat('csv')}
              >
                CSV
              </button>
            </div>
          </div>

          <button
            className="w-full px-4 py-2 bg-qatar-maroon text-white rounded-md hover:bg-qatar-maroon-dark disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={exportData}
            disabled={!selectedTable || isExporting}
          >
            {isExporting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </span>
            ) : (
              `Export ${selectedTable ? exportableTables.find(t => t.name === selectedTable)?.label : 'Data'} as ${exportFormat.toUpperCase()}`
            )}
          </button>
        </div>

        {/* Data Preview */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Preview</h2>

          {selectedTable ? (
            <>
              <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                {exportableData[selectedTable] ? (
                  <span>{exportableData[selectedTable].length} records available</span>
                ) : (
                  <span>Loading data...</span>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md overflow-auto max-h-80">
                {exportableData[selectedTable] && exportableData[selectedTable].length > 0 ? (
                  <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {JSON.stringify(exportableData[selectedTable][0], null, 2)}
                  </pre>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No data available</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">Select a table to see data preview</p>
          )}
        </div>
      </div>
    </div>
  );
}
