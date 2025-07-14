'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Phone, Mail, MessageCircle, AlertCircle, Share2, Flag, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useCountry } from '@/contexts/CountryContext';
import { useAuth } from '@/contexts/AuthContext';
// Using native button instead of shadcn/ui Button
const Button = ({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    className={`px-4 py-2 rounded-md font-medium transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Simple Badge component
const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default' | 'secondary' | 'destructive' | 'outline', className?: string }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    variant === 'default' ? 'bg-blue-100 text-blue-800' :
    variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
    variant === 'destructive' ? 'bg-red-100 text-red-800' :
    'border border-gray-300 bg-white text-gray-800'
  } ${className}`}>
    {children}
  </span>
);
import { useLanguage } from '@/contexts/LanguageContext';

// Simple toast function since we can't import useToast
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  console[type](message);
};

// Define types for our database responses
interface Brand {
  name: string;
  name_ar: string;
}

interface Model {
  name: string;
  name_ar: string;
}

interface Category {
  name_en: string;
  name_ar: string;
}

interface City {
  name: string;
  name_ar: string;
}

interface UserProfile {
  name: string;
  phone_number: string;
  email: string;
}

interface SparePartImage {
  id: string;
  url: string;
  is_primary: boolean;
  created_at: string;
  spare_part_id: string;
  updated_at?: string;
  order?: number;
}

// Helper type to handle potentially string or object types
type WithName = { name: string; name_en?: string; name_ar?: string } | string | null;

// Helper functions to safely get names from WithName type
const getName = (item: WithName | null | undefined): string => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.name || '';
};

const getNameEn = (item: WithName | null | undefined): string => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.name_en || item.name || '';
};

const getNameAr = (item: WithName | null | undefined): string => {
  if (!item) return '';
  return typeof item === 'string' ? item : item.name_ar || item.name || '';
};

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  avatar_url: string | null;
  created_at: string;
  role?: string;
  company_name?: string | null;
  company_description?: string | null;
  website?: string | null;
  phone_verified?: boolean;
}

interface SparePart {
  id: string;
  title: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  currency: string;
  part_type: string;
  is_negotiable: boolean;
  condition: 'new' | 'used' | 'refurbished';
  status: 'approved' | 'sold' | 'pending' | 'expired' | 'hidden';
  created_at: string;
  updated_at: string;
  
  // Relations
  brand_id: string | null;
  model_id: string | null;
  category_id: string | null;
  city_id: string | null;
  user_id: string;
  country_id: string;
  
  // Joined data - can be objects or strings
  brand?: WithName;
  model?: WithName;
  category?: WithName & { name_en?: string };
  city?: City | null;
  user?: UserProfile;
  
  images?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    created_at: string;
  }>;
  
  country?: {
    id: string;
    name: string;
    code: string;
    flag: string;
    currency_code?: string;
  };
  
  featured?: boolean;
  is_featured?: boolean;
  
  // Make all fields optional to handle partial data from API
  [key: string]: any;
}

