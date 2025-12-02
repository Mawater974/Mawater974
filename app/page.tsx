'use client';

import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCountryFromIP, isValidCountryCode } from '@/utils/geoLocation';

// Simple error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Root page error:', error);
    // Default to Qatar on error
    window.location.href = '/qa';
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We're having trouble determining your location. Redirecting you to our Qatar site...
        </p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
};

// Track if we've already attempted redirection
let hasRedirected = false;

function RootPageContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Reset error state
  const resetError = () => {
    setError(null);
    hasRedirected = false;
    redirectToCountry();
  };

  // Show error boundary if there's an error
  if (error) {
    return <ErrorFallback error={error} resetErrorBoundary={resetError} />;
  }

  const redirectToCountry = async () => {
    // Prevent multiple redirects
    if (hasRedirected) return;
    hasRedirected = true;
    
    try {
        // Always get the real location from IP first
        const geoInfo = await getCountryFromIP();
        let redirectCountry = 'qa'; // Default to Qatar
        
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
            }
          } else {
            // Use IP location if valid, otherwise default to Qatar
            const isValid = await isValidCountryCode(geoInfo.code, supabase);
            redirectCountry = isValid ? geoInfo.code.toLowerCase() : 'qa';
          }
        }
        
        // Track only the initial root visit with both real and redirect country
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
          console.error('Analytics error (non-fatal):', analyticsError);
          // Don't block redirection for analytics errors
        }

        // Redirect to the country-specific page
        router.push(`/${redirectCountry}`);
      } catch (error) {
        console.error('Error redirecting to country:', error);
        // Default to Qatar if there's an error
        router.push('/qa');
      } finally {
        setIsLoading(false);
      }
    };
    
    redirectToCountry();
  
  useEffect(() => {
    redirectToCountry();
    
    // Add a safety timeout to ensure we don't get stuck loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Redirection taking too long, forcing redirect to Qatar');
        window.location.href = '/qa';
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [user, profile]); // Removed router from dependencies to prevent re-renders

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-400">{t('auth.loading.redirect')}</p>
        <p className="text-sm text-gray-500 mt-2">If you're not redirected, <a href="/qa" className="text-blue-600 hover:underline">click here</a> to continue to our Qatar site.</p>
      </div>
    </div>
  );
}

export default function RootPage() {
  const [error, setError] = useState<Error | null>(null);
  
  if (error) {
    return <ErrorFallback error={error} resetErrorBoundary={() => setError(null)} />;
  }
  
  return (
    <ErrorBoundary 
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <ErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
      )}
      onError={(error) => {
        console.error('Error in RootPage:', error);
        setError(error);
      }}
    >
      <RootPageContent />
    </ErrorBoundary>
  );
}
