interface GeoInfo {
  name: string;
  code: string;
}

export async function getCountryFromIP(): Promise<GeoInfo | null> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.error) {
      console.error('Error getting country from IP:', data.error);
      return null;
    }

    return {
      name: data.country_name,
      code: data.country_code.toLowerCase()
    };
  } catch (error) {
    console.error('Error getting country from IP:', error);
    return null;
  }
}