export default function SparePartDetails() {
  const params = useParams();
  const router = useRouter();
  const { currentLanguage, t } = useLanguage();
  const { currentCountry } = useCountry();
  const { user } = useAuth();

  // State declarations
  const [sparePart, setSparePart] = useState<SparePart | null>(null);
  const [currentImageIndex, setCurrentImage] = useState(0);
  const [fullImageIndex, setFullImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReported, setIsReported] = useState(false);
  
  // Simulate useLanguage hook
  useEffect(() => {
    // You can replace this with actual language detection logic
    const lang = localStorage.getItem('language') || 'en';
    // setCurrentLanguage(lang);
  }, []);

  // Image gallery functions
  const openFullImage = useCallback((index: number) => {
    if (!sparePart?.images?.length) return;
    setCurrentImage(index);
    setFullImageIndex(index);
    setShowFullImage(true);
    document.body.style.overflow = 'hidden';
  }, [sparePart?.images]);

  const closeFullImage = useCallback(() => {
    setShowFullImage(false);
    document.body.style.overflow = 'unset';
  }, []);

  const handlePrevImage = useCallback(() => {
    if (!sparePart?.images?.length) return;
    setCurrentImage(prevIndex => {
      const newIndex = prevIndex === 0 ? sparePart.images!.length - 1 : prevIndex - 1;
      setFullImageIndex(newIndex);
      return newIndex;
    });
  }, [sparePart?.images]);

  const handleNextImage = useCallback(() => {
    if (!sparePart?.images?.length) return;
    setCurrentImage(prevIndex => {
      const newIndex = prevIndex === sparePart.images!.length - 1 ? 0 : prevIndex + 1;
      setFullImageIndex(newIndex);
      return newIndex;
    });
  }, [sparePart?.images]);

  useEffect(() => {
    if (user && sparePart) {
      const isOwner = user.id === sparePart.user_id;
    }
  }, [user, sparePart]);

  // Handle keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showFullImage) return;
      
      switch (e.key) {
        case 'Escape':
          closeFullImage();
          break;
        case 'ArrowLeft':
          handlePrevImage();
          break;
        case 'ArrowRight':
          handleNextImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullImage, handlePrevImage, handleNextImage, closeFullImage]);

  const supabase = createClient();

  useEffect(() => {
    const fetchSparePart = async () => {
      try {
        setLoading(true);
        const id = params.id as string;

        // First, get the spare part basic info
        const { data: sparePartData, error: sparePartError } = await supabase
          .from('spare_parts')
          .select('*')
          .eq('id', id)
          .single<{
            id: string;
            title: string;
            name_ar?: string;
            description: string;
            description_ar?: string;
            price: number;
            currency: string;
            part_type: string;
            is_negotiable: boolean;
            condition: 'new' | 'used' | 'refurbished';
            status: 'approved' | 'sold' | 'pending' | 'expired' | 'hidden';
            created_at: string;
            updated_at: string;
            brand_id: string | null;
            model_id: string | null;
            category_id: string | null;
            city_id: string | null;
            user_id: string;
            country_id: string;
            [key: string]: any; // For any additional properties
          }>();

        if (sparePartError) throw sparePartError;
        if (!sparePartData) throw new Error('Spare part not found');

        // Get related data with proper error handling
        const queries = [
          // Fetch brand with error handling
          (async () => {
            try {
              const { data, error } = sparePartData.brand_id
                ? await supabase
                    .from('brands')
                    .select('*')
                    .eq('id', sparePartData.brand_id)
                    .single()
                : { data: null, error: null };
              
              if (error) {
                console.error('Error fetching brand:', error);
                return { data: { id: sparePartData.brand_id, name: 'Unknown Brand' } };
              }
              return { data };
            } catch (err) {
              console.error('Exception fetching brand:', err);
              return { data: { id: sparePartData.brand_id, name: 'Unknown Brand' } };
            }
          })(),
          
          // Fetch model with error handling
          (async () => {
            try {
              const { data, error } = sparePartData.model_id
                ? await supabase
                    .from('models')
                    .select('*')
                    .eq('id', sparePartData.model_id)
                    .single()
                : { data: null, error: null };
              
              if (error) {
                console.error('Error fetching model:', error);
                return { data: sparePartData.model_id ? { id: sparePartData.model_id, name: 'Unknown Model' } : null };
              }
              return { data };
            } catch (err) {
              console.error('Exception fetching model:', err);
              return { data: sparePartData.model_id ? { id: sparePartData.model_id, name: 'Unknown Model' } : null };
            }
          })(),
          
          // Fetch category with error handling and fallback
          (async () => {
            if (!sparePartData.category_id) return { data: null };
            
            try {
              // First try with the correct table name
              const { data, error } = await supabase
                .from('spare_part_categories')  // Updated table name
                .select('*')
                .eq('id', sparePartData.category_id)
                .single();
              
              if (!error && data) return { data };
              
              // If not found, try with the old table name as fallback
              console.log('Category not found in spare_part_categories, trying categories table...');
              const fallback = await supabase
                .from('categories')
                .select('*')
                .eq('id', sparePartData.category_id)
                .single();
              
              if (!fallback.error && fallback.data) return fallback;
              
              console.error('Error fetching category:', error || fallback.error);
              return { 
                data: { 
                  id: sparePartData.category_id, 
                  name: 'Uncategorized', 
                  name_en: 'Uncategorized',
                  name_ar: 'غير مصنف'
                } 
              };
              
            } catch (err) {
              console.error('Exception fetching category:', err);
              return { 
                data: { 
                  id: sparePartData.category_id, 
                  name: 'Uncategorized', 
                  name_en: 'Uncategorized',
                  name_ar: 'غير مصنف'
                } 
              };
            }
          })(),
          

          sparePartData.city_id
            ? supabase
                .from('cities')
                .select('id, name, name_ar')
                .eq('id', sparePartData.city_id)
                .single<City>()
            : Promise.resolve({ data: null }),
          
          // Get user data with profile information
          supabase
            .from('users')
            .select(`
              id,
              full_name,
              email,
              created_at,
              profiles (
                phone_number,
                avatar_url,
                phone_verified,
                role,
                company_name,
                company_description,
                website
              )
            `)
            .eq('id', sparePartData.user_id)
            .single<{
              id: string;
              full_name: string;
              email: string;
              created_at: string;
              profiles: {
                phone_number: string;
                avatar_url: string | null;
                phone_verified: boolean;
                role: string;
                company_name: string | null;
                company_description: string | null;
                website: string | null;
              } | null;
            }>(),
          
          supabase
            .from('spare_part_images')
            .select('*')
            .eq('spare_part_id', id)
            .returns<Array<{
              id: string;
              url: string;
              is_primary: boolean;
              created_at: string;
            }>>()
        ];

        const [
          { data: brandData },
          { data: modelData },
          { data: categoryData },
          { data: cityData },
          { data: userData },
          { data: imagesData }
        ] = await Promise.all(queries);

        const profileData = userData?.profiles;

        // Debug log the fetched data
        console.log('Fetched data:', {
          sparePartData,
          brandData,
          modelData,
          categoryData,
          cityData,
          userData,
          profileData,
          imagesData
        });

        // Combine all the data into a single object
        const completeSparePart: SparePart = {
          ...sparePartData,
          brand: brandData as WithName,
          model: modelData as WithName,
          category: categoryData as WithName & { name_en?: string },
          city: cityData as City | null,
          user: userData ? {
            id: userData.id,
            full_name: userData.full_name || '',
            email: userData.email || '',
            phone_number: profileData?.phone_number || '',
            avatar_url: profileData?.avatar_url || null,
            created_at: userData.created_at || new Date().toISOString(),
            role: profileData?.role || 'user',
            company_name: profileData?.company_name || null,
            company_description: profileData?.company_description || null,
            website: profileData?.website || null,
            phone_verified: profileData?.phone_verified || false
          } : undefined,
          images: imagesData || [],
          country_id: sparePartData.country_id,
          featured: sparePartData.featured,
          is_featured: sparePartData.is_featured,
        };
        
        console.log('Complete spare part:', completeSparePart);

        setSparePart(completeSparePart);

        // Get current image safely
        const currentImage = sparePart?.images?.[currentImageIndex] || null;
        
        // Get thumbnail images (all images except the current one)
        const thumbnailImages = sparePart?.images?.filter((_, index) => index !== currentImageIndex) || [];

        // Set primary image or first image as current
        const images = imagesData || [];
        const primaryIndex = images.findIndex((img: any) => img.is_primary);
        setCurrentImage(primaryIndex >= 0 ? primaryIndex : 0);
      } catch (error) {
        console.error(t('spareParts.errorFetchingSparePart'), error);
        setError(t('spareParts.failedToLoadSparePartDetails'));
        showToast(t('spareParts.failedToLoadSparePartDetails'), 'error');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSparePart();
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSendMessage = () => {
    showToast(
      currentLanguage === 'ar' 
        ? t('spareParts.messageSentSuccessfully') 
        : t('spareParts.messageSentSuccessfully'), 
      'success'
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button 
          onClick={() => router.back()} 
          className="mb-6 inline-flex items-center text-blue-600 hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('spareParts.backToListings')}
        </button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="h-[400px] w-full bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-20 bg-gray-200 rounded-md animate-pulse"></div>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 w-3/4 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 w-1/2 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 w-full rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 w-5/6 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 w-4/5 rounded animate-pulse"></div>
            <div className="pt-4">
              <div className="h-12 bg-blue-200 w-48 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sparePart) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Spare Part Not Found</h2>
        <button 
          onClick={() => router.push('/spare-parts')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          {t('spareParts.backToListings')}
        </button>
      </div>
    );
  }

  const currentFullImage = sparePart.images?.[fullImageIndex] || null;

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.back()} 
        className="mb-6 inline-flex items-center text-maroon-600 hover:underline"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> {t('spareParts.backToListings')}
      </button>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image Section */}
          <div className="relative w-full h-44 md:h-96 lg:h-96 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mb-4">
            {sparePart?.images && sparePart.images.length > 0 ? (
              <>
                <img
                  src={sparePart.images[currentImageIndex]?.url}
                  alt={sparePart.title}
                  className={`w-full h-full object-contain cursor-zoom-in ${sparePart.status !== 'approved' ? 'opacity-70' : ''}`}
                  onClick={() => openFullImage(currentImageIndex)}
                />
                {sparePart.status && sparePart.status !== 'approved' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`text-4xl font-bold transform rotate-[-15deg] px-6 py-3 rounded-lg ${
                      sparePart.status === 'sold' ? 'bg-green-600/90 text-white' :
                      sparePart.status === 'expired' ? 'bg-amber-600/90 text-white' :
                      sparePart.status === 'hidden' ? 'bg-gray-800/90 text-white' :
                      'text-qatar-maroon bg-white/80 dark:bg-black/70'
                    }`}>
                      {sparePart.status.toUpperCase()}
                    </div>
                  </div>
                )}
                {(sparePart.featured || sparePart.is_featured) && (
                  <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-qatar-maroon/90 text-white text-xs font-medium rounded-lg shadow-lg">
                    Featured
                  </div>
                )}
                {sparePart.images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {sparePart.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCurrentImage(index);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          index === currentImageIndex 
                            ? 'w-4 bg-qatar-maroon' 
                            : 'w-1.5 bg-white/60 hover:bg-white'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
                {sparePart.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No Image Available
              </div>
            )}
          </div>
          
          {/* Thumbnail Grid */}
          {sparePart?.images && sparePart.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[...sparePart.images]
                .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)) // Sort to put main photo first
                .map((image, index) => {
                  const originalIndex = sparePart.images?.findIndex(img => img.id === image.id) || 0;
                  return (
                    <div key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt={`${sparePart.title} - ${index + 1}`}
                        className={`w-full aspect-[4/3] object-cover rounded-lg cursor-pointer ${
                          currentImageIndex === originalIndex ? 'ring-2 ring-qatar-maroon' : ''
                        }`}
                        onClick={() => {
                          setCurrentImage(originalIndex);
                          setFullImageIndex(originalIndex);
                        }}
                      />
                      {image.is_primary && (
                        <div className="absolute top-1 right-1 bg-qatar-maroon text-white text-xs px-1 rounded text-center">

                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
          
          {/* Full Screen Image Viewer */}
          {showFullImage && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Close Button */}
                <button
                  onClick={closeFullImage}
                  className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {/* Navigation Buttons */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronLeftIcon className="h-8 w-8" />
                </button>
                
                <div 
                  className="relative w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={handleNextImage}
                >
                  <img
                    src={sparePart.images[fullImageIndex]?.url}
                    alt={`${sparePart.title} - Full View`}
                    className={`max-h-[90vh] max-w-[90vw] object-contain ${sparePart.status !== 'approved' ? 'opacity-70' : ''}`}
                  />
                  {sparePart.status && sparePart.status !== 'approved' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`text-5xl font-bold transform rotate-[-15deg] px-8 py-4 rounded-lg ${
                        sparePart.status === 'sold' ? 'bg-green-600/90 text-white' :
                        sparePart.status === 'expired' ? 'bg-amber-600/90 text-white' :
                        sparePart.status === 'hidden' ? 'bg-gray-800/90 text-white' :
                        'text-qatar-maroon bg-white/80 dark:bg-black/70'
                      }`}>
                        {sparePart.status.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronRightIcon className="h-8 w-8" />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {fullImageIndex + 1} / {sparePart?.images?.length}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Details */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center w-full mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {currentLanguage === 'ar' && sparePart.name_ar ? sparePart.name_ar : sparePart.title}
            </h1>
            <div className="text-2xl md:text-3xl font-bold text-primary">
              {sparePart.price.toLocaleString()} {t(`${sparePart.currency}`)}
              {sparePart.is_negotiable && (
                <div className="text-sm text-muted-foreground text-right">{t('spareParts.isNegotiable')}</div>
              )}
            </div>
          </div>
          <div>
            
            <div>
              {/* Part Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                
                
                {/* Category Box */}
                {sparePart.category && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('spareParts.details.category')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentLanguage === 'ar' 
                        ? getNameAr(sparePart.category as WithName)
                        : (sparePart.category as any)?.name_en || getName(sparePart.category as WithName)}
                    </div>
                  </div>
                )}
                
                {/* Part Type Box */}
                {sparePart.part_type && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('spareParts.details.partType')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t(`spareParts.partType.${sparePart.part_type}`)}
                    </div>
                  </div>
                )}

                {/* Condition Box */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('spareParts.details.condition')}
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t(`spareParts.condition.${sparePart.condition}`)}
                    </span>
                  </div>
                </div>
                
                
                
                {/* city Box */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('spareParts.details.city')}
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {sparePart.city?.name}
                    </span>
                  </div>
                </div>
                {/* Brand Box */}
                {sparePart.brand && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('spareParts.details.brand')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentLanguage === 'ar' 
                        ? getNameAr(sparePart.brand as WithName)
                        : getName(sparePart.brand as WithName)}
                    </div>
                  </div>
                )}
                
                {/* Model Box */}
                {sparePart.model && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('spareParts.details.model')}
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentLanguage === 'ar' 
                        ? getNameAr(sparePart.model as WithName)
                        : getName(sparePart.model as WithName)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 my-6"></div>
          
          <div className="mb-6">
            <div className="prose max-w-none mt-4">
              <p 
                dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                className={`text-gray-700 dark:text-gray-300 ${currentLanguage === 'ar' ? 'text-right' : 'text-left'}`}>
                {currentLanguage === 'ar' && sparePart.description_ar 
                  ? sparePart.description_ar 
                  : sparePart.description}
              </p>
            </div>
          </div>
          
         
          {/* Owner Info */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-12 h-12 bg-qatar-maroon/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="font-semibold text-gray-900 dark:text-white">{sparePart.user?.full_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {sparePart.user?.role === 'dealer' ? t('car.details.dealer') : t('car.details.privateSeller')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('car.details.listed')} {formatDate(sparePart.created_at, 'dd/MM/yyyy')}
                </p>
              </div>
              <div className="ml-auto">
                {sparePart.user?.phone_number && (
                  <a
                    href={`tel:${sparePart.user.phone_number}`}
                    className="flex items-center space-x-2 text-qatar-maroon hover:text-qatar-maroon/80"
                    dir="ltr"
                  >
                    <PhoneIcon className="h-5 w-5" />
                    <span className="font-ltr" style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{sparePart.user?.phone_number.replace(/^(\+\d{1,3})(\d+)/, '$1-$2')}</span>
                  </a>
                )}
              </div>
            </div>
          
          
          {/* Similar Items */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t('spareParts.similarSpareParts')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Similar items would be mapped here */}
              <div className="text-center py-8 text-muted-foreground">
                {t('spareParts.similarSparePartsPlaceholder')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
