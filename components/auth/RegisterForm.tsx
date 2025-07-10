'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from 'next-language-router';
import { Country, City } from '@/types/supabase';

interface RegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RegisterForm({ onSuccess, onCancel }: RegisterFormProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const { countries, cities, currentCountry, getCitiesByCountry } = useCountry();
  const { t, language } = useLanguage();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    countryId: 0,
    cityId: 0,
  });
  
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // Phone number validation patterns by country code
  const PHONE_VALIDATION: Record<string, { pattern: RegExp; error: string }> = {
    '1': { pattern: /^\d{10}$/, error: 'US/Canada: 10 digits required' }, // US/Canada
    '44': { pattern: /^\d{10,11}$/, error: 'UK: 10-11 digits required' }, // UK
    '33': { pattern: /^\d{9}$/, error: 'France: 9 digits required' }, // France
    '49': { pattern: /^\d{10,11}$/, error: 'Germany: 10-11 digits required' }, // Germany
    '966': { pattern: /^5\d{8}$/, error: 'Saudi: 9 digits starting with 5' }, // KSA
    '974': { pattern: /^[3567]\d{7}$/, error: 'Qatar: 8 digits starting with 3,5,6,7' }, // Qatar
    '971': { pattern: /^5[0-9]{8}$/, error: 'UAE: 9 digits starting with 5' }, // UAE
    '20': { pattern: /^1[0-9]{9,10}$/, error: 'Egypt: 10-11 digits starting with 1' }, // Egypt
    '91': { pattern: /^[6-9]\d{9}$/, error: 'India: 10 digits starting with 6-9' }, // India
    '86': { pattern: /^1[3-9]\d{9}$/, error: 'China: 11 digits starting with 13-19' }, // China
    '81': { pattern: /^[789]0\d{8}$/, error: 'Japan: 11 digits starting with 70,80,90' }, // Japan
    '82': { pattern: /^1[0-9]{9,10}$/, error: 'South Korea: 10-11 digits starting with 1' }, // South Korea
    '65': { pattern: /^[89]\d{7}$/, error: 'Singapore: 8 digits starting with 8-9' }, // Singapore
    '60': { pattern: /^1[0-9]{8,9}$/, error: 'Malaysia: 9-10 digits starting with 1' }, // Malaysia
    '90': { pattern: /^5\d{9}$/, error: 'Turkey: 10 digits starting with 5' }, // Turkey
    '7': { pattern: /^9\d{9}$/, error: 'Russia: 10 digits starting with 9' }, // Russia
    '55': { pattern: /^[1-9]{2}9[0-9]{8}$/, error: 'Brazil: 11 digits, format: XX9XXXXXXXX' }, // Brazil
    '52': { pattern: /^1\d{9,10}$/, error: 'Mexico: 10-11 digits starting with 1' }, // Mexico
    '54': { pattern: /^9\d{10}$/, error: 'Argentina: 11 digits starting with 9' }, // Argentina
    '27': { pattern: /^[6-8]\d{8}$/, error: 'South Africa: 9 digits starting with 6-8' }, // South Africa
    '234': { pattern: /^[7-9]0[0-9]{8}$/, error: 'Nigeria: 11 digits starting with 70,80,90' }, // Nigeria
    '212': { pattern: /^[6-7]\d{8}$/, error: 'Morocco: 9 digits starting with 6-7' }, // Morocco
    '216': { pattern: /^[2-5]\d{7}$/, error: 'Tunisia: 8 digits starting with 2-5' }, // Tunisia
    '213': { pattern: /^[5-7]\d{8}$/, error: 'Algeria: 9 digits starting with 5-7' }, // Algeria
    '218': { pattern: /^9[1-6]\d{7}$/, error: 'Libya: 9 digits starting with 91-96' }, // Libya
    '973': { pattern: /^[369]\d{7}$/, error: 'Bahrain: 8 digits starting with 3,6,9' }, // Bahrain
    '965': { pattern: /^[569]\d{7}$/, error: 'Kuwait: 8 digits starting with 5,6,9' }, // Kuwait
    '968': { pattern: /^9\d{7}$/, error: 'Oman: 8 digits starting with 9' }, // Oman
  };

  // Helper function to validate phone number based on country code
  const validatePhoneNumber = (phone: string, countryCode: string): { isValid: boolean; error?: string } => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // First, check basic length requirements (8-15 digits)
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      return { 
        isValid: false, 
        error: t('auth.phoneNumberLength', { min: 8, max: 15 })
      };
    }
    
    // Find the validation rule for the country code
    const validation = PHONE_VALIDATION[countryCode];
    
    if (!validation) {
      // If no specific validation exists, basic length check is enough
      return { isValid: true };
    }
    
    // Apply the specific validation pattern
    if (!validation.pattern.test(digitsOnly)) {
      return { 
        isValid: false, 
        error: t('auth.phoneNumberFormatError', { format: validation.error })
      };
    }
    
    return { isValid: true };
  };

  // Set initial country and city based on current location
  useEffect(() => {
    if (currentCountry) {
      setFormData(prev => ({
        ...prev,
        countryId: currentCountry.id,
      }));
      
      const citiesForCountry = getCitiesByCountry(currentCountry.id);
      setAvailableCities(citiesForCountry);
      
      if (citiesForCountry.length > 0) {
        setFormData(prev => ({
          ...prev,
          cityId: citiesForCountry[0].id,
        }));
      }
    }
  }, [currentCountry, getCitiesByCountry]);
  
  // Update available cities when country changes
  const handleCountryChange = (countryId: number) => {
    setFormData(prev => ({
      ...prev,
      countryId,
      cityId: 0, // Reset city when country changes
    }));
    
    const citiesForCountry = getCitiesByCountry(countryId);
    setAvailableCities(citiesForCountry);
    
    if (citiesForCountry.length > 0) {
      setFormData(prev => ({
        ...prev,
        cityId: citiesForCountry[0].id,
      }));
    }
    
    // Re-validate phone number when country changes
    if (formData.phoneNumber) {
      const country = countries.find(c => c.id === countryId);
      if (country?.phone_code) {
        const countryCode = country.phone_code.replace('+', '');
        const { isValid, error: validationError } = validatePhoneNumber(formData.phoneNumber, countryCode);
        setPhoneError(isValid ? null : validationError || null);
      }
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'countryId') {
      handleCountryChange(parseInt(value));
    } else if (name === 'phoneNumber') {
      // Only allow numbers and format as user types
      const digits = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: digits,
      }));
      
      // Validate phone number in real-time
      if (formData.countryId) {
        const country = countries.find(c => c.id === formData.countryId);
        if (country?.phone_code) {
          const countryCode = country.phone_code.replace('+', '');
          const { isValid, error: validationError } = validatePhoneNumber(digits, countryCode);
          setPhoneError(isValid ? null : validationError || null);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'cityId' ? parseInt(value) : value,
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    
    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    
    if (!formData.countryId || !formData.cityId) {
      setError(t('auth.selectCountryAndCity'));
      return;
    }

    // Get country code for phone validation
    const country = countries.find(c => c.id === formData.countryId);
    if (country?.phone_code) {
      const countryCode = country.phone_code.replace('+', '');
      const { isValid, error: phoneError } = validatePhoneNumber(formData.phoneNumber, countryCode);
      
      if (!isValid) {
        setError(phoneError || 'Invalid phone number format');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      if (data?.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            phone_number: formData.phoneNumber,
            country_id: formData.countryId,
            city_id: formData.cityId,
          })
          .eq('id', data.user.id);
        
        if (profileError) throw profileError;
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/profile');
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || t('auth.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-qatar-maroon">
        {t('auth.createAccount')}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.fullName')}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon"
            />
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon"
            />
          </div>
          
          {/* Country */}
          <div>
            <label htmlFor="countryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.country')}
            </label>
            <select
              id="countryId"
              name="countryId"
              required
              value={formData.countryId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon"
            >
              <option value="">{t('auth.selectCountry')}</option>
              {countries.map(country => (
                <option key={country.id} value={country.id}>
                  {language === 'ar' ? country.name_ar : country.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* City */}
          <div>
            <label htmlFor="cityId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.city')}
            </label>
            <select
              id="cityId"
              name="cityId"
              required
              value={formData.cityId}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon"
              disabled={!formData.countryId || availableCities.length === 0}
            >
              <option value="">{t('auth.selectCity')}</option>
              {availableCities.map(city => (
                <option key={city.id} value={city.id}>
                  {language === 'ar' ? city.name_ar : city.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Phone Number with Country Code */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.phoneNumber')}
            </label>
            <div className="mt-1 flex flex-col">
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  {countries.find(c => c.id === formData.countryId)?.phone_code || '+974'}
                </span>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  pattern="\d{8,10}"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-qatar-maroon focus:ring-qatar-maroon ${
                    phoneError ? 'border-red-500' : ''
                  }`}
                  placeholder={t('auth.enterPhoneNumber')}
                />
              </div>
              {phoneError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {phoneError}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t('auth.phoneNumberFormat')}
              </p>
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon"
            />
          </div>
          
          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('auth.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-qatar-maroon focus:ring-qatar-maroon"
            />
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-between space-x-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
              >
                {t('common.cancel')}
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? t('common.loading') : t('auth.register')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
