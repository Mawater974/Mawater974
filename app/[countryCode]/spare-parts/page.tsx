'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import LoginPopup from '@/components/LoginPopup';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function SpareParts() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        const response = await fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            countryCode: '--', // Default to Qatar since this is a global page
            userId: user?.id,
            pageType: 'spareParts'
          })
        });
  
        if (!response.ok) {
          console.error('Failed to track page view:', await response.json());
        }
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };
  
    trackPageView();
  }, [user?.id]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{t('spareParts.title')}</h1>
        
        {/* Search Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder={t('spareParts.search.placeholder')}
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                          placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 
                          focus:ring-qatar-maroon focus:border-transparent"
            />
            <select className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 
                          focus:ring-2 focus:ring-qatar-maroon focus:border-transparent">
              <option value="">{t('spareParts.search.carMake')}</option>
            </select>
            <button className="bg-qatar-maroon text-white px-8 py-3 rounded-lg hover:bg-qatar-maroon/90 transition-colors">
              {t('spareParts.search.button')}
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: (
                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: 'spareParts.categories.engineParts',
              desc: 'spareParts.categories.engineParts.desc'
            },
            {
              icon: (
                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'spareParts.categories.brakeSystem',
              desc: 'spareParts.categories.brakeSystem.desc'
            },
            {
              icon: (
                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ),
              title: 'spareParts.categories.suspension',
              desc: 'spareParts.categories.suspension.desc'
            },
            {
              icon: (
                <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ),
              title: 'spareParts.categories.bodyParts',
              desc: 'spareParts.categories.bodyParts.desc'
            }
          ].map((category, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all duration-300">
              <div className="text-qatar-maroon mb-4">
                {category.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{t(category.title)}</h3>
              <p className="text-gray-600 dark:text-gray-300">{t(category.desc)}</p>
            </div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <section className="mt-12">
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">{t('spareParts.comingSoon.title')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{t('spareParts.comingSoon.desc')}</p>
          </div>
        </section>
      </div>
      <LoginPopup delay={5000} />
    </div>
  );
}
