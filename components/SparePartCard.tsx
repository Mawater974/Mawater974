
import React from 'react';
import { SparePart, Language } from '../types';
import { Tag, MapPin, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getOptimizedImageUrl } from '../services/dataService';
import { Link, useParams } from 'react-router-dom';

interface Props {
  part: SparePart;
  language: Language;
  t: (key: string) => string;
}

export const SparePartCard: React.FC<Props> = ({ part, language, t }) => {
  const { currency: globalCurrency } = useAppContext();
  const { countryCode } = useParams<{ countryCode: string }>();
  
  // Find primary image or fallback
  const primaryImage = part.spare_part_images?.find(img => img.is_primary) || part.spare_part_images?.[0];
  const imageUrl = primaryImage?.url || 'https://via.placeholder.com/400x300?text=No+Image';
  
  const name = language === 'ar' ? (part.name_ar || part.title) : part.title;
  const brandName = language === 'ar' ? (part.brands?.name_ar || part.brands?.name) : part.brands?.name;
  const cityName = language === 'ar' ? (part.cities?.name_ar || part.cities?.name) : part.cities?.name;

  const displayCurrency = part.countries?.currency_code || part.currency || globalCurrency || 'QAR';

  return (
    <Link 
      to={`/${countryCode}/parts/${part.id}`}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden"
    >
      <div className="h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
        <img 
          src={getOptimizedImageUrl(imageUrl, 500)} 
          alt={name} 
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                part.part_type === 'original' 
                ? 'bg-blue-600 text-white' 
                : 'bg-orange-500 text-white'
            }`}>
                {part.part_type}
            </span>
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                part.condition === 'new' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-600 text-white'
            }`}>
                {part.condition}
            </span>
        </div>

        {part.is_negotiable && (
            <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded font-medium">
                Negotiable
            </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{brandName || 'Universal'}</span>
            {cityName && (
                <div className="flex items-center text-xs text-gray-400">
                    <MapPin className="w-3 h-3 mr-0.5" /> {cityName}
                </div>
            )}
        </div>
        
        <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
            {name}
        </h3>
        
        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div>
                <span className="block text-lg font-black text-primary-600">
                    {part.price.toLocaleString()} <span className="text-xs font-medium text-gray-500">{displayCurrency}</span>
                </span>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 rounded-lg group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 group-hover:text-primary-600 transition">
                <Tag className="w-4 h-4" />
            </div>
        </div>
      </div>
    </Link>
  );
};
