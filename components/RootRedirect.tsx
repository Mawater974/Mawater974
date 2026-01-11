
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FALLBACK_COUNTRIES } from '../services/dataService';
import { LoadingSpinner } from './LoadingSpinner';
import { useAppContext } from '../context/AppContext';

export const RootRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppContext();

  useEffect(() => {
    // CRITICAL: Check for Supabase Auth tokens in the hash.
    // When using BrowserRouter, the hash is strictly in location.hash.
    // We must pause redirection if an auth token is present to allow Supabase SDK to consume it.
    if (location.hash && (location.hash.includes('access_token') || location.hash.includes('type=recovery'))) {
        console.log("Auth hash detected in RootRedirect, yielding to AuthContext...");
        return; 
    }

    const detectAndRedirect = async () => {
      // 1. Check LocalStorage preference first for fast load
      const savedCountryId = localStorage.getItem('app_country');
      if (savedCountryId) {
        const country = FALLBACK_COUNTRIES.find(c => c.id === Number(savedCountryId));
        if (country) {
          navigate(`/${country.code.toLowerCase()}`, { replace: true });
          return;
        }
      }

      // 2. IP Detection
      let detectedCode: string | null = null;
      
      try {
        // User preferred API logic: https://ipapi.co/json/
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          detectedCode = data.country_code; // e.g., 'QA', 'SA', 'US'
        }
      } catch (e) {
        console.warn('Primary IP detection (ipapi.co) failed, trying fallback...', e);
      }

      // Fallback if ipapi.co fails (e.g. adblocker)
      if (!detectedCode) {
         try {
            const response = await fetch('https://ipwho.is/');
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    detectedCode = data.country_code;
                }
            }
         } catch (e) {
             console.warn('Fallback IP detection (ipwho.is) failed', e);
         }
      }

      // 3. Process Result or Default
      if (detectedCode) {
          // Ensure case-insensitive match against our supported countries
          const matchedCountry = FALLBACK_COUNTRIES.find(c => c.code.toLowerCase() === detectedCode?.toLowerCase());
          
          if (matchedCountry) {
              navigate(`/${matchedCountry.code.toLowerCase()}`, { replace: true });
              return;
          }
      }

      // 4. Default Fallback (Qatar) if nothing matched or failed
      navigate('/qa', { replace: true });
    };

    detectAndRedirect();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
       <div className="text-center flex flex-col items-center">
          <img src="/logo.png" alt="Mawater974" className="h-32 md:h-40 w-auto mb-8 animate-pulse drop-shadow-xl" />
          <LoadingSpinner className="w-12 h-12" />
          <p className="mt-4 text-gray-400 text-sm font-medium animate-pulse">{t('common.loading')}</p>
       </div>
    </div>
  );
};
