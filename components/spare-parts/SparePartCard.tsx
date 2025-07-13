'use client';

import React from 'react';
import Link from 'next/link';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import ImageCarousel from '../ImageCarousel';

type SparePart = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  part_type: 'original' | 'aftermarket';
  status: string;
  created_at: string;
  is_featured?: boolean;
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
    id: string;
    url: string;
    is_primary: boolean;
  }>;
  is_favorite?: boolean;
  user?: {
    id: string;
    full_name: string | null;
    role?: string;
  } | null;
};

interface SparePartCardProps {
  part: SparePart;
  countryCode: string;
  onToggleFavorite?: ((...args: any[]) => void) | ((e: React.MouseEvent) => void);
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
  const { formatPrice, currentCountry } = useCountry();
  const router = useRouter();
  const { t, language, currentLanguage } = useLanguage();

  const [isLoading, setIsLoading] = React.useState(false);
  
  // Use the prop value if provided, otherwise fall back to part.is_favorite
  const isFavorited = typeof isFavorite !== 'undefined' ? isFavorite : part.is_favorite || false;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error(t('car.favorite.login'));
      router.push('/login');
      return;
    }

    setIsLoading(true);
    const newFavoriteState = !isFavorited;
    
    try {
      if (onToggleFavorite) {
        // Try different calling patterns based on the expected parameters
        try {
          // First try with the event object as the first parameter (matching the spare parts page)
          await (onToggleFavorite as (id: string, e: React.MouseEvent) => void)(part.id, e);
        } catch (err) {
          // If that fails, try with the event object only (matching the favorites page)
          try {
            await (onToggleFavorite as (e: React.MouseEvent) => void)(e);
          } catch (err2) {
            // If that also fails, try with just the ID (fallback)
            await (onToggleFavorite as (id: string) => void)(part.id);
          }
        }
      } else {
        // Fallback: Direct API call if no parent handler
        const { error } = await supabase
          .from('favorites')
          .upsert(
            { 
              user_id: user.id, 
              spare_part_id: part.id,
              created_at: new Date().toISOString()
            },
            { onConflict: 'user_id,spare_part_id' }
          )
          .select();
          
        if (error) throw error;
      }
      
      // The parent component is responsible for updating the favorite state
      toast.success(
        newFavoriteState 
          ? t('spareParts.favorite.added') || 'Added to favorites'
          : t('spareParts.favorite.removed') || 'Removed from favorites'
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error(t('common.errorOccurred') || 'An error occurred');
      // The parent component is responsible for handling errors
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/${part.country?.code?.toLowerCase() || countryCode}/spare-parts/${part.id}`}>
      <div 
        className={`relative group bg-white dark:bg-gray-900/95 rounded-xl overflow-hidden border 
          ${featured 
            ? 'border-qatar-maroon shadow-lg shadow-qatar-maroon/20' 
            : 'border-gray-200 dark:border-gray-700'} 
          hover:border-qatar-maroon/100 transition-all duration-200 transform hover:scale-[1.01]`}
      >
        {part.is_featured && (
          <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-qatar-maroon text-white text-xs font-medium rounded-full">
            {t('common.featured')}
          </div>
        )}
        {part.user?.role === 'dealer' && (
          <div className="absolute top-2 right-2 z-20 px-2 py-1 bg-blue-500/90 text-white text-xs font-medium rounded-full">
            {t('car.dealer.badge') || 'Dealer'}
          </div>
        )}
        
        <div className="relative aspect-[16/9]">
          {part.images && part.images.length > 0 ? (
            <ImageCarousel
              images={part.images}
              alt={part.title}
              fallbackImage="/placeholder-spare-part.jpg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <span className="text-gray-400 dark:text-gray-500">
                {t('common.noImage')}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white h-[180px] flex flex-col justify-between">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2 truncate">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {part.title}
                </h3>
              </div>
              
              {/* Favorite Button */}
              <button
                onClick={handleFavoriteClick}
                className={`absolute bottom-3 ${language === 'ar' ? 'left-3' : 'right-3'} p-1.5 rounded-lg transition-all duration-200 border
                  ${isFavorited
                    ? 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon hover:bg-qatar-maroon hover:text-white'
                    : 'bg-transparent border-gray-200 dark:border-gray-600 text-gray-400 hover:border-qatar-maroon hover:text-qatar-maroon'
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
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
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
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <span className="text-2xl font-semibold text-qatar-maroon">
                {formatPrice(part.price, part.currency || part.country?.currency_code)}
              </span>
            </div>

            {part.category && part.category.name_en && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar' ? part.category.name_ar : part.category.name_en}
                {part.part_type && (
                  <span className="ml-2">
                • {part.part_type === 'original' ? t('spareParts.partType.original') : t('spareParts.partType.aftermarket')}
                  </span>
                )}
              </div>
            )}

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
      </div>
    </Link>
  );
};

export default SparePartCard;
