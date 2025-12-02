import { Country } from '@/types/supabase';
import { User } from '@supabase/supabase-js';

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
  // Default to Qatar if anything goes wrong
  const defaultCountry = {
    code: 'qa',
    name: 'Qatar'
  };

  try {
    // First try ipapi.co
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data?.country_code && data?.country_name) {
      return {
        code: data.country_code.toLowerCase(),
        name: data.country_name
      };
    }
    
    // If ipapi.co doesn't return valid data, try a fallback service
    const fallbackResponse = await fetch('https://ipapi.co/country/');
    if (fallbackResponse.ok) {
      const countryCode = (await fallbackResponse.text()).trim().toLowerCase();
      if (countryCode && countryCode.length === 2) {
        return {
          code: countryCode,
          name: countryCode.toUpperCase() // Fallback name is just the uppercase code
        };
      }
    }
    
    throw new Error('Could not determine country from IP');
    
  } catch (error) {
    console.error('Error getting country from IP, using default (Qatar):', error);
    return defaultCountry;
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



