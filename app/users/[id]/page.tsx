'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import { MapPinIcon, EnvelopeIcon, CalendarIcon, TruckIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { format } from 'date-fns';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  countries?: {
    name: string;
  };
};

type CarListing = Database['public']['Tables']['cars']['Row'] & {
  brand: { name: string };
  model: { name: string };
  car_images: Array<{ image_url: string }>;
};

type SparePartListing = Database['public']['Tables']['spare_parts']['Row'] & {
  images: Array<{ url: string; is_main?: boolean }>;
};

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<'cars' | 'spareParts'>('cars');
  const [carListings, setCarListings] = useState<CarListing[]>([]);
  const [sparePartListings, setSparePartListings] = useState<SparePartListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSpareParts, setLoadingSpareParts] = useState(false);
  const { t } = useLanguage();

  // Alias TruckIcon as CarIcon for better semantics
  const CarIcon = TruckIcon;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!id) {
          throw new Error('Profile ID is required');
        }

        // Get profile by ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            countries (name)
          `)
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        if (!profileData) {
          throw new Error('Profile not found');
        }

        setProfile(profileData);

        // Fetch user's car listings
        const { data: carListingsData, error: carListingsError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands (name),
            model:car_models (name),
            car_images (image_url)
          `)
          .eq('user_id', id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (carListingsError) throw carListingsError;
        setCarListings(carListingsData || []);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id, supabase]);

  // Fetch spare parts when the tab is active and not already loaded
  useEffect(() => {
    const fetchSpareParts = async () => {
      if (activeTab === 'spareParts' && sparePartListings.length === 0) {
        try {
          setLoadingSpareParts(true);
          const { data, error } = await supabase
            .from('spare_parts')
            .select('*')
            .eq('user_id', id)
            .eq('status', 'Approved')
            .order('created_at', { ascending: false });

          if (error) throw error;
          setSparePartListings(data || []);
        } catch (error) {
          console.error('Error fetching spare parts:', error);
        } finally {
          setLoadingSpareParts(false);
        }
      }
    };

    fetchSpareParts();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t('profile.notFound')}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {t('profile.userNotFound')}
          </p>
          <Link 
            href="/" 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('common.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <div className="px-6 pb-6 -mt-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center">
                <div className="h-32 w-32 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Profile'}
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {getInitials(profile.full_name || 'U')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.full_name || t('profile.anonymousUser')}
                  </h1>
                  {profile.phone_number && (
                    <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
                      <PhoneIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                      <a 
                        href={`tel:${profile.phone_number}`}
                        className="text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {profile.phone_number}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
                    <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                    <span className="text-sm">
                      {t('profile.memberSince')} {format(new Date(profile.created_at), 'MMMM yyyy')}
                    </span>
                  </div>
                  {profile.country_id && (
                    <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        {profile.countries?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <div className="flex space-x-3">
                  {profile.phone_number && (
                    <a 
                      href={`tel:${profile.phone_number}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      {t('profile.call')}
                    </a>
                  )}
                  {profile.email && (
                    <button 
                      onClick={() => window.location.href = `mailto:${profile.email}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      {t('profile.email')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {profile.bio && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('profile.about')}</h3>
                <p className="mt-1 text-gray-600 dark:text-gray-300">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Listings Section with Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('cars')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'cars'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {t('profile.cars')} ({carListings.length})
              </button>
              <button
                onClick={() => setActiveTab('spareParts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'spareParts'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {t('profile.spareParts')} {activeTab === 'spareParts' ? `(${sparePartListings.length})` : ''}
              </button>
            </nav>
          </div>

          {activeTab === 'cars' ? (
            <>
              {carListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {carListings.map((listing) => (
                    <Link 
                      key={listing.id} 
                      href={`/cars/${listing.id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="relative h-48">
                        {listing.car_images && listing.car_images.length > 0 ? (
                          <Image
                            src={listing.car_images[0].image_url}
                            alt={`${listing.brand?.name} ${listing.model?.name}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <CarIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {listing.year}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {listing.brand?.name} {listing.model?.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {listing.mileage?.toLocaleString()} km • {listing.fuel_type}
                        </p>
                        <p className="mt-2 text-lg font-bold text-blue-600 dark:text-blue-400">
                          ${listing.price?.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                  <CarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {t('profile.noCarListings')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('profile.noCarListingsDescription')}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {loadingSpareParts ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : sparePartListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sparePartListings.map((item) => {
                    const mainImage = item.images?.find(img => img.is_main)?.url || 
                                    (item.images && item.images.length > 0 ? item.images[0].url : null);
                    
                    return (
                      <Link 
                        key={item.id} 
                        href={`/spare-parts/${item.id}`}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300"
                      >
                        <div className="relative h-48">
                          {mainImage ? (
                            <Image
                              src={mainImage}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <TruckIcon className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {item.brand} • {item.condition}
                          </p>
                          <p className="mt-2 text-lg font-bold text-blue-600 dark:text-blue-400">
                            ${item.price?.toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                  <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {t('profile.noSparePartsListings')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('profile.noSparePartsListingsDescription')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
