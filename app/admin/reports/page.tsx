'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format as formatDate } from 'date-fns';
import Link from 'next/link';
import { useCountry } from '@/contexts/CountryContext';
import { Brand } from '@/types/supabase';
import { Car } from '@/types/supabase';

interface ExtendedCar extends Car {
  brand: {
    name: string;
  };
  model: {
    name: string;
  };
  user: {
    full_name: string;
    email: string;
  };
  images: {
    url: string;
    is_main: boolean;
  }[];
}

type CarReport = {
  id: string;
  car_id: number;
  user_id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  country_code: string;
  cars: {
    id: number;
    description: string;
    price: number;
    brand: Brand;
    model: {
      id: number;
      name: string;
    };
  };
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
};

export default function ReportsManagement() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { currentCountry } = useCountry();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [cars, setCars] = useState<ExtendedCar[]>([]);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (authLoading) return;

      if (!user) {
        router.push('/login?redirect=/admin/reports');
        return;
      }

      try {
        // Check if user is admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (!profile || profile.role !== 'admin') {
          toast.error('Access denied. Admin privileges required.');
          router.push('/');
          return;
        }

        // Fetch reports
        await fetchReports();
        // Fetch brands
        await fetchBrands();
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [user, authLoading, router]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('car_reports')
        .select(`
          id,
          car_id,
          user_id,
          reason,
          description,
          status,
          created_at,
          updated_at,
          country_code,
          cars!car_id(id, description, price, brand_id, model_id),
          profiles!user_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply country filter
      if (countryFilter !== 'all') {
        query = query.eq('country_code', countryFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name');

      if (error) throw error;

      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      setError(error.message);
      toast.error('Failed to fetch brands');
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('car_reports')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      // Update local state
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus, updated_at: new Date().toISOString() } 
          : report
      ));
      
      toast.success(`Report status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating report status:', error);
      toast.error('Failed to update report status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Dismissed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getReasonTranslation = (reason: string) => {
    const reasonMap = {
      'spam': t('car.details.reportReasons.spam'),
      'fraud': t('car.details.reportReasons.fraud'),
      'inappropriate': t('car.details.reportReasons.inappropriate'),
      'duplicate': t('car.details.reportReasons.duplicate'),
      'wrong_info': t('car.details.reportReasons.wrong_info'),
      'other': t('car.details.reportReasons.other')
    };
    
    return reasonMap[reason] || reason;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-qatar-maroon text-white px-4 py-2 rounded hover:bg-qatar-maroon-dark"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto py-10">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Manage Car Reports</h1>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country Filter
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="border dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-qatar-maroon dark:focus:ring-qatar-maroon-light"
            >
              <option value="all">All Countries</option>
              <option value="QA">Qatar</option>
              <option value="SA">Saudi Arabia</option>
              <option value="AE">UAE</option>
              <option value="KW">Kuwait</option>
              <option value="SY">Syria</option>
              <option value="OM">Oman</option>
              <option value="BH">Bahrain</option>
              <option value="JO">Jordan</option>
              <option value="EG">Egypt</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => fetchReports()}
              className="bg-qatar-maroon hover:bg-qatar-maroon-dark text-white px-4 py-2 rounded transition-colors duration-200"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No reports found with the selected filters
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Car
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reported By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {report.cars?.brand?.name} {report.cars?.model?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {report.profiles?.full_name || 'Unknown User'}
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {report.profiles?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <div>{getReasonTranslation(report.reason)}</div>
                      {report.description && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 max-w-xs truncate">
                          {report.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(new Date(report.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <select
                          value={report.status}
                          onChange={(e) => handleUpdateStatus(report.id, e.target.value)}
                          className="border dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Reviewed">Reviewed</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Dismissed">Dismissed</option>
                        </select>
                        {report.cars && (
                          <Link 
                            href={`/cars/${report.cars.id}`} 
                            className="text-qatar-maroon hover:text-qatar-maroon-dark"
                          >
                            View Car
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
