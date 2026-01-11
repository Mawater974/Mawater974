
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FALLBACK_COUNTRIES } from '../services/dataService';
import { LoadingSpinner } from './LoadingSpinner';
import { useAppContext } from '../context/AppContext';

export const CountryRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppContext();

  useEffect(() => {
    const detectAndRedirect = async () => {
      // Default Fallback
      let targetCode = 'qa';

      // 1. Check LocalStorage (Fastest & User Preference)
      const savedCountryId = localStorage.getItem('app_country');
      if (savedCountryId) {
        const country = FALLBACK_COUNTRIES.find(c => c.id === Number(savedCountryId));
        if (country) {
          // If found in storage, redirect immediately
          navigate(`/${country.code.toLowerCase()}${location.pathname}${location.search}`, { replace: true });
          return;
        }
      } 

      // 2. Check IP Address (For new users)
      try {
        // Try primary IP service
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const detectedCode = data.country_code; // e.g. 'QA', 'AE'
          
          // Check if we support this country
          const supportedCountry = FALLBACK_COUNTRIES.find(c => c.code.toLowerCase() === detectedCode?.toLowerCase());
          
          if (supportedCountry) {
            targetCode = supportedCountry.code.toLowerCase();
          }
        }
      } catch (e) {
        console.warn("IP Redirect detection failed, falling back to QA", e);
        // Optional: Try secondary service (ipwho.is) if needed, otherwise continues to default
      }

      // 3. Final Redirect
      navigate(`/${targetCode}${location.pathname}${location.search}`, { replace: true });
    };

    detectAndRedirect();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
       <div className="flex flex-col items-center gap-4">
          <LoadingSpinner className="w-10 h-10" />
          <p className="text-sm text-gray-400">{t('redirect.detecting')}</p>
       </div>
    </div>
  );
};
