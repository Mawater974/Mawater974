export interface GeoInfo {
  name: string;
  code: string;
}

export async function getCountryFromIP(): Promise<GeoInfo | null> {
  const API_URL = 'https://ipapi.co/json/';
  
  try {
    console.log('Fetching IP geolocation data from:', API_URL);
    const response = await fetch(API_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mawater974/1.0',
      },
    });
    
    if (!response.ok) {
      console.error(`IP API Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Log the complete response in development
    if (process.env.NODE_ENV !== 'production') {
      console.group('IP Geolocation Data');
      console.log('IP Address:', data.ip);
      console.log('Location:', `${data.city}, ${data.region}, ${data.country_name}`);
      console.log('Coordinates:', `${data.latitude}, ${data.longitude}`);
      console.log('Network:', data.org || 'Unknown');
      console.log('Full Response:', data);
      console.groupEnd();
    }

    if (data.error) {
      console.error('IP API Error:', data.reason || 'Unknown error');
      return null;
    }

    // Return the country information in a consistent format
    const countryInfo = {
      name: data.country_name,
      code: (data.country_code || '').toLowerCase(),
      // Additional useful fields
      city: data.city,
      region: data.region,
      coordinates: data.latitude && data.longitude 
        ? { lat: data.latitude, lng: data.longitude } 
        : null,
      timezone: data.timezone,
      currency: data.currency,
    };

    console.log('Resolved country:', countryInfo);
    return countryInfo;
  } catch (error) {
    console.error('Failed to get country from IP API:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    return null;
  }
}
