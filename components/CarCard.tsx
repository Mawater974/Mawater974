
import React, { useState } from 'react';
import { Car, Language } from '../types';
import { MapPin, Gauge, Calendar, Fuel, Heart, Check, Star, Car as CarIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toggleFavorite } from '../services/dataService';
import { useAppContext } from '../context/AppContext';
import { ImageCarousel } from './ImageCarousel';

interface CarCardProps {
  car: Car;
  language: Language;
  t: (key: string) => string;
  isFavorite?: boolean;
  onCompare?: (car: Car) => void;
  isSelectedForCompare?: boolean;
  isCompareMode?: boolean;
  actions?: React.ReactNode;
}

export const CarCard: React.FC<CarCardProps> = ({
  car,
  language,
  t,
  isFavorite = false,
  onCompare,
  isSelectedForCompare = false,
  isCompareMode = false,
  actions
}) => {
  const { user } = useAuth();
  const { currency: globalCurrency } = useAppContext();
  const [favorited, setFavorited] = useState(isFavorite);
  const { countryCode } = useParams<{ countryCode: string }>();

  const brandName = language === 'ar' ? (car.brands?.name_ar || car.brands?.name) : car.brands?.name;
  const modelName = language === 'ar' ? (car.models?.name_ar || car.models?.name) : car.models?.name;
  const cityName = language === 'ar' ? (car.cities?.name_ar || car.cities?.name) : car.cities?.name;

  const displayCurrency = car.countries?.currency_code || globalCurrency || 'QAR';

  // Prepare images for carousel (ensure main is first)
  const sortedImages = car.car_images
    ? [...car.car_images].sort((a, b) => (a.is_main === b.is_main ? 0 : a.is_main ? -1 : 1))
    : [];

  const imageUrls = sortedImages.length > 0
    ? sortedImages.map(img => img.thumbnail_url || img.image_url)
    : [];

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setFavorited(!favorited);
    await toggleFavorite(user.id, car.id, 'car');
  };

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCompare) onCompare(car);
  };

  // Border Logic: Compare Selection > Featured > Default
  let borderClasses = 'border-gray-200 dark:border-gray-700';
  if (isSelectedForCompare) {
    borderClasses = 'border-primary-600 ring-2 ring-primary-600 ring-offset-2 dark:ring-offset-gray-900';
  } else if (car.is_featured) {
    // Maroon outline for featured ads (#8A1538 is primary-600)
    borderClasses = 'border-primary-600 border-2 shadow-md shadow-primary-900/30';
  }

  return (
    <Link
      to={isCompareMode ? '#' : `/${countryCode}/cars/${car.id}`}
      onClick={isCompareMode ? handleCompareToggle : undefined}
      className={`block group relative cursor-pointer`}
    >
      <div className={`bg-white dark:bg-gray-800 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden border ${borderClasses} h-full flex flex-col`}>
        <div className="relative h-48 sm:h-48 md:h-40 bg-gray-100 dark:bg-gray-900">
          {imageUrls.length > 0 ? (
            <ImageCarousel
              images={imageUrls}
              alt={`${brandName} ${modelName}`}
              aspectRatio="h-48 sm:h-48 md:h-40 w-full"
              className="h-full"
              showArrows={true}
              showDots={true}
              showCounter={false}
              priority={car.is_featured}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <CarIcon className="w-16 h-16 text-gray-400 opacity-50" />
            </div>
          )}

          {/* Featured Badge */}
          {car.is_featured && !isCompareMode && (
            <div className="absolute top-0 left-0 bg-primary-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg z-20 flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3 fill-current" /> {t('car.featured')}
            </div>
          )}

          {/* Compare Checkbox (Only in Compare Mode) */}
          {isCompareMode && (
            <div className={`absolute top-3 right-3 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors z-30 ${isSelectedForCompare ? 'bg-primary-600 border-primary-600' : 'bg-white/80 border-gray-400'}`}>
              {isSelectedForCompare && <Check className="w-4 h-4 text-white" />}
            </div>
          )}

          {/* Overlay Actions (Normal Mode) */}
          {!isCompareMode && (
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-30">
              <button
                onClick={handleFavorite}
                className={`p-1.5 rounded-full backdrop-blur-sm shadow-sm transition ${favorited ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}
                title="Add to Favorites"
              >
                <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
              </button>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          {/* Title Row */}
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate flex-grow">
              {brandName} {modelName} {car.exact_model ? <span className="font-normal text-gray-600 dark:text-gray-400 text-sm"> {car.exact_model}</span> : null}
            </h3>
            {actions && <div className="flex shrink-0 gap-1.5" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>{actions}</div>}
          </div>

          {/* Price and City Row */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-primary-600 dark:text-primary-400 font-bold text-lg whitespace-nowrap">
              {car.price.toLocaleString()} <span className="text-xs">{displayCurrency}</span>
            </span>
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
              <MapPin className="w-3 h-3 me-1" />
              <span>{cityName}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 mt-auto">
            <div className="flex flex-col items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{car.year}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Gauge className="w-4 h-4 text-gray-400" />
              <span>{car.mileage.toLocaleString()} km</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Fuel className="w-4 h-4 text-gray-400" />
              <span className="capitalize">{car.fuel_type ? t(`fuel.${car.fuel_type.toLowerCase()}`) : '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
