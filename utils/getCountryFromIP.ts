export interface GeoInfo {
  name: string;
  code: string;
}

export async function getCountryFromIP(): Promise<GeoInfo | null> {
  try {
    console.log('Fetching country data from IP API...');
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    if (data.error) {
      console.error('Error from IP API:', data.error);
      return null;
    }

    const countryCode = data.country_code?.toLowerCase() || '';
    const countryName = data.country_name || 'Unknown';
    
    console.log('Detected country from IP:', { 
      ip: data.ip,
      countryCode, 
      countryName,
      city: data.city,
      region: data.region
    });
    
    return {
      name: countryName,
      code: countryCode
    };
  } catch (error) {
    console.error('Failed to get country from IP API:', error);
    return null;
  }
}
