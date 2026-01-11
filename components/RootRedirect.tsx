
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FALLBACK_COUNTRIES } from '../services/dataService';
import { LoadingSpinner } from './LoadingSpinner';

export const CountryRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const detectAndRedirect = async () => {
      // 1. Default to Qatar ('qa')
      let targetCode = 'qa';

      // 2. Check LocalStorage preference (Fastest)
      const savedCountryId = localStorage.getItem('app_country');
      if (savedCountryId) {
        const country = FALLBACK_COUNTRIES.find(c => c.id === Number(savedCountryId));
        if (country) {
          targetCode = country.code.toLowerCase();
        }
      } else {
        // 3. Optional: IP Detection (if no preference saved)
        // We skip this for sub-pages to ensure speed, defaulting to QA 
        // unless you want to add the fetch delay here. 
        // For sub-pages, speed is critical to avoid bounce.
      }

      // 4. Construct new path
      // Remove the leading slash from current pathname to append it cleanly
      // e.g. pathname is "/cars", we want "/qa/cars"
      const pathSuffix = location.pathname;

      // Navigate to /code/suffix + queryParams
      navigate(`/${targetCode}${pathSuffix}${location.search}`, { replace: true });
    };

    detectAndRedirect();
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner className="w-10 h-10" />
    </div>
  );
};
