'use client';

import { useState, useEffect } from 'react';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange: (countryId: number, phoneCode: string) => void;
  label?: string;
  labelSuffix?: React.ReactNode;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  initialCountryId?: number;
  selectedCountryCode?: string;
}

// Phone number validation patterns for different countries
const PHONE_PATTERNS = {
  'QA': { pattern: /^\d{8}$/, placeholder: '12345678', maxLength: 8 },
  'SA': { pattern: /^\d{9}$/, placeholder: '512345678', maxLength: 9 },
  'AE': { pattern: /^\d{9}$/, placeholder: '512345678', maxLength: 9 },
  'KW': { pattern: /^\d{8}$/, placeholder: '12345678', maxLength: 8 },
  'SY': { pattern: /^\d{9}$/, placeholder: '912345678', maxLength: 9 },
};

export default function PhoneInput({
  value,
  onChange,
  onCountryChange,
  label,
  labelSuffix,
  placeholder,
  required = false,
  error,
  className = '',
  initialCountryId,
  selectedCountryCode
}: PhoneInputProps) {
  const { countries, currentCountry } = useCountry();
  const { t, language } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState(
    initialCountryId 
      ? countries.find(c => c.id === initialCountryId) 
      : null
  );

  useEffect(() => {
    if (!selectedCountry && countries.length > 0 && initialCountryId) {
      const country = initialCountryId 
        ? countries.find(c => c.id === initialCountryId) 
        : null;
      
      setSelectedCountry(country);
      if (country && onCountryChange) {
        onCountryChange(country.id, country.phone_code);
      }
    }
  }, [countries, initialCountryId, onCountryChange, selectedCountry]);

  // Update selected country when selectedCountryId changes from parent
  useEffect(() => {
    if (initialCountryId && countries.length > 0) {
      const country = countries.find(c => c.id === initialCountryId);
      if (country && country.id !== selectedCountry?.id) {
        setSelectedCountry(country);
      }
    }
  }, [initialCountryId, countries, selectedCountry]);

  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    if (onCountryChange) {
      onCountryChange(country.id, country.phone_code);
    }
    // Clear the phone number when changing country as format may differ
    onChange('');
  };

  const getPhonePattern = () => {
    if (!selectedCountry) return PHONE_PATTERNS['QA'];
    return PHONE_PATTERNS[selectedCountry.code] || PHONE_PATTERNS['QA'];
  };

  const validatePhoneNumber = (value: string) => {
    const { pattern } = getPhonePattern();
    return pattern.test(value);
  };

  const handlePhoneChange = (e) => {
    // Only allow digits
    const newValue = e.target.value.replace(/\D/g, '');
    
    // Apply max length based on country
    const { maxLength } = getPhonePattern();
    const truncatedValue = newValue.slice(0, maxLength);
    
    onChange(truncatedValue);
  };

  // Display the phone code in the dropdown button
  const displayPhoneCode = selectedCountryCode || (selectedCountry ? selectedCountry.phone_code : '');

  return (
    <div className={className}>
      {label && (
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {labelSuffix}
          {required && !labelSuffix && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative mt-1">
        <div className="flex rounded-md shadow-sm">
          <div className="relative w-24 flex-shrink-0">
            <Listbox value={selectedCountry} onChange={handleCountryChange}>
              <div className="relative">
                <Listbox.Button 
                  className={`relative w-full cursor-default border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left shadow-sm focus:border-qatar-maroon focus:outline-none focus:ring-1 focus:ring-qatar-maroon sm:text-sm ${
                    language === 'ar' ? 'rounded-r-md' : 'rounded-l-md'
                  }`}
                  data-phone-code={selectedCountry?.phone_code}
                >
                  <span className="block truncate font-medium text-gray-900 dark:text-white">
                    {selectedCountry 
                      ? `${selectedCountry.phone_code}`
                      : t('signup.selectCountry')}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon
                      className="h-5 w-5 text-gray-400 dark:text-gray-300"
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
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-auto min-w-[150px] overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {countries.map((country) => (
                      <Listbox.Option
                        key={country.id}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-qatar-maroon/10 text-qatar-maroon dark:bg-qatar-maroon/20' : 'text-gray-900 dark:text-white'
                          }`
                        }
                        value={country}
                        data-country-id={country.id}
                        data-phone-code={country.phone_code}
                      >
                        {({ selected }) => (
                          <>
                            <div className="flex items-center">
                              <span
                                className={`block truncate ${
                                  selected ? 'font-medium text-qatar-maroon' : 'font-normal'
                                }`}
                              >
                                {country.phone_code} {language === 'ar' ? country.name_ar : country.name}
                              </span>
                            </div>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-qatar-maroon">
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
          <div className="relative flex flex-grow items-stretch focus-within:z-10">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {displayPhoneCode && (
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                  {displayPhoneCode}
                </span>
              )}
            </div>
            <input
              type="tel"
              value={value}
              onChange={handlePhoneChange}
              required={required}
              maxLength={getPhonePattern().maxLength}
              className={`appearance-none rounded-none relative block w-full pl-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200 ${
                language === 'ar' ? 'rounded-l-md' : 'rounded-r-md'
              } ${error ? 'border-red-500' : ''}`}
              placeholder={placeholder || getPhonePattern().placeholder}
            />
          </div>
        </div>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
