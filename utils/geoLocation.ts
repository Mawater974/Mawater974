import { Country } from '@/types/supabase';
import { User } from '@supabase/supabase-js';

interface CachedGeoData {
  data: CountryInfo;
  timestamp: number;
}

interface GeolocationResponse {
  country_code: string;
  country_name: string;
  error?: boolean;
  reason?: string;
}

interface CountryInfo {
  code: string;
  name: string;
}

// Cache for IP lookups
const ipCache = new Map<string, CachedGeoData>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const IPAPI_URL = 'https://ipapi.co/json';
const REQUEST_TIMEOUT = 3000; // 3 seconds

/**
 * Get country information from IP address with caching
 * @param ip Optional IP address (defaults to client IP if not provided)
 * @returns Promise with country info or default values
 */
export async function getCountryFromIP(ip?: string): Promise<CountryInfo> {
  const cacheKey = ip || 'default';
  const cached = ipCache.get(cacheKey);
  
  // Return cached result if still valid
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Create a timeout promise to avoid hanging on slow responses
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT);
    });

    // Make the API request
    const url = ip ? `${IPAPI_URL}/${ip}/json/` : IPAPI_URL;
    const fetchPromise = fetch(url, {
      headers: { 'User-Agent': 'Mawater974/1.0' }
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`IP API responded with ${response.status}`);
    }

    const data: GeolocationResponse = await response.json();
    
    // Check for API errors
    if (data.error) {
      throw new Error(data.reason || 'Error from IP API');
    }
    
    if (!data.country_code || !data.country_name) {
      throw new Error('Invalid response from IP API');
    }

    const result = {
      code: data.country_code.toLowerCase(),
      name: data.country_name
    };

    // Cache the result
    ipCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('Error getting country from IP:', error);
    // Return default values that will be handled by the caller
    return {
      code: '--',
      name: 'Unknown'
    };
  }
}

/**
 * Validate if a country code exists in our database
 */
export async function isValidCountryCode(countryCode: string, supabase: any): Promise<boolean> {
  if (!countryCode) return false;
  
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



