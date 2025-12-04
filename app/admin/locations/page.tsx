'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Country, City } from '@/types/supabase';
import CountryManager from '@/app/admin/locations/components/CountryManager';
import CityManager from '@/app/admin/locations/components/CityManager';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LocationsManagementPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'countries' | 'cities'>('countries');
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.push('/');
    }
  }, [profile, router]);

  // Fetch countries and cities
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch countries
        const { data: countriesData, error: countriesError } = await supabase
          .from('countries')
          .select('*')
          .order('name');
        
        if (countriesError) throw countriesError;
        
        // Fetch cities
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('*')
          .order('name');
        
        if (citiesError) throw citiesError;
        
        setCountries(countriesData || []);
        setCities(citiesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleAddCountry = async (country: Omit<Country, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .insert([country])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCountries([...countries, data[0]]);
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error adding country:', error);
      return Promise.reject(error);
    }
  };

  const handleUpdateCountry = async (country: Country) => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .update({
          code: country.code,
          name: country.name,
          name_ar: country.name_ar,
          currency_code: country.currency_code,
          currency_symbol: country.currency_symbol,
          currency_name: country.currency_name,
          currency_name_ar: country.currency_name_ar,
          phone_code: country.phone_code,
          is_active: country.is_active
        })
        .eq('id', country.id)
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCountries(countries.map(c => c.id === country.id ? data[0] : c));
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error updating country:', error);
      return Promise.reject(error);
    }
  };

  const handleAddCity = async (city: Omit<City, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert([city])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCities([...cities, data[0]]);
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error adding city:', error);
      return Promise.reject(error);
    }
  };

  const handleUpdateCity = async (city: City) => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .update({
          country_id: city.country_id,
          name: city.name,
          name_ar: city.name_ar,
          is_active: city.is_active
        })
        .eq('id', city.id)
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCities(cities.map(c => c.id === city.id ? data[0] : c));
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Error updating city:', error);
      return Promise.reject(error);
    }
  };

  if (!user || (profile && profile.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('admin.locations.title') || 'Locations Management'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('admin.locations.subtitle') || 'Manage countries and cities across the platform'}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === 'countries'
                    ? 'text-qatar-maroon border-b-2 border-qatar-maroon'
                    : 'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('countries')}
              >
                {t('admin.locations.countries') || 'Countries'}
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg ${
                  activeTab === 'cities'
                    ? 'text-qatar-maroon border-b-2 border-qatar-maroon'
                    : 'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('cities')}
              >
                {t('admin.locations.cities') || 'Cities'}
              </button>
            </li>
          </ul>
        </div>
        
        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="flex flex-col items-center justify-center">
                <LoadingSpinner />
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'countries' && (
                <CountryManager
                  countries={countries}
                  onAddCountry={handleAddCountry}
                  onUpdateCountry={handleUpdateCountry}
                />
              )}
              
              {activeTab === 'cities' && (
                <CityManager
                  cities={cities}
                  countries={countries}
                  onAddCity={handleAddCity}
                  onUpdateCity={handleUpdateCity}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
