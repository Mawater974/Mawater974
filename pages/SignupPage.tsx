
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { createUserProfile } from '../services/dataService';
import { Globe, Phone } from 'lucide-react';

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
  
  // New Fields: Default to empty/user must select
  const [selectedCountry, setSelectedCountry] = useState<number | ''>('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [loading, setLoading] = useState(false);
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
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
            placeholder={t('signup.password_hint')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {loading ? t('common.loading') : t('signup.submit')}
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
