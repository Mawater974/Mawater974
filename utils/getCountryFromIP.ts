export interface GeoInfo {
  name: string;
  code: string;
}

export async function getCountryFromIP(request?: Request): Promise<GeoInfo | null> {
  try {
    let ipAddress: string | null = null;
    
    // Get the client IP from Netlify's header if available
    if (request) {
      const headers = request.headers || new Headers();
      ipAddress = headers.get('x-nf-client-connection-ip') || 
                 headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                 headers.get('cf-connecting-ip');
      console.log('Detected client IP:', ipAddress);
    }

    const apiUrl = ipAddress 
      ? `https://ipapi.co/${ipAddress}/json/`
      : 'https://ipapi.co/json/';

    console.log('Fetching country data from IP API:', apiUrl);
    const response = await fetch(apiUrl);
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
      region: data.region,
      isProxy: !!ipAddress
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
