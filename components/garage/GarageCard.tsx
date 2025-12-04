'use client';

import { Garage } from '@/types/garage';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Star } from 'lucide-react';

interface GarageCardProps {
  garage: Garage;
  countryCode: string;
}

export default function GarageCard({ garage, countryCode }: GarageCardProps) {
  const { language } = useLanguage();

  return (
    <Link key={garage.id} href={`/${countryCode}/garages/${garage.id}`} className="block h-full">
      <div className="relative group bg-white dark:bg-gray-900/95 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-qatar-maroon/100 transition-all duration-200 transform hover:scale-[1.01]">
        {garage.is_featured && (
          <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-qatar-maroon text-white text-xs font-medium rounded-full">
            {language === 'ar' ? 'مميز' : 'Featured'}
          </div>
        )}
        
        {/* Cover Image */}
        <div className="relative aspect-[16/9] bg-gray-100 dark:bg-gray-800">
          {garage.cover_image_url ? (
            <Image
              src={garage.cover_image_url}
              alt={garage.name_en}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <span className="text-muted-foreground">No Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        {/* Garage Info */}
        <div className="p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {language === 'ar' ? garage.name_ar : garage.name_en}
              </h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <MapPin className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'} flex-shrink-0`} />
                <span className="truncate">
                  {language === 'ar' ? (
                    <>{garage.city_ar}، {garage.country_ar}</>
                  ) : (
                    <>{garage.city_en}, {garage.country_en}</>
                  )}
                </span>
              </div>
            </div>
            
            {garage.logo_url && (
              <div className="ml-3 flex-shrink-0">
                <div className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 shadow-md bg-white p-0.5">
                  <Image
                    src={garage.logo_url}
                    alt={`${garage.name_en} logo`}
                    width={48}
                    height={48}
                    className="rounded-full object-cover w-full h-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rating */}
          {/*<div className="flex items-center mb-3">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-amber-500 fill-current" />
              <span className="ml-1 text-sm font-medium text-gray-900 dark:text-white">
                {garage.rating?.toFixed(1) || 'N/A'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                ({garage.review_count} {language === 'ar' ? 'تقييمات' : 'reviews'})
              </span>
            </div>
          </div>*/}

          {/* Services */}
          {(garage.services_ar?.length > 0 || garage.services_en?.length > 0) && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1.5">
                {(language === 'ar' ? garage.services_ar || [] : garage.services_en || []).slice(0, 3).map((service, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {service}
                  </span>
                ))}
                {garage.services_en?.length > 3 && (
                  <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {language === 'ar' 
                      ? `+${(garage.services_ar?.length || 0) - 3} المزيد` 
                      : `+${(garage.services_en?.length || 0) - 3} more`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Hours & CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span className="truncate max-w-[140px] md:max-w-[180px]">
                {garage.opening_hours?.[new Date().getDay()]?.is_closed
                ? language === 'ar' ? 'مغلق اليوم' : 'Closed today'
                : language === 'ar' 
                  ? `مفتوح ${garage.opening_hours?.[new Date().getDay()]?.open} - ${garage.opening_hours?.[new Date().getDay()]?.close}`
                  : `Open ${garage.opening_hours?.[new Date().getDay()]?.open} - ${garage.opening_hours?.[new Date().getDay()]?.close}`}
              </span>
            </div>
            <button 
              className="text-sm font-medium text-qatar-maroon hover:text-qatar-maroon/90 flex items-center"
              onClick={(e) => e.preventDefault()}
            >
              {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
              {language === 'ar' ? (
                <ArrowRight className="mr-1 h-4 w-4 transform rotate-180" />
              ) : (
                <ArrowRight className="ml-1 h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
