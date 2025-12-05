'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCountryFromIP } from '@/utils/geoLocation';

// List of supported countries (should match middleware)
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'sy', 'ae', 'bh', 'om', 'eg'];
const DEFAULT_COUNTRY = 'eg';

export default function RootPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToCountry = async () => {
      try {
        // Skip if we're already on a country-specific route
        const currentPath = pathname.split('/').filter(Boolean)[0]?.toLowerCase();
        if (currentPath && SUPPORTED_COUNTRIES.includes(currentPath)) {
          setIsLoading(false);
          return;
        }

        let redirectCountry = DEFAULT_COUNTRY;
        let countryFromIP: string | null = null;
        
        try {
          // Get country from IP for analytics
          const geoInfo = await getCountryFromIP();
          countryFromIP = geoInfo?.code?.toLowerCase();
          
          // Only use IP country if it's in our supported list
          if (countryFromIP && SUPPORTED_COUNTRIES.includes(countryFromIP)) {
            redirectCountry = countryFromIP;
          }
        } catch (error) {
          console.error('Error getting country from IP:', error);
        }
        
        // Override with user's preferred country if available
        if (user && profile?.country_id) {
          const { data: countryData, error: countryError } = await supabase
            .from('countries')
            .select('code')
            .eq('id', profile.country_id)
            .single();
            
          if (!countryError && countryData?.code) {
            const userCountry = countryData.code.toLowerCase();
            if (SUPPORTED_COUNTRIES.includes(userCountry)) {
              redirectCountry = userCountry;
            }
          }
        } else {
          // Check for previously selected country in local storage
          const savedCountryId = typeof window !== 'undefined' ? localStorage.getItem('selectedCountryId') : null;
          
          if (savedCountryId) {
            const { data: countryData, error: countryError } = await supabase
              .from('countries')
              .select('code')
              .eq('id', savedCountryId)
              .single();
              
            if (!countryError && countryData?.code) {
              const savedCountry = countryData.code.toLowerCase();
              if (SUPPORTED_COUNTRIES.includes(savedCountry)) {
                redirectCountry = savedCountry;
              }
            }
          }
        }
        
        // Track the initial root visit with both real and redirect country
        try {
          await fetch('/api/analytics/page-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              countryCode: countryFromIP || '--',
              countryName: countryFromIP || '--',
              userId: user?.id,
              pageType: 'root',
              page_path: '/',
              redirect_to: `/${redirectCountry}`
            })
          });
        } catch (error) {
          console.error('Error logging analytics:', error);
          // Don't block redirection if analytics fails
        }

        // Redirect to the country-specific page with a trailing slash
        router.push(`/${redirectCountry}/`);
      } catch (error) {
        console.error('Error redirecting to country:', error);
        // Default to Qatar if there's an error
        router.push('/qa');
      } finally {
        setIsLoading(false);
      }
    };
    
    redirectToCountry();
  }, [router, user, profile, pathname]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('auth.loading.redirect')}</p>
      </div>
    </div>
  );
}
