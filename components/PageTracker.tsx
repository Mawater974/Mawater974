
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { trackPageView } from '../services/dataService';

export const PageTracker = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { countries, selectedCountryId } = useAppContext();

  // Derive primitives here so we can use them in the dependency array
  // This prevents the effect from re-running if the 'countries' array reference changes but the selected country hasn't.
  const selectedCountry = countries.find(c => c.id === selectedCountryId);
  const countryCode = selectedCountry?.code || '--';
  const countryName = selectedCountry?.name || 'Unknown';

  useEffect(() => {
    // 1. Ignore root path '/' because it is an auto-redirect route.
    // Tracking it creates noise (0s duration visits) and duplicate entries before the redirect happens.
    if (location.pathname === '/') return;

    // 2. Scroll to top on route change
    window.scrollTo(0, 0);

    // 3. Track Page View with debounce
    const timer = setTimeout(() => {
        trackPageView(location.pathname, user?.id, countryCode, countryName);
    }, 800); // Increased slightly to 800ms to ensure stability during redirects

    return () => clearTimeout(timer);
  }, [
    location.pathname, 
    user?.id, 
    countryCode, // Depend on the derived string, not the object
    countryName
  ]);

  return null;
};
