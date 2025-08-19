'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import Image from 'next/image';
import { MapPinIcon, EnvelopeIcon, CalendarIcon, TruckIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

// Dynamically import the card components with no SSR to avoid hydration issues
const CarCard = dynamic(() => import('@/components/CarCard'), { ssr: false });
const SparePartCard = dynamic(() => import('@/components/spare-parts/SparePartCard'), { ssr: false });

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  countries?: {
    name: string;
  };
};

type CarListing = Database['public']['Tables']['cars']['Row'] & {
  brand: { 
    id: number;
    name: string;
    name_ar?: string | null;
  };
  model: { 
    id: number;
    name: string;
    name_ar?: string | null;
  };
  city: {
    id: number;
    name: string;
    name_ar?: string | null;
  };
  country: {
    id: number;
    name: string;
    name_ar?: string | null;
    code: string;
    currency_code: string;
  };
  images: Array<{ 
    url: string; 
    is_main?: boolean;
  }>;
  is_featured?: boolean;
  created_at: string;
  updated_at: string;
};

type SparePartListing = Database['public']['Tables']['spare_parts']['Row'] & {
  images: Array<{ url: string; is_main?: boolean }>;
  brand?: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  model?: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  category?: {
    id: number;
    name_en: string;
    name_ar: string;
  } | null;
  city?: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  country?: {
    id: number;
    name: string;
    name_ar: string | null;
    code: string;
    currency_code: string;
  } | null;
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
  const { user } = useAuth();
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
        const fetchCarListings = async () => {
          try {
            const { data: carListingsData, error: carListingsError } = await supabase
              .from('cars')
              .select(`
                *, 
                brand:brands(*), 
                model:models(*), 
                city:cities(*), 
                country:countries(*), 
                images:car_images!car_id(url, is_main)
              `)
              .eq('user_id', id)
              .eq('status', 'approved')
              .order('created_at', { ascending: false });

            if (carListingsError) throw carListingsError;

            // Process the data to ensure images is always an array and handle null relationships
            const processedCars = (carListingsData || []).map(car => ({
              ...car,
              images: Array.isArray(car.images) ? car.images : [],
              brand: car.brand || { name: 'Unknown Brand' },
              model: car.model || { name: 'Unknown Model' },
              city: car.city || { name: 'Unknown City' },
              country: car.country || { name: 'Unknown Country' },
            }));

            setCarListings(processedCars);
          } catch (error) {
            console.error('Error fetching car listings:', error);
          }
        };

        if (id) {
          fetchCarListings();
        }
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
            .select(`
              *,
              brand:brands(*),
              model:models(*),
              category:spare_part_categories(*),
              city:cities(*),
              country:countries(*),
              images:spare_part_images!spare_part_id(url, is_primary)
            `)
            .eq('user_id', id)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Process the data to ensure consistent structure and handle null relationships
          const processedParts = (data || []).map(part => ({
            ...part,
            images: Array.isArray(part.images) ? part.images : [],
            brand: part.brand || { name: 'Unknown Brand', name_ar: null },
            model: part.model || { name: 'Unknown Model', name_ar: null },
            category: part.category || { name_en: 'Uncategorized', name_ar: 'غير مصنف' },
            city: part.city || { name: 'Unknown City', name_ar: null },
            country: part.country || { 
              name: 'Unknown Country', 
              name_ar: null,
              code: 'qa',
              currency_code: 'QAR'
            },
          }));

          setSparePartListings(processedParts);
        } catch (error) {
          console.error('Error fetching spare parts:', error);
        } finally {
          setLoadingSpareParts(false);
        }
      }
    };

    fetchSpareParts();
  }, [id, supabase, activeTab]);

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
                  {profile.countries && (
                    <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
                      <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="text-sm">
                        {profile.countries.name}
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
                    <a
                      href={`mailto:${profile.email}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      {t('profile.contact')}
                    </a>
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
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('cars')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'cars'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t('profile.cars')} ({carListings.length})
              </button>
              <button
                onClick={() => setActiveTab('spareParts')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'spareParts'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t('profile.spareParts')} ({sparePartListings.length})
              </button>
            </div>
          </div>

          {activeTab === 'cars' ? (
            <div className="space-y-6">
              {carListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {carListings
                    .sort((a, b) => {
                      // Sort featured cars first, then by creation date
                      if (a.is_featured && !b.is_featured) return -1;
                      if (!a.is_featured && b.is_featured) return 1;
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    })
                    .map((car) => (
                      <div key={car.id} className="h-full">
                        <CarCard 
                          car={{
                            ...car,
                            brand: car.brand,
                            model: car.model,
                            images: car.images,
                            city: car.city,
                            country: car.country,
                          }}
                          featured={car.is_featured}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                    {t('profile.noCars')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('profile.noCarsDescription')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {loadingSpareParts ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : sparePartListings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sparePartListings
                    .sort((a, b) => {
                      // Sort featured parts first, then by creation date
                      if (a.is_featured && !b.is_featured) return -1;
                      if (!a.is_featured && b.is_featured) return 1;
                      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    })
                    .map((part) => (
                      <div key={part.id} className="h-full">
                        <SparePartCard
                          part={part}
                          countryCode={part.country?.code || 'qa'}
                          featured={part.is_featured}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TruckIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                    {t('profile.noSpareParts')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                    {t('profile.noSparePartsDescription')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
