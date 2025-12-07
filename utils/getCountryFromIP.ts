export interface GeoInfo {
  name: string;
  code: string;
}

export async function getCountryFromIP(): Promise<GeoInfo | null> {
  try {
    console.log('Fetching country from IP API...');
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    // Log all data received from ipapi.co/json
    console.log('Full IP API Response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('Error from IP API:', data.error);
      return null;
    }

    // Ensure country code is lowercase and handle potential undefined
    const countryCode = data.country_code?.toLowerCase() || '';
    const countryName = data.country_name || 'Unknown';
    
    console.log('Processed country code:', countryCode);
    console.log('Country name:', countryName);
    console.log('IP:', data.ip);
    console.log('City:', data.city);
    console.log('Region:', data.region);
    console.log('Continent Code:', data.continent_code);
    console.log('Currency:', data.currency);

    return {
      name: countryName,
      code: countryCode
    };
  } catch (error) {
    console.error('Failed to get country from IP API:', error);
    return null;
  }
}
