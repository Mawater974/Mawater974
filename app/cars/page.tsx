import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCountryFromIP } from '@/utils/geoLocation';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';

export const metadata: Metadata = {
  title: 'Cars for Sale - Find Your Next Vehicle | Mawater974',
  description: 'Browse thousands of new and used cars for sale in your country. Find great deals on all makes and models from trusted sellers.',
  alternates: {
    canonical: 'https://mawater974.com/cars',
  },
  openGraph: {
    title: 'Cars for Sale - Find Your Next Vehicle | Mawater974',
    description: 'Browse thousands of new and used cars for sale in your country. Find great deals on all makes and models from trusted sellers.',
    url: 'https://mawater974.com/cars',
    siteName: 'Mawater974',
    locale: 'en_US',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default async function CarsPage() {
  try {
    // Get user's country from IP
    const geoInfo = await getCountryFromIP();
    let countryCode = 'qa'; // Default to Qatar

    // Check if we have a valid country code from IP
    if (geoInfo?.code) {
      // Validate if the country code is in our supported countries
      const { data: country } = await supabase
        .from('countries')
        .select('code')
        .eq('code', geoInfo.code.toLowerCase())
        .single();
      
      if (country) {
        countryCode = country.code.toLowerCase();
      }
    }

    // Redirect to the country-specific cars page
    redirect(`/${countryCode}/cars`);
    
  } catch (error) {
    console.error('Error in cars page:', error);
    // Fallback to Qatar if there's an error
    redirect('/qa/cars');
  }
  
  // Show loading spinner while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading cars in your region...</p>
      </div>
    </div>
  );
}
