'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ArrowLeftIcon, 
  ChevronDownIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  LockClosedIcon,
  CogIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function PrivacyPolicyPage() {
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setActiveSection(activeSection === index ? null : index);
  };

  const sections = [
    {
      icon: UserIcon,
      title: t('privacy.infoCollect.title'),
      content: [
        {
          subtitle: t('privacy.infoCollect.personal'),
          details: t('privacy.infoCollect.personalDesc')
        },
        {
          subtitle: t('privacy.infoCollect.usage'),
          details: t('privacy.infoCollect.usageDesc')
        }
      ]
    },
    {
      icon: CogIcon,
      title: t('privacy.useInfo.title'),
      content: [
        {
          subtitle: t('privacy.useInfo.desc'),
          details: '',
          list: [
            t('privacy.useInfo.provide'),
            t('privacy.useInfo.improve'),
            t('privacy.useInfo.understand'),
            t('privacy.useInfo.develop'),
            t('privacy.useInfo.communicate'),
            t('privacy.useInfo.send'),
            t('privacy.useInfo.find')
          ]
        }
      ]
    },
    {
      icon: DocumentTextIcon,
      title: t('privacy.thirdParty.title'),
      content: [
        {
          subtitle: '',
          details: t('privacy.thirdParty.desc')
        }
      ]
    },
    {
      icon: LockClosedIcon,
      title: t('privacy.security.title'),
      content: [
        {
          subtitle: '',
          details: t('privacy.security.desc')
        }
      ]
    },
    {
      icon: ShieldCheckIcon,
      title: t('privacy.cookies.title'),
      content: [
        {
          subtitle: '',
          details: t('privacy.cookies.desc')
        }
      ]
    }
  ];

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
            pageType: 'privacy'
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
    <div className="min-h-screen" dir={dir}>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="mb-12 relative">
          <Link 
            href="/" 
            className="inline-flex items-center text-qatar-maroon hover:text-qatar-maroon/80 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            {t('common.backToHome')}
          </Link>
          
          <div className="absolute top-0 right-0">
            <ShieldCheckIcon className="h-24 w-24 text-qatar-maroon" />
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 animate-fade-in-up">
            {t('privacy.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {t('privacy.lastUpdated')}: March 7, 2024 | Version 1.0
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-8">
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            {t('privacy.intro')}
          </p>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden transition-all duration-300 ease-in-out"
              >
                <button 
                  onClick={() => toggleSection(index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Icon className={`h-8 w-8 ${
                      activeSection === index 
                        ? 'text-qatar-maroon' 
                        : 'text-gray-500 dark:text-gray-400'
                    } transition-colors`} />
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                  <ChevronDownIcon 
                    className={`h-6 w-6 transform transition-transform ${
                      activeSection === index ? 'rotate-180' : ''
                    } ${
                      activeSection === index 
                        ? 'text-qatar-maroon' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`} 
                  />
                </button>

                {activeSection === index && (
                  <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="mb-4 last:mb-0">
                        {item.subtitle && (
                          <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                            {item.subtitle}
                          </h3>
                        )}
                        {item.details && (
                          <p className="text-gray-600 dark:text-gray-300">
                            {item.details}
                          </p>
                        )}
                        {item.list && (
                          <ul className="list-disc pl-6 mt-2 space-y-2 text-gray-600 dark:text-gray-300">
                            {item.list.map((listItem, listIndex) => (
                              <li key={listIndex}>{listItem}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('privacy.contact.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('privacy.contact.desc')}
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <p className="font-medium text-gray-800 dark:text-white">Mawater974</p>
            <p className="text-gray-600 dark:text-gray-300">Email: info@mawater974.com</p>
            <p className="text-gray-600 dark:text-gray-300">Phone: +974 1234 5678</p>
            <p className="text-gray-600 dark:text-gray-300">Address: Doha, Qatar</p>
          </div>
        </div>

        {/* Acceptance Statement */}
        <div className="mt-12 text-center bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
          <p className="text-gray-600 dark:text-gray-300 italic mb-4">
            By continuing to use Mawater974, you acknowledge that you have read, 
            understood, and agree to this Privacy Policy.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/terms" 
              className="text-qatar-maroon hover:underline"
            >
              Terms and Conditions
            </Link>
            <Link 
              href="/contact" 
              className="text-qatar-maroon hover:underline"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
