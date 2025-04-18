'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface CountryAnalyticsProps {
  countryCode: string;
  countryName: string;
}

interface CountryStats {
  totalCars: number;
  pendingCars: number;
  activeCars: number;
  soldCars: number;
  featuredCars: number;
  totalRevenue: number;
  averagePrice: number;
  totalUsers: number;
  topBrands: {
    brand: string;
    count: number;
  }[];
}

export default function CountryAnalytics({ countryCode, countryName }: CountryAnalyticsProps) {
  const [stats, setStats] = useState<CountryStats>({
    totalCars: 0,
    pendingCars: 0,
    activeCars: 0,
    soldCars: 0,
    featuredCars: 0,
    totalRevenue: 0,
    averagePrice: 0,
    totalUsers: 0,
    topBrands: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchCountryStats = async () => {
      try {
        setLoading(true);
        
        // Fetch cars for this country
        const { data: carsData, error: carsError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands(name)
          `)
          .eq('country_code', countryCode);

        if (carsError) throw carsError;

        // Fetch users for this country
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('country_code', countryCode);

        if (usersError) throw usersError;

        // Calculate brand statistics
        const brandCounts = {};
        carsData.forEach(car => {
          const brandName = car.brand?.name || 'Unknown';
          brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
        });

        const topBrands = Object.entries(brandCounts)
          .map(([brand, count]) => ({ brand, count: count as number }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate other statistics
        const totalCars = carsData.length;
        const pendingCars = carsData.filter(car => car.status === 'Pending').length;
        const activeCars = carsData.filter(car => car.status === 'Approved').length;
        const soldCars = carsData.filter(car => car.status === 'Sold').length;
        const featuredCars = carsData.filter(car => car.is_featured).length;
        const totalRevenue = carsData.reduce((sum, car) => sum + (car.price || 0), 0);
        const averagePrice = totalCars > 0 ? totalRevenue / totalCars : 0;
        const totalUsers = usersData.length;

        setStats({
          totalCars,
          pendingCars,
          activeCars,
          soldCars,
          featuredCars,
          totalRevenue,
          averagePrice,
          totalUsers,
          topBrands
        });

      } catch (error) {
        console.error(`Error fetching stats for ${countryName}:`, error);
        setError(`Failed to load data for ${countryName}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryStats();
  }, [countryCode, countryName]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{countryName}</h3>
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{countryName}</h3>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-qatar-maroon hover:text-qatar-maroon-dark dark:text-qatar-maroon-light"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Total Cars */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Cars</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalCars}</p>
            </div>
          </div>
        </div>

        {/* Active Cars */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Active Cars</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.activeCars}</p>
            </div>
          </div>
        </div>

        {/* Pending Cars */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending Cars</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.pendingCars}</p>
            </div>
          </div>
        </div>

        {/* Sold Cars */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Sold Cars</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.soldCars}</p>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Revenue */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                QAR {stats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Avg: QAR {stats.averagePrice.toFixed(0).toLocaleString()}
              </p>
            </div>

            {/* Users */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Users</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.totalUsers}
              </p>
            </div>

            {/* Featured Cars */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Featured Cars</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.featuredCars}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stats.totalCars > 0 ? ((stats.featuredCars / stats.totalCars) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
          </div>

          {/* Top Brands */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Top Brands</h4>
            <div className="space-y-2">
              {stats.topBrands.map((brand, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{brand.brand}</span>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300 mr-3">{brand.count} cars</span>
                    <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-qatar-maroon dark:bg-qatar-maroon-light h-2 rounded-full" 
                        style={{ width: `${(brand.count / stats.totalCars) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
              {stats.topBrands.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">No brand data available</p>
              )}
            </div>
          </div>

          {/* Car Status Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Status Distribution</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">Active</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {stats.activeCars} ({stats.totalCars > 0 ? ((stats.activeCars / stats.totalCars) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                  <div 
                    className="h-2 bg-green-500 rounded-full" 
                    style={{ width: `${stats.totalCars > 0 ? (stats.activeCars / stats.totalCars) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">Pending</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {stats.pendingCars} ({stats.totalCars > 0 ? ((stats.pendingCars / stats.totalCars) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                  <div 
                    className="h-2 bg-yellow-500 rounded-full" 
                    style={{ width: `${stats.totalCars > 0 ? (stats.pendingCars / stats.totalCars) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">Sold</span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {stats.soldCars} ({stats.totalCars > 0 ? ((stats.soldCars / stats.totalCars) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full" 
                    style={{ width: `${stats.totalCars > 0 ? (stats.soldCars / stats.totalCars) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
