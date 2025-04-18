'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeftIcon, 
  ChevronDownIcon, 
  DocumentCheckIcon, 
  ShieldCheckIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

export default function TermsAndConditionsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const toggleSection = (index: number) => {
    setActiveSection(activeSection === index ? null : index);
  };

  const sections = [
    {
      icon: ShieldCheckIcon,
      title: 'User Acceptance and Platform Overview',
      content: [
        {
          subtitle: 'Terms of Service',
          details: 'By accessing Mawater974, you enter a legally binding agreement. These terms govern your use of our platform, defining rights, responsibilities, and expectations for all users.'
        },
        {
          subtitle: 'Platform Scope',
          details: 'Mawater974 is an online automotive marketplace facilitating vehicle listings, sales, and interactions between buyers and sellers in Qatar and the surrounding region.'
        }
      ]
    },
    {
      icon: DocumentCheckIcon,
      title: 'User Obligations and Conduct',
      content: [
        {
          subtitle: 'Account Responsibilities',
          details: 'Users must maintain account security, provide accurate information, and ensure all interactions comply with platform guidelines and local regulations.'
        },
        {
          subtitle: 'Prohibited Activities',
          details: 'Engaging in fraudulent listings, misrepresentation, harassment, or any activity that compromises platform integrity is strictly forbidden.'
        }
      ]
    },
    {
      icon: InformationCircleIcon,
      title: 'Listing and Transaction Guidelines',
      content: [
        {
          subtitle: 'Listing Accuracy',
          details: 'All vehicle listings must contain precise, truthful information. Sellers are responsible for the accuracy of vehicle descriptions, specifications, and condition.'
        },
        {
          subtitle: 'Transaction Disclaimer',
          details: 'Mawater974 serves as a facilitator and is not a direct party to transactions. Users are responsible for due diligence, negotiation, and finalizing sales.'
        }
      ]
    }
  ];

  const legalNotice = [
    'These terms are subject to change. Continued use of Mawater974 constitutes acceptance of updated terms.',
    'All disputes are governed by the laws of Qatar and shall be resolved through appropriate legal channels.',
    'Mawater974 reserves the right to suspend or terminate user accounts for violations of these terms.'
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
            pageType: 'terms'
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
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Header */}
        <div className="mb-12 relative">
          <Link 
            href="/" 
            className="inline-flex items-center text-qatar-maroon hover:text-qatar-maroon/80 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
          
          <div className="absolute top-0 right-0">
            <ShieldCheckIcon className="h-24 w-24 text-qatar-maroon" />
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 animate-fade-in-up">
            Terms and Conditions
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Last Updated: February 2024 | Version 1.2
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
                        <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
                          {item.subtitle}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {item.details}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legal Notice */}
        <div className="mt-12 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Important Legal Notice
          </h3>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
            {legalNotice.map((notice, index) => (
              <li key={index}>{notice}</li>
            ))}
          </ul>
        </div>

        {/* Acceptance Statement */}
        <div className="mt-12 text-center bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
          <p className="text-gray-600 dark:text-gray-300 italic mb-4">
            By continuing to use Mawater974, you acknowledge that you have read, 
            understood, and agree to these Terms and Conditions.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/privacy" 
              className="text-qatar-maroon hover:underline"
            >
              Privacy Policy
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
