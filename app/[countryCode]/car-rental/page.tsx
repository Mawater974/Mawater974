'use client';

import { useEffect } from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LoginPopup from '@/components/LoginPopup';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';

export default function CountrySpecificCarRentalPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentCountry, setCurrentCountry } = useCountry();
  const params = useParams();
  const countryCode = params.countryCode as string;
  const { countries } = useCountry();

  useEffect(() => {
    if (countryCode && countries.length > 0) {
      const country = countries.find(c => c.code.toLowerCase() === countryCode.toLowerCase());
      if (country) {
        setCurrentCountry(country);
      }
    }
  }, [countryCode, countries, setCurrentCountry]);

  useEffect(() => {
    if (currentCountry?.code) {
      const trackPageView = async () => {
        try {
          const response = await fetch('/api/analytics/page-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              countryCode: currentCountry.code,
              userId: user?.id,
              pageType: 'car-rental' // Change this to your page type
            })
          });
  
          if (!response.ok) {
            const error = await response.json();
            console.error('Failed to track page view:', error);
          }
        } catch (error) {
          console.error('Failed to track page view:', error);
        }
      };
  
      trackPageView();
    }
  }, [currentCountry?.code, user?.id]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{t('rental.title')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Rental Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4">{t('rental.daily.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t('rental.daily.description')}</p>
            <button className="w-full bg-qatar-maroon text-white px-6 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
              {t('rental.daily.button')}
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4">{t('rental.weekly.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t('rental.weekly.description')}</p>
            <button className="w-full bg-qatar-maroon text-white px-6 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
              {t('rental.weekly.button')}
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <h2 className="text-2xl font-semibold mb-4">{t('rental.monthly.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t('rental.monthly.description')}</p>
            <button className="w-full bg-qatar-maroon text-white px-6 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
              {t('rental.monthly.button')}
            </button>
          </div>
        </div>
        
        {/* Featured Cars Section (Featured Rental Cars) */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8">{t('rental.comingSoon.title')}</h2>   
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Coming Soon Section */}
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">{t('rental.comingSoon.title')}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{t('rental.comingSoon.description')}</p>
              <div className="flex justify-center items-center space-x-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </section>
      </div>
      <LoginPopup delay={5000} />
    </div>
  );
}