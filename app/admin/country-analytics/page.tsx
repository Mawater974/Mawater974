'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ChartBarIcon, GlobeAsiaAustraliaIcon, UsersIcon, ShoppingCartIcon, ArrowPathIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const exportToCSV = (data: any[], filename: string) => {
  // Convert data to CSV format
  const headers = [
    'Country',
    'Country Code',
    'Arabic Name',
    'Total Users',
    'New Users This Month',
    'Total Cars',
    'Active Listings',
    'Pending Listings',
    'Sold Listings',
    'Featured Listings',
    'Total Dealers',
    'New Dealers This Month',
    'Average Price (QAR)',
    'Most Popular Brand',
    'Brand Listings Count',
    'Top Dealers'
  ];

  const rows = data.map(country => [
    country.name,
    country.code,
    country.name_ar,
    country.users,
    country.newUsersThisMonth,
    country.cars,
    country.activeListings,
    country.pendingListings,
    country.soldListings,
    country.featuredListings,
    country.dealers,
    country.newDealersThisMonth,
    country.averagePrice,
    country.mostPopularBrand.name,
    country.mostPopularBrand.count,
    country.topDealers.map(d => `${d.name}(${d.listings})`).join('; ')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => 
      typeof cell === 'string' && cell.includes(',') 
        ? `"${cell}"` 
        : cell
    ).join(','))
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Create object URL and download
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

interface CountryStats {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  users: number;
  cars: number;
  dealers: number;
  totalSales: number;
  activeListings: number;
  pendingListings: number;
  soldListings: number;
  newUsersThisMonth: number;
  newDealersThisMonth: number;
  featuredListings: number;
  averagePrice: number;
  mostPopularBrand: {
    name: string;
    count: number;
  };
  topDealers: Array<{
    name: string;
    listings: number;
  }>;
}

