export interface GeoInfo {
  name: string;
  code: string;
}

export async function getCountryFromIP(): Promise<GeoInfo | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    // Log all data received from ipapi.co/json
    console.log('Full IP API Response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('Error from IP API:', data.error);
      return null;
    }

    // Log individual fields for easier inspection
    console.log('IP:', data.ip);
    console.log('City:', data.city);
    console.log('Region:', data.region);
    console.log('Country Code:', data.country_code);
    console.log('Country Name:', data.country_name);
    console.log('Continent Code:', data.continent_code);
    console.log('Postal Code:', data.postal);
    console.log('Latitude:', data.latitude);
    console.log('Longitude:', data.longitude);
    console.log('Timezone:', data.timezone);
    console.log('Currency:', data.currency);
    console.log('Languages:', data.languages);

    return {
      name: data.country_name,
      code: data.country_code?.toLowerCase()
    };
  } catch (error) {
    console.error('Failed to get country from IP API:', error);
    return null;
  }
}
