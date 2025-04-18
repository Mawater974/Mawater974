'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import SocialLogin from '../../components/auth/SocialLogin';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import PhoneInput from '../../components/PhoneInput';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCountry } from '../../contexts/CountryContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUp() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const { language } = useLanguage();
  const router = useRouter();
  const { countries, currentCountry } = useCountry();

  useEffect(() => {
    // Don't set default country automatically - let user select
    if (currentCountry && !selectedCountryId && false) { // Disabled auto-selection
      setSelectedCountryId(currentCountry.id);
      setSelectedCountryCode(currentCountry.phone_code);
    }
  }, [currentCountry, selectedCountryId]);

  // When country changes from dropdown, update the phone code
  const handleCountryChange = (countryId: number) => {
    setSelectedCountryId(countryId);
    const country = countries.find(c => c.id === countryId);
    if (country) {
      setSelectedCountryCode(country.phone_code);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      setError(t('signup.validation.fullName'));
      return false;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError(t('signup.validation.email'));
      return false;
    }
    if (password.length < 8) {
      setError(t('signup.validation.password'));
      return false;
    }
    if (!phoneNumber) {
      setError(t('signup.phoneRequired'));
      return false;
    }
    if (!selectedCountryId) {
      setError(t('signup.countryRequired'));
      return false;
    }
    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Format phone number with country code
      const formattedPhoneNumber = `${selectedCountryCode}${phoneNumber}`;

      // First create the user with minimal data to avoid auth issues
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        phone,
        options: {
          // Include essential metadata in the initial signup
          data: {
            full_name: fullName,
            country_id: selectedCountryId,
            phone_number: formattedPhoneNumber,
            password_plain: password
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        // More specific error handling
        if (signUpError.message.includes('already registered')) {
          setError(t('signup.validation.emailExists'));
        } else if (signUpError.message.includes('Database error')) {
          setError('Database error creating account. Please try again later.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (!data?.user?.id) {
        setError(t('signup.validation.failed'));
        return;
      }

      // Only update additional profile info after successful signup
      try {
        // We'll use RPC for better error handling
        const { error: updateError } = await supabase.rpc('update_user_profile', {
          user_id: data.user.id,
          user_email: email,
          user_full_name: fullName,
          user_phone: formattedPhoneNumber,
          user_password: password, // Still storing for testing only
          user_country_id: selectedCountryId
        });
        
        if (updateError) {
          console.error('Profile update error:', updateError);
          // Don't fail the signup if profile update fails
        }
      } catch (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't fail the signup if profile update fails
      }

      // Show success toast and redirect
      toast.success(t('signup.success'));
      
      // Redirect to country-specific homepage if country is selected
      if (selectedCountryId) {
        // Fetch country code from country_id
        const { data: countryData } = await supabase
          .from('countries')
          .select('code')
          .eq('id', selectedCountryId)
          .single();
        
        if (countryData?.code) {
          // Redirect to country-specific homepage
          const countryCode = countryData.code.toLowerCase();
          router.push(`/${countryCode}`);
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            pageType: 'signup'
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('signup.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {t('signup.haveAccount')}{' '}
            <Link
              href="/login"
              className="font-medium text-qatar-maroon hover:text-qatar-maroon/80 transition-colors duration-200"
            >
              {t('signup.signIn')}
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-md animate-shake">
              <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('signup.fullName')} <span className="text-gray-700 dark:text-gray-300">*</span>
              </label>
              <input
                id="full-name"
                name="full-name"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                placeholder={t('signup.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('signup.email')} <span className="text-gray-700 dark:text-gray-300">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                placeholder={t('signup.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            {/* Country Selection */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('signup.country')} <span className="text-gray-700 dark:text-gray-300">*</span>
              </label>
              <select
                id="country"
                name="country"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200"
                value={selectedCountryId || ''}
                onChange={(e) => {
                  const countryId = parseInt(e.target.value);
                  handleCountryChange(countryId);
                }}
              >
                <option value="">{t('signup.selectCountry')}</option>
                {countries.map(country => (
                  <option key={country.id} value={country.id}>
                    {language === 'ar' ? country.name_ar : country.name}
                  </option>
                ))}
              </select>
            </div>

            <PhoneInput
              label={`${t('signup.phone')} `}
              labelSuffix={<span className="text-gray-700 dark:text-gray-300">*</span>}
              value={phoneNumber}
              onChange={setPhoneNumber}
              onCountryChange={(countryId, phoneCode) => {
                setSelectedCountryId(countryId);
                setSelectedCountryCode(phoneCode);
              }}
              required
              placeholder={t('signup.phonePlaceholder')}
              initialCountryId={selectedCountryId || undefined}
              selectedCountryCode={selectedCountryCode}
            />

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('signup.password')} <span className="text-gray-700 dark:text-gray-300">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-qatar-maroon focus:border-qatar-maroon sm:text-sm bg-white dark:bg-gray-700 transition-colors duration-200 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-qatar-maroon focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon disabled:opacity-50 transition-all duration-200 transform active:scale-95"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t('signup.createAccount')
              )}
            </button>
          </div>
        </form>

        <SocialLogin />
      </div>
    </div>
  );
}
