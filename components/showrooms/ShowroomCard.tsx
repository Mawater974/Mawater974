import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Showroom } from '@/types/showroom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPinIcon } from '@heroicons/react/24/solid';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useCountry } from '@/contexts/CountryContext';
import { useSupabase } from '@/contexts/SupabaseContext';

interface ShowroomCardProps {
  showroom: Showroom;
}

export default function ShowroomCard({ showroom }: ShowroomCardProps) {
  const { t, language } = useLanguage();
  const { currentCountry } = useCountry();
  const { supabase } = useSupabase();

  return (
    <Link href={`/${currentCountry.code.toLowerCase()}/showrooms/${showroom.id}`} className="block">
      <div className={`group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300 ${showroom.featured ? 'ring-2 ring-qatar-maroon' : ''}`}>
        <div className="relative h-48">
          {showroom.logo ? (
            <Image
              src={showroom.logo}
              alt={language === 'ar' ? showroom.name_ar || showroom.name : showroom.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <div className="text-gray-400 dark:text-gray-500">
                <MapPinIcon className="h-12 w-12 mb-2" />
                <span className="text-sm">{t('showroom.noImage')}</span>
              </div>
            </div>
          )}
          {showroom.featured && (
            <div className="absolute top-3 right-3 bg-qatar-maroon text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
              <span className="flex items-center">
                <SparklesIcon className="h-4 w-4 mr-1" />
                {t('showroom.featured')}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2.5">
            {language === 'ar' ? showroom.name_ar || showroom.name : showroom.name}
          </h3>
          
          <div className="flex items-center mb-2.5">
            <MapPinIcon className="h-5 w-5 text-qatar-maroon mr-2" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {language === 'ar' ? showroom.location_ar || showroom.location : showroom.location}
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                {t(`showroom.dealershipTypes.${showroom.dealershipType}`)}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {language === 'ar' ? showroom.description_ar || showroom.description : showroom.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
