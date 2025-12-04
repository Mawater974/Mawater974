import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCountryFromIP } from '@/utils/geoLocation';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Mawater974 - Find Your Perfect Car',
  description: 'Find new and used cars for sale in Qatar, UAE, Saudi Arabia, and more. Browse thousands of listings from trusted dealers and private sellers.',
  alternates: {
    canonical: 'https://mawater974.com',
  },
  openGraph: {
    title: 'Mawater974 - Find Your Perfect Car',
    description: 'Find new and used cars for sale in Qatar, UAE, Saudi Arabia, and more.',
    url: 'https://mawater974.com',
    siteName: 'Mawater974',
    locale: 'en_US',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default async function RootPage() {
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

    // Redirect to the country-specific page
    redirect(`/${countryCode}`);
    
  } catch (error) {
    console.error('Error in root page:', error);
    // Fallback to Qatar if there's an error
    redirect('/qa');
  }
  
  // This will never be reached due to the redirects above
  return null;
}