export default function CountryAnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CountryStats[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
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
      fetchCountryStats();
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/');
    }
  };

  const fetchCountryStats = async () => {
    try {
      setLoading(true);

      // Fetch countries with their stats
      const { data: countries, error: countriesError } = await supabase
        .from('countries')
        .select('*');

      if (countriesError) throw countriesError;

      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();

      // Fetch additional stats for each country
      const statsPromises = countries.map(async (country) => {
        const [
          usersCount,
          carsCount,
          dealersCount,
          listingStats,
          newUsersCount,
          newDealersCount,
          featuredCount,
          priceStats,
          popularBrand,
          topDealersData
        ] = await Promise.all([
          // Total users
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('country_id', country.id)
            .then(({ count }) => count || 0),
          
          // Total cars
          supabase
            .from('cars')
            .select('id', { count: 'exact' })
            .eq('country_id', country.id)
            .then(({ count }) => count || 0),
          
          // Total dealers
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('country_id', country.id)
            .eq('role', 'dealer')
            .then(({ count }) => count || 0),
          
          // Listing stats by status
          supabase
            .from('cars')
            .select('status')
            .eq('country_id', country.id)
            .then(({ data }) => ({
              active: data?.filter(car => car.status === 'active').length || 0,
              pending: data?.filter(car => car.status === 'pending').length || 0,
              sold: data?.filter(car => car.status === 'sold').length || 0
            })),
          
          // New users this month
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('country_id', country.id)
            .gte('created_at', firstDayOfMonth)
            .then(({ count }) => count || 0),
          
          // New dealers this month
          supabase
            .from('profiles')
            .select('id', { count: 'exact' })
            .eq('country_id', country.id)
            .eq('role', 'dealer')
            .gte('created_at', firstDayOfMonth)
            .then(({ count }) => count || 0),
          
          // Featured listings count
          supabase
            .from('cars')
            .select('id', { count: 'exact' })
            .eq('country_id', country.id)
            .eq('is_featured', true)
            .then(({ count }) => count || 0),
          
          // Average price
          supabase
            .from('cars')
            .select('price')
            .eq('country_id', country.id)
            .then(({ data }) => {
              if (!data?.length) return 0;
              const prices = data.map(car => Number(car.price)).filter(price => !isNaN(price));
              return prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
            }),
          
          // Most popular brand
          supabase
            .from('cars')
            .select('brand_id, brands!inner(name)')
            .eq('country_id', country.id)
            .then(({ data }) => {
              if (!data?.length) return { name: 'N/A', count: 0 };
              const brandCounts = data.reduce((acc: { [key: string]: number }, car: any) => {
                const brandName = car.brands?.name || 'Unknown';
                acc[brandName] = (acc[brandName] || 0) + 1;
                return acc;
              }, {});
              const topBrand = Object.entries(brandCounts)
                .sort((a, b) => b[1] - a[1])[0];
              return { name: topBrand?.[0] || 'N/A', count: topBrand?.[1] || 0 };
            }),
          
          // Top dealers
          supabase
            .from('profiles')
            .select('id, full_name')
            .eq('country_id', country.id)
            .eq('role', 'dealer')
            .limit(3)
            .then(async ({ data: dealers }) => {
              if (!dealers?.length) return [];
              const dealerStats = await Promise.all(
                dealers.map(async dealer => {
                  const { count } = await supabase
                    .from('cars')
                    .select('id', { count: 'exact' })
                    .eq('user_id', dealer.id);
                  return {
                    name: dealer.full_name,
                    listings: count || 0
                  };
                })
              );
              return dealerStats.sort((a, b) => b.listings - a.listings);
            })
        ]);

        return {
          ...country,
          users: usersCount,
          cars: carsCount,
          dealers: dealersCount,
          activeListings: listingStats.active,
          pendingListings: listingStats.pending,
          soldListings: listingStats.sold,
          newUsersThisMonth: newUsersCount,
          newDealersThisMonth: newDealersCount,
          featuredListings: featuredCount,
          averagePrice: priceStats,
          mostPopularBrand: popularBrand,
          topDealers: topDealersData,
          totalSales: listingStats.sold // Using sold listings as total sales
        };
      });

      const countryStats = await Promise.all(statsPromises);
      setStats(countryStats);
    } catch (error) {
      console.error('Error fetching country stats:', error);
      setError('Failed to load country analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center mb-8">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Country Analytics</h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                View detailed analytics for each country in the platform.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-4">
              <button
                type="button"
                onClick={() => exportToCSV(stats, `all-countries-analytics-${new Date().toISOString().split('T')[0]}.csv`)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export All
              </button>
              <button
                type="button"
                onClick={() => fetchCountryStats()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 dark:text-red-400 py-4">{error}</div>
          ) : (
            <div className="mt-8 grid gap-6 grid-cols-1">
              {stats.map((country) => (
                <div
                  key={country.id}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <GlobeAsiaAustraliaIcon className="h-8 w-8 text-qatar-maroon" />
                        <div className="ml-3">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {country.name} ({country.code.toUpperCase()})
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {country.name_ar}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => exportToCSV([country], `${country.code}-analytics-${new Date().toISOString().split('T')[0]}.csv`)}
                          className="inline-flex items-center px-3 py-1 text-sm border border-qatar-maroon text-qatar-maroon hover:bg-qatar-maroon hover:text-white rounded-md transition-colors"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Export
                        </button>
                        <div className="flex items-center space-x-2">
                          <div className="px-3 py-1 rounded-full bg-qatar-maroon/10 text-qatar-maroon text-sm">
                            {country.pendingListings} Pending
                          </div>
                          <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                            {country.activeListings} Active
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Users Card */}
                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Total Users</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{country.users}</dd>
                          </div>
                          <div className="p-3 rounded-full bg-qatar-maroon/10">
                            <UsersIcon className="h-6 w-6 text-qatar-maroon" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            +{country.newUsersThisMonth} this month
                          </div>
                        </div>
                      </div>

                      {/* Cars Card */}
                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Total Cars</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{country.cars}</dd>
                          </div>
                          <div className="p-3 rounded-full bg-qatar-maroon/10">
                            <ChartBarIcon className="h-6 w-6 text-qatar-maroon" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {country.featuredListings} featured
                          </div>
                        </div>
                      </div>

                      {/* Dealers Card */}
                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Dealers</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{country.dealers}</dd>
                          </div>
                          <div className="p-3 rounded-full bg-qatar-maroon/10">
                            <UsersIcon className="h-6 w-6 text-qatar-maroon" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            +{country.newDealersThisMonth} this month
                          </div>
                        </div>
                      </div>

                      {/* Sales Card */}
                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Total Sales</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{country.totalSales}</dd>
                          </div>
                          <div className="p-3 rounded-full bg-qatar-maroon/10">
                            <ShoppingCartIcon className="h-6 w-6 text-qatar-maroon" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Avg. {country.averagePrice} QAR
                          </div>
                        </div>
                      </div>

                      {/* Popular Brand Card */}
                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6 col-span-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Most Popular Brand</dt>
                            <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                              {country.mostPopularBrand.name}
                            </dd>
                          </div>
                          <div className="text-3xl font-bold text-qatar-maroon">
                            {country.mostPopularBrand.count}
                          </div>
                        </div>
                      </div>

                      {/* Top Dealers Card */}
                      <div className="px-4 py-5 bg-gray-50 dark:bg-gray-700 shadow rounded-lg overflow-hidden sm:p-6 col-span-2">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-3">Top Dealers</dt>
                        <div className="space-y-3">
                          {country.topDealers.map((dealer, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{dealer.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{dealer.listings} listings</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
