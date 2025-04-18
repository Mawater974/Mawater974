'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LoginPopup from '@/components/LoginPopup';
import { useAuth } from '@/contexts/AuthContext';


export default function CountrySpecificCarPhotographyPage() {
  const params = useParams();
  const { countries, setCurrentCountry, currentCountry } = useCountry();
  const { t } = useLanguage();
  const { user } = useAuth();
  const countryCode = params.countryCode as string;

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
              pageType: 'car-photography' // Change this to your page type
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
        <h1 className="text-4xl font-bold mb-8">{t('photography.title')}</h1>
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-qatar-maroon to-qatar-maroon/80 text-white rounded-xl p-8 mb-12 shadow-lg">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-4">{t('photography.hero.title')}</h2>
            <p className="text-lg mb-6 text-gray-100">{t('photography.hero.description')}</p>
            <button className="bg-white text-qatar-maroon px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
              {t('photography.hero.button')}
            </button>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300">
            <div className="text-qatar-maroon mb-6">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">{t('photography.standard.title')}</h3>
            <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.standard.features.photos')}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.standard.features.editing')}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.standard.features.angles')}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.standard.features.delivery')}
              </li>
            </ul>
            <button className="w-full bg-qatar-maroon text-white py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors font-semibold">
              {t('photography.standard.button')}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300">
            <div className="text-qatar-maroon mb-6">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">{t('photography.premium.title')}</h3>
            <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.premium.features.photos')}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.premium.features.editing')}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.premium.features.angles')}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.premium.features.delivery')}
              </li>
            </ul>
            <button className="w-full bg-qatar-maroon text-white py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors font-semibold">
              {t('photography.premium.button')}
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transform hover:scale-105 transition-all duration-300">
            <div className="text-qatar-maroon mb-6">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">{t('photography.professional.title')}</h3>
            <ul className="space-y-3 mb-8 text-gray-600 dark:text-gray-300">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.professional.features.photos')}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.professional.features.editing')}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.professional.features.angles')}
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-qatar-maroon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('photography.professional.features.delivery')}
              </li>
            </ul>
            <button className="w-full bg-qatar-maroon text-white py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors font-semibold">
              {t('photography.professional.button')}
            </button>
          </div>
        </div>

        {/* Portfolio Section */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white hidden">{t('photography.portfolio.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 hidden">
            {/* Portfolio image placeholders */}
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="mt-16">
          <h2 className="text-3xl font-bold mb-8">{t('photography.comingSoon.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">{t('photography.comingSoon.title')}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">{t('photography.comingSoon.description')}</p>
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