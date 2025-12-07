export interface GeoInfo {
  name: string;
  code: string;
}

export async function getCountryFromIP(): Promise<GeoInfo | null> {
  const startTime = Date.now();
  console.log('🌍 Starting IP geolocation lookup...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    console.log('🔍 Fetching from ipapi.co...');
    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'mawater974-middleware/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📡 Raw API response:', JSON.stringify(data, null, 2));

    if (data.error) {
      console.error('❌ Error from IP API:', data.error);
      return null;
    }

    const countryCode = (data.country_code || '').toLowerCase();
    const countryName = data.country_name || 'Unknown';
    
    console.log('📍 Detected location:', { 
      ip: data.ip,
      country: `${countryName} (${countryCode})`,
      city: data.city,
      region: data.region,
      isp: data.org || data.asn,
      responseTime: `${Date.now() - startTime}ms`
    });
    
    if (!countryCode) {
      console.warn('⚠️ No country code found in API response');
      return null;
    }
    
    return {
      name: countryName,
      code: countryCode
    };
  } catch (error) {
    console.error('❌ IP geolocation failed:', error);
    
    // Try fallback API if the primary one fails
    try {
      console.log('🔄 Trying fallback API (ip-api.com)...');
      const fallbackResponse = await fetch('http://ip-api.com/json/', {
        signal: AbortSignal.timeout(3000)
      });
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData && fallbackData.countryCode) {
        console.log('✅ Fallback API success:', fallbackData.country);
        return {
          name: fallbackData.country,
          code: fallbackData.countryCode.toLowerCase()
        };
      }
    } catch (fallbackError) {
      console.error('❌ Fallback API also failed:', fallbackError);
    }
    
    return null;
  }
}
