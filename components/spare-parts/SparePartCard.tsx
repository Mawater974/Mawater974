'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Heart, MapPin, Star, Clock, Calendar, Check, Shield } from 'lucide-react';

import { SparePart as SparePartType } from '@/types/spare-parts';

type SparePart = Omit<SparePartType, 'images' | 'id' | 'user'> & {
  id: string | number;
  brand: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  model: {
    id: number;
    name: string;
    name_ar: string | null;
  } | null;
  category: {
    id: number;
    name_en: string;
    name_ar: string;
  } | null;
  city: {
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
  images: Array<{
    url: string;
    is_primary?: boolean; 
  }>;
  is_favorite?: boolean;
};

interface SparePartCardProps {
  part: SparePart;
  countryCode: string;
  onToggleFavorite?: (id: string | number, e?: React.MouseEvent) => void;
  isFavorite?: boolean;
  featured?: boolean;
}

const SparePartCard: React.FC<SparePartCardProps> = ({
  part,
  countryCode,
  onToggleFavorite,
  isFavorite = false,
  featured = false,
}) => {
  const { user } = useAuth();
  const { formatPrice: defaultFormatPrice, currentCountry } = useCountry();
  
  // Format price using the spare part's country currency if available
  const formatPrice = (price: number, lang?: string) => {
    if (!part.country?.currency_code) {
      return defaultFormatPrice(price, lang);
    }
    
    // Create a temporary country object with the spare part's currency
    const tempCountry = {
      ...(currentCountry || {}),
      currency_code: part.country.currency_code
    };
    
    // Format the number according to the language
    const formattedNumber = price.toLocaleString(
      lang === 'ar' ? 'ar' : 'en'
    );
    
    // Get translated currency code
    const currencyKey = `currency.${tempCountry.currency_code.toLowerCase()}`;
    const translatedCurrency = t(currencyKey);
    
    // For Arabic, place the currency code after the number
    if (lang === 'ar') {
      return `${formattedNumber} ${translatedCurrency}`;
    }
    
    // For English, place the currency code before the number
    return `${translatedCurrency} ${formattedNumber}`;
  };
  const router = useRouter();
  const { t, language, currentLanguage } = useLanguage();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isFavorited, setIsFavorited] = React.useState(isFavorite);

  const handleFavoriteClick = async (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    if (!user) {
      toast.error(t('car.favorite.login'));
      router.push('/login');
      return;
    }

    setIsLoading(true);
    const newFavoriteState = !isFavorited;
    
    try {
      if (onToggleFavorite) {
        // Pass both partId and event to the onToggleFavorite callback
        onToggleFavorite(part.id as string, e as React.MouseEvent);
      } else {
        const { error } = await supabase.rpc('toggle_favorite', {
          p_item_id: part.id.toString(),
          p_item_type: 'spare_part',
          p_user_id: user.id,
          p_action: newFavoriteState ? 'add' : 'remove'
        });

        if (error) throw error;
      }

      setIsFavorited(newFavoriteState);
      toast.success(
        newFavoriteState 
          ? t('favorites.added', { item: part.title })
          : t('favorites.removed', { item: part.title })
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative group bg-white dark:bg-gray-900/95 rounded-xl overflow-hidden border 
      ${featured 
        ? 'border-qatar-maroon shadow-lg shadow-qatar-maroon/20' 
        : 'border-gray-200 dark:border-gray-700'} 
      hover:border-qatar-maroon/100 transition-all duration-200 transform hover:scale-[1.01]`}>
      
      <Link 
        href={`/${part.country?.code?.toLowerCase() || currentCountry?.code.toLowerCase()}/spare-parts/${part.id}`}
        className="block w-full h-full"
      >
        <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800">
          {part.images && part.images.length > 0 ? (
            <div className="relative w-full h-full">
              <LazyImage 
                src={part.images.find(img => img.is_primary)?.url || part.images[0]?.url} 
                alt={part.title} 
                fallback="/placeholder-spare-part.jpg"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center p-4">
                <Image 
                  src="/placeholder-spare-part.jpg" 
                  alt={part.title} 
                  width={200}
                  height={150}
                  className="mx-auto opacity-50"
                />
                <span className="text-gray-400 dark:text-gray-500 text-sm mt-2 block">
                  {t('common.noImage')}
                </span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white h-[140px] flex flex-col justify-between">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {part.title}
              </h3>
              
              {/* Favorite Button */}
              <div className="absolute bottom-3 right-3 z-10">
                <button
                  onClick={handleFavoriteClick}
                  className={`p-1.5 rounded-lg transition-all duration-200 border
                    ${isFavorited
                      ? 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon hover:bg-qatar-maroon hover:text-white'
                      : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 text-gray-400 hover:border-qatar-maroon hover:text-qatar-maroon'
                    }
                    transform active:scale-95 hover:scale-105 shadow-sm`}
                  aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  disabled={isLoading}
                >
                  {isFavorited ? (
                    <HeartSolid className="h-4 w-4" />
                  ) : (
                    <HeartOutline className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              {part.brand && (
                <span>{language === 'ar' && part.brand.name_ar ? part.brand.name_ar : part.brand.name}</span>
              )}
              {part.model && (
                <>
                  <span>•</span>
                  <span>{language === 'ar' && part.model.name_ar ? part.model.name_ar : part.model.name}</span>
                </>
              )}
            </div>

            <div>
              <span className="text-2xl font-semibold text-qatar-maroon">
                {formatPrice(part.price, language)}
              </span>
            </div>

            {(part.city || part.country) && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 truncate">
                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                {part.country && currentCountry && part.country.id !== currentCountry.id && part.country.name && (
                  <span className="font-medium text-gray-500 dark:text-gray-400 mr-1">
                    {currentLanguage === 'ar' && part.country.name_ar ? part.country.name_ar : part.country.name} •
                  </span>
                )}
                <span className="truncate">
                  {part.city ? (language === 'ar' ? part.city.name_ar : part.city.name) : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {part.is_featured && (
        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-qatar-maroon text-white text-xs font-medium rounded-full">
          {t('common.featured')}
        </div>
      )}
      {/* {part.user_id && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-blue-500/90 text-white text-xs font-medium rounded-full">
          {t('car.dealer.badge') || 'Dealer'}
        </div>
      )} */}

      {/* <button
        onClick={handleFavoriteClick}
        className={`absolute top-3 ${language === 'ar' ? 'left-auto right-3' : 'right-auto left-3'} z-20 p-1.5 rounded-lg transition-all duration-200 border
          ${isFavorited
            ? 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon hover:bg-qatar-maroon hover:text-white'
            : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-600 text-gray-400 hover:border-qatar-maroon hover:text-qatar-maroon'
          }
          transform active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label={isFavorited ? t('spareParts.favorite.remove') || 'Remove from favorites' : t('spareParts.favorite.add') || 'Add to favorites'}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></div>
        ) : isFavorited ? (
          <HeartSolid className="h-4 w-4" />
        ) : (
          <HeartOutline className="h-4 w-4" />
        )}
      </button> */}
    </div>
  );
};

// LazyImage component that only loads the image when it's in the viewport
const LazyImage = ({ 
  src, 
  alt, 
  fallback, 
  className = '',
  width = 400,
  height = 225
}: {
  src?: string;
  alt: string;
  fallback: string;
  className?: string;
  width?: number;
  height?: number;
}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Start loading when within 200px of viewport
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  return (
    <div ref={imgRef} className={`w-full h-full ${className}`}>
      {isInView && !hasError && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <Image
          src={fallback}
          alt={alt}
          fill
          className="object-cover"
          loading="eager"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )}
    </div>
  );
};

export default SparePartCard;
