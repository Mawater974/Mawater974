
import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getDealerships, getOptimizedImageUrl, DealerSortOption } from '../services/dataService';
import { Dealership } from '../types';
import { MapPin, Building2, CheckCircle, Clock, ChevronRight, SlidersHorizontal, Warehouse } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SEO } from '../components/SEO';

export const DealershipsPage: React.FC = () => {
  const { t, language, dir, selectedCountryId, selectedCountry } = useAppContext();
  const { countryCode } = useParams<{ countryCode: string }>();
  const [dealers, setDealers] = useState<Dealership[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<DealerSortOption>('featured');

  const countryName = language === 'ar' ? selectedCountry?.name_ar : selectedCountry?.name;

  useEffect(() => {
    const fetch = async () => {
      // Strictly wait for country ID to be available
      if (!selectedCountryId) return;
      
      setLoading(true);
      const data = await getDealerships('all', selectedCountryId, sortBy);
      setDealers(data);
      setLoading(false);
    };
    fetch();
  }, [selectedCountryId, sortBy]);

  if (!selectedCountryId) return (
    <div className="flex justify-center items-center py-20">
        <LoadingSpinner className="w-12 h-12 text-gray-900 dark:text-white" />
    </div>
  );

  return (
    <div>
      <SEO 
        title={t('seo.dealers.title', { country: countryName || 'Qatar' })}
        description={t('seo.dealers.description', { country: countryName || 'Qatar' })}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
              <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
                  <Building2 className="text-primary-600" />
                  {t('nav.dealers')}
              </h1>
              <p className="text-gray-500 mt-2">{t('dealers.subtitle')}</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-500 uppercase mr-1">{t('sort.label')}:</span>
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as DealerSortOption)}
                    className="bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white font-medium cursor-pointer"
                >
                    <option value="featured">{t('sort.featured')}</option>
                    <option value="newest">{t('sort.newest')}</option>
                    <option value="name_asc">{t('sort.name_asc')}</option>
                </select>
          </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
            <LoadingSpinner className="w-16 h-16" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dealers.map(dealer => {
                const name = language === 'ar' ? dealer.business_name_ar : dealer.business_name;
                const desc = language === 'ar' ? dealer.description_ar : dealer.description;
                const location = language === 'ar' ? (dealer.location_ar || dealer.location) : dealer.location;
                const city = language === 'ar' ? (dealer.cities?.name_ar || dealer.cities?.name) : dealer.cities?.name;
                
                return (
                  <Link 
                    to={`/${countryCode}/showrooms/${dealer.id}`}
                    key={dealer.id} 
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full group"
                  >
                     {/* Cover Area (Full Image - Only one image used here) */}
                     <div className="h-48 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                        {dealer.logo_url ? (
                            <img 
                                src={getOptimizedImageUrl(dealer.logo_url, 400)} 
                                alt={name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                                <Warehouse className="w-12 h-12 text-gray-400" />
                            </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                        <div className="absolute top-3 right-3 flex gap-2 z-10">
                            {dealer.featured && (
                                <div className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                    <CheckCircle className="w-3 h-3" /> Featured
                                </div>
                            )}
                            {dealer.business_type && (
                                <div className="bg-white/90 backdrop-blur text-gray-800 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm capitalize">
                                    {dealer.business_type.replace('_', ' ')}
                                </div>
                            )}
                        </div>
                     </div>

                     {/* Content */}
                     <div className="p-5 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                           <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{name}</h3>
                                <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">{dealer.dealership_type}</p>
                           </div>
                        </div>
                        
                        {/* Description - Strictly limited to 1 line with truncation */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-4" title={desc}>
                            {desc || "Visit our showroom to see our premium collection."}
                        </p>

                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{city ? `${city}, ` : ''}{location}</span>
                            </div>
                            {dealer.opening_hours && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="truncate">{dealer.opening_hours}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-4 flex items-center text-primary-600 text-sm font-bold group/btn">
                            {t('common.view_details')}
                            <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${dir === 'rtl' ? 'rotate-180 group-hover/btn:-translate-x-1' : 'group-hover/btn:translate-x-1'}`} />
                        </div>
                     </div>
                  </Link>
                );
            })}
        </div>
      )}
      {!loading && dealers.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('dealers.no_results')}</p>
            <p className="text-xs text-gray-400 mt-2">Try selecting a different country.</p>
          </div>
      )}
    </div>
  );
};
