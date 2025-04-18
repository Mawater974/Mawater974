'use client';

import Link from 'next/link';
import { ExtendedCar } from '@/types/supabase';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useCountry } from '../contexts/CountryContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ImageCarousel from './ImageCarousel';
import { useLanguage } from '../contexts/LanguageContext';


interface CarCardProps {
  car: ExtendedCar;
  onFavoriteToggle?: (carId: number) => void;
  isFavorite?: boolean;
  onSelect?: (car: ExtendedCar) => void;
  isSelected?: boolean;
  featured?: boolean;
}

export default function CarCard({
  car,
  onFavoriteToggle,
  isFavorite = false,
  onSelect,
  isSelected = false,
  featured = false,
}: CarCardProps) {
  const { user } = useAuth();
  const { formatPrice, currentCountry } = useCountry();
  const router = useRouter();
  const { t, language, currentLanguage } = useLanguage();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error(t('car.favorite.login'));
      router.push('/login');
      return;
    }
    if (onFavoriteToggle) {
      onFavoriteToggle(car.id);
    }
  };

  return (
    <Link href={`/${currentCountry?.code.toLowerCase()}/cars/${car.id}`}>
      <div 
        className={`relative group bg-white dark:bg-gray-900/95 rounded-xl overflow-hidden border 
          ${featured 
            ? 'border-qatar-maroon shadow-lg shadow-qatar-maroon/20' 
            : 'border-gray-200 dark:border-gray-700'} 
          hover:border-qatar-maroon/100 transition-all duration-200 transform hover:scale-[1.01] 
          ${isSelected ? 'border-qatar-maroon/100 shadow-lg shadow-qatar-maroon/50' : ''}`}
      >
        {featured && (
          <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-qatar-maroon text-white text-xs font-medium rounded-full">
            {t('car.featured.badge')}
          </div>
        )}
        {car.user?.role === 'dealer' && (
          <div className="absolute top-2 right-2 z-20 px-2 py-1 bg-blue-500/90 text-white text-xs font-medium rounded-full">
            {t('car.dealer.badge') || 'Dealer'}
          </div>
        )}
        
        <div className="relative aspect-[16/9]">
          <ImageCarousel
            images={car.images || [{ url: '/placeholder-car.jpg' }]}
            alt={`${language === 'ar' && car.brand?.name_ar ? car.brand.name_ar : car.brand?.name || 'Car'} ${language === 'ar' && car.model?.name_ar ? car.model.name_ar : car.model?.name || ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        <div className="p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white h-[180px] flex flex-col justify-between">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2 truncate">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {language === 'ar' && car.brand?.name_ar ? car.brand.name_ar : car.brand?.name}
                </h3>
                <span className="text-lg text-gray-500 dark:text-gray-400 truncate">
                  {language === 'ar' && car.model?.name_ar ? car.model.name_ar : car.model?.name}{car.exact_model ? ` - ${car.exact_model}` : ''}
                </span>
              </div>
              
              {/* Favorite Button */}
              <button
                onClick={handleFavoriteClick}
                className={`absolute bottom-3 ${language === 'ar' ? 'left-3' : 'right-3'} p-1.5 rounded-lg transition-all duration-200 border
                  ${isFavorite
                    ? 'bg-qatar-maroon/10 text-qatar-maroon border-qatar-maroon hover:bg-qatar-maroon hover:text-white'
                    : 'bg-transparent border-gray-200 dark:border-gray-600 text-gray-400 hover:border-qatar-maroon hover:text-qatar-maroon'
                  }
                  transform active:scale-95 hover:scale-105`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? (
                  <HeartSolid className="h-4 w-4" />
                ) : (
                  <HeartOutline className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>{car.year}</span>
              <span>•</span>
              <span>
                {t(`car.condition.${car.condition?.toLowerCase().replace(' ', '_')}`)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <span className="text-2xl font-semibold text-qatar-maroon">
                {car.price.toLocaleString('en-US')} {t(`common.currency.${car.country?.currency_code || 'QAR'}`)}
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2 flex-1 truncate">
                <span>{car.mileage?.toLocaleString('en-US') || '0'} {t('car.mileage.unit')}</span>
                <span>•</span>
                <span>{t(`car.fuelType.${car.fuel_type?.toLowerCase()}`) || car.fuel_type}</span>
                <span>•</span>
                <span>{t(`car.gearboxType.${car.gearbox_type?.toLowerCase()}`) || car.gearbox_type}</span>
              </div>
            </div>

            {(car.city || car.location || car.country) && (
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 truncate">
                <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                {car.country && currentCountry && car.country.id !== currentCountry.id && (
                  <span className="font-medium text-gray-500 dark:text-gray-400 mr-1">
                    {currentLanguage === 'ar' ? car.country.name_ar : car.country.name} •
                  </span>
                )}
                <span className="truncate">
                  {car.city 
                    ? (language === 'ar' ? car.city.name_ar : car.city.name)
                    : car.location}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
