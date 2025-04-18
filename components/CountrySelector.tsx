'use client';

import { useState, useEffect, Fragment } from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

export default function CountrySelector() {
  const { countries, currentCountry, isLoading, changeCountry } = useCountry();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleCountryChange = (country) => {
    // Use the new changeCountry function that handles loading state and redirection
    changeCountry(country);
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <GlobeAltIcon className="h-5 w-5" />
        <span>{t('auth.loading')}</span>
      </div>
    );
  }

  if (!currentCountry) return null;

  return (
    <div className="relative">
      <Listbox value={currentCountry} onChange={handleCountryChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-md bg-white dark:bg-gray-800 py-2 pl-2 pr-7 text-left shadow-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-900 dark:text-white">
            <div className="flex items-center">
              <Image
                src={`/flags/${currentCountry.code.toLowerCase()}.svg`}
                alt={`${currentCountry.name} flag`}
                width={24}
                height={16}
                className="rounded-sm"
              />
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-48 overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {countries.map((country) => (
                <Listbox.Option
                  key={country.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-gray-900 dark:text-white'
                    }`
                  }
                  value={country}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center gap-2">
                        <Image
                          src={`/flags/${country.code.toLowerCase()}.svg`}
                          alt={`${country.name} flag`}
                          width={24}
                          height={16}
                          className="rounded-sm"
                        />
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {t('nav.country') === 'ar' ? country.name_ar : country.name}
                        </span>
                      </div>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
