'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import CarCard from '@/components/CarCard';
import toast from 'react-hot-toast';
import { ArrowRightIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useCountry } from '@/contexts/CountryContext';
import LoginPopup from '@/components/LoginPopup';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getCountryFromIP } from '@/utils/getCountryFromIP';

type BusinessType = 'dealership' | 'service center' | 'spare parts dealership' | 'showroom';
type DealershipType = 'Official' | 'Private';

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'year_asc' | 'year_desc';

interface Filters {
  sort?: SortOption;
}

interface ShowroomRegistration {
  id: number;
  business_name: string;
  business_name_ar?: string;
  business_type: BusinessType;
  dealership_type: DealershipType;
  logo_url?: string;
  description?: string;
  description_ar?: string;
  location: string;
  location_ar?: string;
  city_id: number;
  city?: { id: number; name: string; name_ar?: string };
  status: string;
  user_id: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
  brands?: Array<{ id: number; name: string; name_ar?: string }>;
  country_id: number;
  country: { id: number; name: string; name_ar?: string };
  opening_hours: string;
  opening_hours_ar?: string;
}

interface CarListingData {
  id: number;
  brand: { id: number; name: string; name_ar?: string; logo_url?: string | null };
  model: { id: number; name: string; name_ar?: string };
  year: number;
  mileage: number;
  price: number;
  fuel_type: string;
  gearbox_type: string;
  body_type: string;
  condition: string;
  images?: { url: string; is_main?: boolean }[];
  favorite: boolean;
  is_featured: boolean;
  color: string;
  country: { id: number; name: string; name_ar?: string };
  user: { full_name: string; email: string; phone_number: string; role: string };
  created_at: string;
  updated_at: string;
}

