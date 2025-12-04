interface GeoInfo {
  name: string;
  code: string;
}

export async function getCountryFromIP(): Promise<GeoInfo | null> {
  try {
    console.log('Fetching country from IP...');
    const response = await fetch('https://ipapi.co/json/');
    
    if (!response.ok) {
      console.error(`IP API responded with status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log('IP API response:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      console.error('Error from IP API:', data.error);
      return null;
    }

    if (!data.country_code) {
      console.error('No country code in response:', data);
      return null;
    }

    const countryInfo = {
      name: data.country_name || 'Unknown',
      code: data.country_code.toLowerCase()
    };
    
    console.log('Detected country:', countryInfo);
    return countryInfo;
    
  } catch (error) {
    console.error('Error in getCountryFromIP:', error);
    return null;
  }
}
