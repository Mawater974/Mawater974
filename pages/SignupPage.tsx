
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { createUserProfile } from '../services/dataService';
import { Globe, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';

// Common country phone codes mapping based on LOWERCASE ISO codes
const COUNTRY_PHONE_CODES: Record<string, string> = {
  'qa': '+974',
  'sa': '+966',
  'ae': '+971',
  'kw': '+965',
  'bh': '+973',
  'om': '+968',
  'us': '+1',
  'gb': '+44',
  'in': '+91',
  'eg': '+20',
  'jo': '+962',
  'lb': '+961',
  'sy': '+963',
  'iq': '+964',
  'tr': '+90',
};

export const SignupPage: React.FC = () => {
  const { t, countries, language } = useAppContext();
  const navigate = useNavigate();
  const { countryCode } = useParams<{ countryCode: string }>();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // New Fields: Default to empty/user must select
  const [selectedCountry, setSelectedCountry] = useState<number | ''>('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedCountry(id);
    
    // Auto-select phone code based on selection
    const country = countries.find(c => c.id === id);
    if (country && country.code) {
      const code = COUNTRY_PHONE_CODES[country.code.toLowerCase()] || '+';
      setPhoneCode(code);
    } else {
        setPhoneCode('');
    }
  };

  const handleGoogleSignup = async () => {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: window.location.origin + window.location.pathname
          }
      });
      if (error) {
          setError(error.message);
          setGoogleLoading(false);
      }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedCountry) {
        setError(t('signup.error.select_country'));
        return;
    }

    if (!phoneCode) {
        setError(t('signup.error.invalid_code'));
        return;
    }

    // Remove any non-digits from user input
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const fullPhoneNumber = `${phoneCode}${cleanNumber}`;
    
    // Count actual digits (excluding +) to ensure it meets DB constraint (10-15 digits)
    const digitCount = fullPhoneNumber.replace(/\D/g, '').length;
    if (digitCount < 10 || digitCount > 15) {
        setError(t('signup.error.phone_length'));
        return;
    }

    setLoading(true);

    // 1. Sign up user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
          data: {
              full_name: fullName,
              country_id: Number(selectedCountry),
              phone_number: fullPhoneNumber 
          }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 1.5 Try to update auth.users phone column if we are logged in (session exists)
      if (data.session) {
          try {
            await supabase.auth.updateUser({ phone: fullPhoneNumber });
          } catch (e) {
              console.warn("Could not update auth phone column", e);
          }
      }

      // 2. Create/Update Profile with Country, Phone, and Plain Password
      // We use the full phone number matching the regex constraint ^\+?[0-9]{10,15}$
      const success = await createUserProfile({
        id: data.user.id,
        full_name: fullName,
        country_id: Number(selectedCountry),
        phone_number: fullPhoneNumber, 
        email: email,
        password_plain: password // Saving plain password as requested
      });

      if (success) {
        // Find the country object to redirect to the correct path
        const targetCountry = countries.find(c => c.id === Number(selectedCountry));
        // Redirect to the selected country's home page
        const targetPath = targetCountry ? `/${targetCountry.code.toLowerCase()}` : `/${countryCode}`;
        
        navigate(targetPath);
      } else {
        setError(t('signup.error.profile_save'));
      }
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition shadow-sm placeholder-gray-400";

  return (
    <div className="max-w-md mx-auto mt-12 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">{t('signup.title')}</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
          {error}
        </div>
      )}

      {/* Google Signup Button */}
      <button 
        onClick={handleGoogleSignup}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition mb-6 shadow-sm"
      >
        {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
        )}
        {t('login.google')}
      </button>

      <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
      </div>

      <form onSubmit={handleSignup} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('signup.fullname')}</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={inputClass}
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('login.email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        {/* Country Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
             <Globe className="w-3 h-3" /> {t('signup.select_country')}
          </label>
          <select 
            value={selectedCountry}
            onChange={handleCountryChange}
            required
            className={inputClass}
          >
            <option value="" disabled>{t('signup.select_country')}</option>
            {countries.map(c => (
              <option key={c.id} value={c.id}>
                {language === 'ar' ? c.name_ar : c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Phone Number with Auto Code */}
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
             <Phone className="w-3 h-3" /> {t('signup.phone')}
          </label>
          <div className="flex gap-2">
             <div className="w-24 flex-shrink-0">
               <input 
                 type="text" 
                 value={phoneCode} 
                 readOnly 
                 placeholder="+..."
                 className={`${inputClass} bg-gray-50 dark:bg-gray-600 text-center font-mono`} 
                 title="Country Code"
               />
             </div>
             <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} // Digits only
                required
                className={inputClass}
                placeholder="12345678"
             />
          </div>
          <p className="text-xs text-gray-500 mt-1">{t('signup.phone_format')}: {phoneCode || '+974'} XXXXXXXX</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{t('login.password')}</label>
          <div className="relative">
            <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${inputClass} pr-12`}
                placeholder={t('signup.password_hint')}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-5 h-5 animate-spin" />}
          {t('signup.submit')}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        {t('signup.has_account')}{' '}
        <Link to={`/${countryCode}/login`} className="text-primary-600 hover:text-primary-700 font-semibold">
          {t('signup.login_link')}
        </Link>
      </div>
    </div>
  );
};
