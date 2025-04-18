'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/contexts/CountryContext';
import { useRouter } from 'next/navigation';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { Listbox } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import { Fragment } from 'react';
import { Transition } from '@headlessui/react';

interface LoginPopupProps {
  delay?: number; // Delay in milliseconds before showing popup
}

interface Country {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  flag: string;
}

export default function LoginPopup({ delay = 5000 }: LoginPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { currentCountry } = useCountry();
  const countryPrefix = currentCountry ? `/${currentCountry.code.toLowerCase()}` : '';
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const countries = [
    { id: 1, name: 'Kuwait', name_ar: 'الكويت', code: 'KW', flag: '/flags/kw.svg' },
    { id: 2, name: 'Qatar', name_ar: 'قطر', code: 'QA', flag: '/flags/qa.svg' },
    { id: 3, name: 'United Arab Emirates', name_ar: 'الإمارات العربية المتحدة', code: 'AE', flag: '/flags/ae.svg' },
    { id: 4, name: 'Saudi Arabia', name_ar: 'المملكة العربية السعودية', code: 'SA', flag: '/flags/sa.svg' },
    { id: 5, name: 'Syria', name_ar: 'سوريا', code: 'SY', flag: '/flags/sy.svg' },
    { id: 6, name: 'Egypt', name_ar: 'مصر', code: 'EG', flag: '/flags/eg.svg' },
  ];

  useEffect(() => {
    // Show popup after specified delay if user is not logged in
    const timer = setTimeout(() => {
      if (!user) {
        setIsOpen(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [user, delay]);

  // Handle country selection change
  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    // Redirect to homepage with country code
    router.push(`/${country.code.toLowerCase()}`);
    // Close the popup
    setIsOpen(false);
  };

  if (!isOpen || user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('auth.popup.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('auth.popup.description')}
          </p>
          <div className="flex flex-col space-y-4 mb-6">
            <Link
              href={`${countryPrefix}/login`}
              className="bg-qatar-maroon text-white px-6 py-3 rounded-lg font-semibold hover:bg-qatar-maroon-dark transition-colors"
            >
              {t('auth.login')}
            </Link>
            <Link
              href={`${countryPrefix}/signup`}
              className="bg-white text-qatar-maroon border-2 border-qatar-maroon px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              {t('auth.signup')}
            </Link>
          </div>
          
          <div className="space-y-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Listbox value={selectedCountry} onChange={handleCountryChange}>
              {({ open }) => (
                <>
                  <Listbox.Button className="relative w-full cursor-default rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
                    <span className="block truncate">
                      {selectedCountry ? selectedCountry.name : t('auth.selectCountry')}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-2 mt-1 max-h-40 w-60 overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {countries.map((country) => (
                        <Listbox.Option
                          key={country.id}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-2 pr-2 ${
                              active ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-gray-900 dark:text-white'
                            }`
                          }
                          value={country}
                        >
                          {({ selected }) => (
                            <div className="flex items-center gap-2">
                              <Image
                                src={country.flag}
                                alt={`${country.name} flag`}
                                width={24}
                                height={16}
                                style={{ height: 'auto' }}
                                className="rounded-sm w-6"
                              />
                              <span
                                className={`block truncate ${
                                  selected ? 'font-medium' : 'font-normal'
                                }`}
                              >
                                {language === 'ar' ? country.name_ar : country.name}
                              </span>
                            </div>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </>
              )}
            </Listbox>
          </div>
        </div>
      </div>
    </div>
  );
}