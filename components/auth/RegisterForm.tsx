'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useCountry } from '@/contexts/CountryContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'countryId') {
      handleCountryChange(parseInt(value));
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
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                {countries.find(c => c.id === formData.countryId)?.phone_code || '+974'}
              </span>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleChange}
                className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-qatar-maroon focus:ring-qatar-maroon"
              />
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
