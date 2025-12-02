import { Country } from '@/types/supabase';
import { User } from '@supabase/supabase-js';
import { Country as CountryType } from '@/types/supabase';

interface GeolocationResponse {
  country_code: string;
  country_name: string;
}

interface CountryInfo {
  code: string;
  name: string;
}

// Function to get country from IP using a third-party service
export async function getCountryFromIP(): Promise<CountryInfo> {
  try {
    // Using ipapi.co for IP geolocation (free tier has limitations)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data && data.country_code && data.country_name) {
      return {
        code: data.country_code.toLowerCase(),
        name: data.country_name
      };
    }
    
    throw new Error('Could not determine country from IP');
  } catch (error) {
    console.error('Error getting country from IP:', error);
    // Default to Qatar if there's an error
    return {
      code: '--',
      name: '--'
    };
  }
}

// Function to validate if a country code exists in our database
export async function isValidCountryCode(countryCode: string, supabase: any): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('code')
      .eq('code', countryCode.toUpperCase())
      .single();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error validating country code:', error);
    return false;
  }
}

// Function to get country code from user profile
export async function getCountryFromUser(user: User | null, supabase: any): Promise<string | null> {
  if (!user) return null;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('country_id')
      .eq('id', user.id)
      .single();

    if (profile?.country_id) {
      const { data: country } = await supabase
        .from('countries')
        .select('code')
        .eq('id', profile.country_id)
        .single();

      return country?.code?.toLowerCase() || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting country from user profile:', error);
    return null;
  }
}

// Function to get user's country with fallback to IP detection
export async function getUserCountry(countries: CountryType[]): Promise<CountryType | null> {
  try {
    // First try to get country from IP
    const ipInfo = await getCountryFromIP();
    
    if (ipInfo && ipInfo.code !== '--') {
      const country = countries.find(c => c.code.toLowerCase() === ipInfo.code.toLowerCase());
      if (country) {
        return country;
      }
    }
    
    // If IP detection fails, return the first available country as fallback
    return countries.length > 0 ? countries[0] : null;
  } catch (error) {
    console.error('Error in getUserCountry:', error);
    return countries.length > 0 ? countries[0] : null;
  }
}