export default function ShowroomPage() {
  const { id } = useParams();
  const router = useRouter();
  const { supabase } = useSupabase();
  const { t, language } = useLanguage();
  const { user, profile } = useAuth();
  const { trackContactSeller } = useAnalytics();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showroom, setShowroom] = useState<ShowroomRegistration | null>(null);
  const [carListings, setCarListings] = useState<CarListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [filters, setFilters] = useState<{sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'year_asc' | 'year_desc'}>({ sort: 'newest' });
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<any>(null);
  const { currentCountry } = useCountry();
  
  const sortOptions = [
    { value: 'newest', label: t('car.sort.newest') },
    { value: 'oldest', label: t('car.sort.oldest') },
    { value: 'price_asc', label: t('car.sort.priceLow') },
    { value: 'price_desc', label: t('car.sort.priceHigh') },
    { value: 'year_asc', label: t('car.sort.yearOld') },
    { value: 'year_desc', label: t('car.sort.yearNew') },
  ];

  const sortCars = (cars: CarListingData[]) => {
    return [...cars].sort((a, b) => {
      switch (filters.sort) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'year_asc':
          return a.year - b.year;
        case 'year_desc':
          return b.year - a.year;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const sortedCarListings = sortCars(carListings);

  const handleSort = (value: string) => {
    setFilters(prev => ({
      ...prev,
      sort: value as Filters['sort']
    }));
    setShowSortOptions(false);
  };
  const handleFavoriteToggle = async (carId: number) => {
    if (!user) {
      toast.error(t('car.favorite.login'));
      router.push('/login');
      return;
    }

    try {
      const isFavorited = favorites.includes(carId);
      
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('car_id', carId);

        if (error) throw error;

        setFavorites(prev => prev.filter(id => id !== carId));
        toast.success(t('car.favorite.remove'), {
          icon: '💔',
          position: 'bottom-right',
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert([
            { user_id: user.id, car_id: carId }
          ]);

        if (error) throw error;

        setFavorites(prev => [...prev, carId]);
        toast.success(t('car.favorite.add'), {
          icon: '❤️',
          position: 'bottom-right',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('car.error.load'));
    }
  };

  useEffect(() => {
    const fetchShowroomData = async () => {
      try {
        setLoading(true);
        
        // Fetch showroom details from dealerships table
        const { data: showroom, error: showroomError } = await supabase
          .from('dealerships')
          .select(`
            *,
            country:country_id(*),
            city:city_id(*)
          `)
          .eq('id', id)
          .single();
  
        if (showroomError || !showroom) {
          console.error('Error fetching showroom:', showroomError);
          setLoading(false);
          return;
        }
        
        setShowroom(showroom);
  
        // Check if user is owner
        if (user && showroom) {
          setIsOwner(user.id === showroom.user_id);
        }
  
        // Fetch dealer profile information
        if (showroom?.user_id) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', showroom.user_id)
            .single();
  
          if (profileError) {
            console.error('Error fetching dealer profile:', profileError);
          } else {
            setDealerInfo(profileData);
          }
        }
  
        // Fetch car listings for this showroom
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select(`
            *,
            brand:brands(id, name, name_ar),
            model:models(id, name, name_ar),
            user:profiles(full_name, email, phone_number, role),
            images:car_images(url, is_main),
            country:countries(id, name, name_ar, code, currency_code),
            city:cities(id, name, name_ar),
            is_featured
          `)
          .eq('user_id', showroom.user_id)
          .eq('status', 'approved')
          .eq('country_id', showroom.country_id);
  
        if (carError) {
          console.error('Error fetching car listings:', carError);
        } else {
          const processedCarData: CarListingData[] = (carData || []).map((car: any) => ({
            id: car.id,
            brand: car.brand,
            model: car.model,
            year: car.year,
            mileage: car.mileage,
            price: car.price,
            fuel_type: car.fuel_type,
            gearbox_type: car.gearbox_type,
            body_type: car.body_type,
            city: car.city, // Include city data
            location: car.location, // Include location data
            country: car.country, // Include country data
            condition: car.condition,
            images: car.images || [],
            is_featured: car.is_featured || false,
            favorite: favorites.includes(car.id),
            color: car.color || '',
            user: car.user,
            created_at: car.created_at || new Date().toISOString(),
            updated_at: car.updated_at || new Date().toISOString()
          }));
          setCarListings(processedCarData);
        }
  
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchUserFavorites = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('car_id')
          .eq('user_id', user.id);
  
        if (error) throw error;
        
        setFavorites(data.map(fav => fav.car_id));
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };
  
    if (currentCountry) {
      fetchShowroomData();
      if (user) {
        fetchUserFavorites();
      }
    }
  }, [currentCountry]);

  // Track page view when component mounts
  useEffect(() => {
    if (currentCountry?.code && showroom) {
      const trackPageView = async () => {
        try {
          // Get the current URL and referrer
          const currentUrl = window.location.pathname;
          const referrer = document.referrer;
          const referrerUrl = referrer ? new URL(referrer) : null;
          
          // Only track if:
          // 1. This is a direct visit (no referrer)
          // 2. Referrer is not our root page
          // 3. Referrer is from a different site
          const shouldTrack = !referrer || 
            (referrerUrl && referrerUrl.pathname !== '/') || 
            (referrerUrl && referrerUrl.origin !== window.location.origin);
          
          if (shouldTrack) {
            // Get real location from IP
            const geoInfo = await getCountryFromIP();
            
            const response = await fetch('/api/analytics/page-view', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                countryCode: currentCountry?.code || '--',
                countryName: geoInfo?.name || '--', // Default to -- if no geo
                userId: user?.id,
                pageType: 'showroom-detail',
                entityId: showroom.id.toString(),
                page_path: currentUrl,
                is_direct_visit: !referrer,
                referrer_domain: referrerUrl ? referrerUrl.hostname : null
              })
            });

            if (!response.ok) {
              const error = await response.json();
              console.error('Failed to track page view:', error);
            }
          }
        } catch (error) {
          console.error('Failed to track page view:', error);
        }
      };

      trackPageView();
    }
  }, [currentCountry?.code, showroom, user?.id]);

  if (loading) {
    return (
      <div className="flex col-span-full items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!showroom) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center dark:bg-gray-800 dark:text-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            {t('showroom.notFound')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('showroom.notFoundDesc')}
          </p>
          <Link 
            href={`/${currentCountry?.code.toLowerCase()}/showrooms`}
            className="inline-flex items-center px-6 py-3 bg-qatar-maroon text-white rounded-lg hover:bg-qatar-maroon-dark transition-colors"
          >
            <ArrowRightIcon className="h-5 w-5 mr-2 rtl:rotate-180" />
            {t('showroom.backToShowrooms')}
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen"> 
      <div className="container mx-auto px-4 py-8 ">
        {/* Hero Section */}
        <div className="relative w-full h-64 md:h-80 lg:h-96 mb-8 rounded-lg overflow-hidden">
          {/* Dealer Dashboard Link */}
          {profile?.role === 'dealer' && isOwner && (
          <Link
            href="/dealer-dashboard"
            className="absolute top-4 right-4 z-10 bg-qatar-maroon text-white px-4 py-2 rounded-lg hover:bg-qatar-maroon/90 transition-colors flex items-center gap-2"
          >
            <span>{t('dashboard.dealerDashboard')}</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        )}
        {showroom.logo_url ? (
          <Image
            src={showroom.logo_url}
            alt={language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
            fill
            className="object-cover w-full h-full"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 dark:text-gray-400 text-xl">
              {t('showroom.logo')}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
          <h1 className="text-5xl font-bold mb-2">
            {language === 'ar' && showroom.business_name_ar ? showroom.business_name_ar : showroom.business_name}
          </h1>
        </div>
      </div>

      {/* Showroom Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Description */}
          {(showroom.description || showroom.description_ar) && (
            <div className="text-gray-700 dark:text-gray-300">
              <p className="mb-4">
                {language === 'ar' && showroom.description_ar ? showroom.description_ar : showroom.description}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <MapPinIcon className="h-5 w-5" />
            <span>{t('showroom.address')}: {language === 'ar' && showroom.location_ar ? showroom.location_ar : showroom.location}</span>
            {showroom.city && (
              <span className="text-sm text-gray-500">
                {language === 'ar' && showroom.city.name_ar ? showroom.city.name_ar : showroom.city.name},
                {' '}
                {language === 'ar' && showroom.country?.name_ar ? showroom.country.name_ar : showroom.country?.name}
              </span>
            )}
          </div>
          
          {dealerInfo?.phone_number && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <PhoneIcon className="h-5 w-5" />
              <span>{t('showroom.phone')}: </span>
              <a href={`tel:${dealerInfo.phone_number}`} className="hover:text-primary">
                <span dir="ltr" className="text-left">{dealerInfo.phone_number.replace(/^(\+\d{1,3})(\d+)/, '$1-$2')}</span>
              </a>
            </div>
          )}

          {dealerInfo?.email && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <EnvelopeIcon className="h-5 w-5" />
              <span>{t('showroom.email')}: </span>
              <a href={`mailto:${dealerInfo.email}`} className="hover:text-primary">
                {dealerInfo.email}
              </a>
            </div>
          )}

          {/* Dealership Type */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <span className="font-medium">{t('showroom.dealershipType')}: </span>
            <span>
              {t(`showroom.dealershipTypes.${showroom.dealership_type}`)}
            </span>
          </div>

          {/* Opening Hours */}
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 ">
            <span className="font-medium">{t('showroom.openingHours')}: </span>
            <p className="text-gray-700 dark:text-gray-300">
              {language === 'ar' ? showroom.opening_hours_ar || showroom.opening_hours : showroom.opening_hours}
            </p>
          </div>
        </div>
      </div>

      {showroom.business_type === 'showroom' ? (
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 ">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('showroom.availableCars')} <span className="text-sm text-gray-500">({carListings.length})</span></h3>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  {t('showroom.availableCarsDesc')}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="relative inline-block text-left">
                  <button 
                    onClick={() => setShowSortOptions(!showSortOptions)}
                    className={`flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${language === 'ar' ? 'flex-row-reverse' : ''}`}
                  >
                    <span>{sortOptions.find(opt => opt.value === filters.sort)?.label || t('car.sort.newest')}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  
                  {showSortOptions && (
                    <div 
                      className={`absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${language === 'ar' ? 'left-0' : 'right-0'}`}
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="menu-button"
                      tabIndex={-1}
                    >
                      <div className="py-1" role="none">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleSort(option.value)}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              filters.sort === option.value
                                ? 'bg-qatar-maroon text-white'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            } ${language === 'ar' ? 'text-right' : 'text-left'}`}
                            role="menuitem"
                            tabIndex={-1}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {sortedCarListings.length > 0 ? (
              sortedCarListings.map((car) => (
                <CarCard 
                  key={`car-${car.id}`}
                  car={{
                    ...car,
                    featured: car.is_featured,
                  }} 
                  isFavorite={favorites.includes(car.id as number)}
                  onFavoriteToggle={() => handleFavoriteToggle(car.id as number)}
                  featured={car.is_featured}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-300">
                {t('showroom.noCars')}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">{t('showroom.notShowroom')}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {t('showroom.notShowroomDesc')}
          </p>
        </div>
      )}
    </div>
    <LoginPopup delay={5000} />
  </div>
  );
}
