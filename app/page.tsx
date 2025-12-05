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
        // List of allowed country codes
        const allowedCountryCodes = ['qa', 'ae', 'om', 'bh', 'sa', 'sy', 'eg'];
        
        // Always get the real location from IP first
        const geoInfo = await getCountryFromIP();
        let redirectCountry = 'eg'; // Default to Egypt
        
        // Function to validate and get country code
        const getValidCountryCode = async (code: string) => {
          if (!code) {
            console.log('No country code provided');
            return null;
          }
          
          const lowerCode = code.toLowerCase();
          console.log('Validating country code:', lowerCode);
          
          // First check if it's in our allowed list
          if (allowedCountryCodes.includes(lowerCode)) {
            console.log('Country code in allowed list, checking database...');
            // Then verify it exists in the database (case-insensitive check)
            const { data: countryData, error } = await supabase
              .from('countries')
              .select('code')
              .ilike('code', lowerCode)
              .single();
              
            console.log('Database check result:', { countryData, error });
            
            if (countryData) {
              console.log('Valid country code found:', lowerCode);
              return lowerCode;
            } else if (error) {
              console.error('Error checking country code in database:', error);
            }
          } else {
            console.log('Country code not in allowed list:', lowerCode);
          }
          return null;
        };
        
        // Determine redirect country
        if (user && profile?.country_id) {
          // Use user's profile country if it's valid
          const { data: countryData, error: countryError } = await supabase
            .from('countries')
            .select('code')
            .eq('id', profile.country_id)
            .single();
            
          if (!countryError && countryData) {
            const validCode = await getValidCountryCode(countryData.code);
            if (validCode) {
              redirectCountry = validCode;
            }
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
              const validCode = await getValidCountryCode(countryData.code);
              if (validCode) {
                redirectCountry = validCode;
              }
            }
          } else if (geoInfo?.code) {
            // Use IP location if it's a valid country code, otherwise default to Qatar
            const validCode = await getValidCountryCode(geoInfo.code);
            if (validCode) {
              redirectCountry = validCode;
            }
          }
        }
        
        // Track only the initial root visit with both real and redirect country
        await fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            countryCode: geoInfo?.code ? geoInfo.code.toLowerCase() : '--', // Default to -- if no geo
            countryName: geoInfo?.name || '--', // Default to -- if no geo
            userId: user?.id,
            pageType: 'root', // Explicitly mark as root page visit
            page_path: '/', // Record as root visit
            redirect_to: `/${redirectCountry}` // Store where they were redirected
          })
        });

        // Redirect to the country-specific page
        router.push(`/${redirectCountry}`);
      } catch (error) {
        console.error('Error redirecting to country:', error);
        // Default to Egypt if there's an error
        router.push('/eg');
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
