'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCountryFromIP, isValidCountryCode } from '@/utils/geoLocation';

export default function RootPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const redirectToCountry = async () => {
      try {
        let redirectCountry = 'qa'; // Default to Qatar
        let geoInfo;

        try {
          // Get the real location from IP
          geoInfo = await getCountryFromIP();
          console.log('Geo IP info:', geoInfo);
        } catch (geoError) {
          console.warn('Could not get geolocation:', geoError);
        }
        
        // Determine redirect country
        if (user && profile?.country_id) {
          // Use user's profile country
          const { data: countryData, error: countryError } = await supabase
            .from('countries')
            .select('code')
            .eq('id', profile.country_id)
            .single();
            
          if (!countryError && countryData) {
            redirectCountry = countryData.code.toLowerCase();
            console.log('Using user profile country:', redirectCountry);
          }
        } else {
          // Check local storage first
          const savedCountryId = typeof window !== 'undefined' ? localStorage.getItem('selectedCountryId') : null;
          
          if (savedCountryId) {
            const { data: countryData, error: countryError } = await supabase
              .from('countries')
              .select('code')
              .eq('id', savedCountryId)
              .single();
              
            if (!countryError && countryData) {
              redirectCountry = countryData.code.toLowerCase();
              console.log('Using saved country from localStorage:', redirectCountry);
            }
          } else if (geoInfo?.code) {
            // Use IP location if valid, otherwise default to Qatar
            try {
              const isValid = await isValidCountryCode(geoInfo.code, supabase);
              redirectCountry = isValid ? geoInfo.code.toLowerCase() : 'qa';
              console.log('Using IP-based country:', redirectCountry, 'isValid:', isValid);
            } catch (validationError) {
              console.warn('Error validating country code:', validationError);
            }
          }
        }
        
        // Don't block redirect on analytics failure
        try {
          await fetch('/api/analytics/page-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              countryCode: geoInfo?.code ? geoInfo.code.toLowerCase() : '--',
              countryName: geoInfo?.name || '--',
              userId: user?.id,
              pageType: 'root',
              page_path: '/',
              redirect_to: `/${redirectCountry}`
            })
          });
        } catch (analyticsError) {
          console.warn('Analytics error:', analyticsError);
          // Don't fail the redirect if analytics fails
        }

        console.log('Redirecting to:', `/${redirectCountry}`);
        router.push(`/${redirectCountry}`);
      } catch (error) {
        console.error('Error in redirectToCountry:', error);
        // Ensure we always redirect even in case of errors
        router.push('/qa');
      } finally {
        setIsLoading(false);
      }
    };
    
    redirectToCountry();
  }, [router, user, profile]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('auth.loading.redirect')}</p>
      </div>
    </div>
  );
}
