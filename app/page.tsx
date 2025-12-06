'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getCountryFromIP } from '@/utils/geoLocation';

// List of supported countries (should match middleware)
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'sy', 'ae', 'bh', 'kw', 'om', 'eg'];
const DEFAULT_COUNTRY = 'eg';

export default function RootPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const trackAndRedirect = async () => {
      try {
        // Get country from IP for analytics
        let detectedCountry = '--';
        try {
          const geoInfo = await getCountryFromIP();
          detectedCountry = geoInfo?.code || '--';
        } catch (error) {
          console.error('Error detecting country:', error);
        }

        // Get the country code from the cookie (set by middleware)
        const countryCode = document.cookie
          .split('; ')
          .find(row => row.startsWith('user_country='))
          ?.split('=')[1] || DEFAULT_COUNTRY;

        // Track the initial root visit
        try {
          await fetch('/api/analytics/page-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              countryCode: detectedCountry,
              countryName: detectedCountry,
              userId: user?.id,
              pageType: 'root',
              page_path: '/',
              redirect_to: `/${countryCode}`
            })
          });
        } catch (error) {
          console.error('Error logging analytics:', error);
          // Don't block redirection if analytics fails
        }

        // Redirect to the country-specific page
        router.push(`/${countryCode}/`);

      } catch (error) {
        console.error('Error in root page redirect:', error);
        // Fallback to default country if something goes wrong
        router.push(`/${DEFAULT_COUNTRY}/`);
      }
    };

    trackAndRedirect();
  }, [router, user?.id]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your experience...</p>
      </div>
    </div>
  );
}
