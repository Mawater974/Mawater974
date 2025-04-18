'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Showroom, DealershipType } from '@/types/showroom';
import ShowroomCard from '@/components/showrooms/ShowroomCard';
import DealershipRegistrationModal from '@/components/showrooms/DealershipRegistrationModal';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useCountry } from '@/contexts/CountryContext';
import { City } from '@/types/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoginPopup from '@/components/LoginPopup';

export default function ShowroomsPage() {
  const { t, language, currentLanguage } = useLanguage();
  const { supabase } = useSupabase();
  const { user } = useAuth();
  const { currentCountry, getCitiesByCountry } = useCountry();
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDealershipType, setSelectedDealershipType] = useState<DealershipType | ''>('');
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  // Show registration modal when user clicks register
  const handleRegisterClick = () => {
    setIsRegistrationModalOpen(true);
  };
  const [cities, setCities] = useState<City[]>([]);

  const fetchShowrooms = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Fetch approved dealerships from the dealerships table
      const { data, error } = await supabase
        .from('dealerships')
        .select(`
          *,
          cities:city_id (
            id,
            name,
            name_ar
          )
        `)
        .eq('status', 'approved')
        .eq('country_id', currentCountry.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      

      // Transform the data to match the Showroom interface
      const transformedData = data.map(dealership => ({
        id: dealership.id,
        name: dealership.business_name,
        name_ar: dealership.business_name_ar,
        description: dealership.description,
        description_ar: dealership.description_ar,
        logo: dealership.logo_url,
        coverImage: dealership.cover_image_url,
        location: dealership.cities?.name || dealership.location || '',
        location_ar: dealership.cities?.name_ar || dealership.location_ar || '',
        city_id: dealership.city_id,
        rating: dealership.rating || 0,
        reviewCount: 0, // Default value as we don't have reviews yet
        featured: dealership.featured || false, // Use the featured field from the database
        contactInfo: {
          phone: dealership.phone || '',
          email: dealership.email || ''
        },
        dealershipType: dealership.dealership_type,
        businessType: dealership.business_type,
        user_id: dealership.user_id
      }));

      
      setShowrooms(transformedData);
    } catch (error) {
      console.error('Error fetching showrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentCountry) {
      fetchShowrooms();
    }
  }, [currentCountry]);

  // Track page view when component mounts
  useEffect(() => {
    if (currentCountry?.code) {
      const trackPageView = async () => {
        try {
          const response = await fetch('/api/analytics/page-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              countryCode: currentCountry.code,
              userId: user?.id,
              pageType: 'showrooms'
            })
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to track page view:', error);
          }
        } catch (error) {
          console.error('Failed to track page view:', error);
        }
      };

      trackPageView();
    }
  }, [currentCountry?.code, user?.id]);

  useEffect(() => {
    if (currentCountry) {
      setShowrooms([]); // Clear existing showrooms
      setSelectedLocation(''); // Reset location filter
      fetchShowrooms();
    }
  }, [currentCountry, supabase, getCitiesByCountry]);

  useEffect(() => {
    if (currentCountry) {
      // Get cities for the current country
      const countryCities = getCitiesByCountry(currentCountry.id);
      setCities(countryCities);
    }
  }, [currentCountry, getCitiesByCountry]);

  // Track page view when component mounts
  useEffect(() => {
    if (currentCountry?.code) {
      const trackPageView = async () => {
        try {
          const response = await fetch('/api/analytics/page-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              countryCode: currentCountry.code,
              userId: user?.id,
              pageType: 'showrooms'
            })
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to track page view:', error);
          }
        } catch (error) {
          console.error('Failed to track page view:', error);
        }
      };

      trackPageView();
    }
  }, [currentCountry?.code, user?.id]);

  const filteredShowrooms = showrooms.filter(showroom => {
    const searchText = searchQuery.toLowerCase();
    const nameMatch = language === 'ar' 
      ? (showroom.name_ar?.toLowerCase().includes(searchText) || showroom.name.toLowerCase().includes(searchText))
      : showroom.name.toLowerCase().includes(searchText);
    
    const descriptionMatch = language === 'ar'
      ? (showroom.description_ar?.toLowerCase().includes(searchText) || showroom.description.toLowerCase().includes(searchText))
      : showroom.description.toLowerCase().includes(searchText);
    
    const matchesSearch = nameMatch || descriptionMatch;
    const matchesLocation = !selectedLocation || showroom.city_id?.toString() === selectedLocation;
    const matchesDealershipType = !selectedDealershipType || showroom.dealershipType === selectedDealershipType;
    
    return matchesSearch && matchesLocation && matchesDealershipType;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
  <div className="min-h-screen">
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-0">
          {t('showroom.title')}
        </h1>
        <button
          onClick={handleRegisterClick}
          className="bg-qatar-maroon text-white px-6 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors"
        >
          {t('showroom.registerDealership')}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('showroom.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white appearance-none"
            >
              <option value="">{t('showroom.allLocations')}</option>
              {cities.map(city => (
                <option key={city.id} value={city.id.toString()}>
                  {currentLanguage === 'ar' ? city.name_ar : city.name}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={selectedDealershipType}
              onChange={(e) => setSelectedDealershipType(e.target.value as DealershipType | '')}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-qatar-maroon focus:border-qatar-maroon dark:bg-gray-700 dark:text-white appearance-none"
            >
              <option value="">{t('showroom.allDealershipTypes')}</option>
              <option value="Official">{t('showroom.dealershipTypes.official')}</option>
              <option value="Private">{t('showroom.dealershipTypes.private')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Featured Showrooms */}
      {filteredShowrooms.some(showroom => showroom.featured === true) && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            {t('showroom.featuredShowrooms')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShowrooms
              .filter(showroom => showroom.featured === true)
              .map((showroom) => (
                <ShowroomCard key={showroom.id} showroom={showroom} />
              ))}
          </div>
        </div>
      )}

      {/* All Showrooms */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {t('showroom.allShowrooms')}
        </h2>
        {filteredShowrooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShowrooms
              .filter(showroom => showroom.featured !== true)
              .map((showroom) => (
                <ShowroomCard key={showroom.id} showroom={showroom} />
              ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {t('showroom.noResults')}
          </div>
        )}
      </div>

      <DealershipRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
      />
    </div>
    <LoginPopup delay={5000} />
  </div>
  );
}
