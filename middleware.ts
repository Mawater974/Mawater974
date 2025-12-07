// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCountryFromIP } from './utils/getCountryFromIP';

const COUNTRY_COOKIE_NAME = 'user_country';
const COUNTRY_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'sy', 'ae', 'bh', 'kw', 'om', 'eg'];
const DEFAULT_COUNTRY = 'qa';

// Paths excluded from middleware routing
const EXCLUDED_PATHS = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/admin',
  '/profile',
  '/notifications',
  '/favorites',
  '/my-ads',
  '/login',
  '/signup',
  '/reset-password',
  '/users',
  '/contact',
  '/terms',
  '/privacy',
  '/sitemap.xml',
  '/robots.txt'
];

async function detectCountry(request: NextRequest): Promise<string> {
  console.log('\n=== Country Detection Debug ===');
  console.log('Request URL:', request.url);
  console.log('Path:', request.nextUrl.pathname);
  
  // Log all available headers in a readable format
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  console.log('Available headers:', JSON.stringify(headers, null, 2));

  // 1. Try cookie first
  const cookieCountry = request.cookies.get(COUNTRY_COOKIE_NAME)?.value?.toLowerCase();
  console.log('Cookie country:', cookieCountry || 'Not found');
  
  if (cookieCountry && SUPPORTED_COUNTRIES.includes(cookieCountry)) {
    console.log('✅ Using country from cookie:', cookieCountry);
    return cookieCountry;
  }

  // 2. Try various production headers
  const headersToCheck = [
    'x-vercel-ip-country',    // Vercel
    'cf-ipcountry',           // Cloudflare
    'x-country-code',         // Common alternative
    'x-geoip-country',        // Another common alternative
    'x-vercel-ip-country-region', // Vercel region
    'cloudfront-viewer-country'   // AWS CloudFront
  ];

  console.log('\nChecking for country in headers:');
  for (const header of headersToCheck) {
    const value = request.headers.get(header);
    console.log(`- ${header}:`, value || 'Not found');
    
    if (value) {
      const country = value.toLowerCase();
      if (SUPPORTED_COUNTRIES.includes(country)) {
        console.log(`✅ Using country from ${header} header:`, country);
        return country;
      }
    }
  }

  // 3. Fall back to IP detection
  console.log('\n🌐 No country detected from cookie or headers, detecting from IP...');
  try {
    const geoInfo = await getCountryFromIP();
    console.log('IP API response:', JSON.stringify(geoInfo, null, 2));
    
    if (geoInfo && SUPPORTED_COUNTRIES.includes(geoInfo.code)) {
      console.log('✅ Using country from IP detection:', geoInfo.code);
      return geoInfo.code;
    } else if (geoInfo) {
      console.log('⚠️ Detected country not in supported list:', geoInfo.code);
    }
  } catch (error) {
    console.error('❌ IP detection failed:', error);
  }

  // 4. Fall back to default
  console.log('⚠️ Using default country:', DEFAULT_COUNTRY);
  return DEFAULT_COUNTRY;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // Skip excluded paths
  if (EXCLUDED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // Get the first path segment (country code)
  const pathParts = pathname.split('/').filter(Boolean);
  const firstPath = pathParts[0]?.toLowerCase();
  const isCountryPath = firstPath && SUPPORTED_COUNTRIES.includes(firstPath);

  // Get user's country
  const userCountry = await detectCountry(request);

  // If already on the correct country path, continue
  if (isCountryPath && firstPath === userCountry) {
    const response = NextResponse.next();
    // Ensure cookie is set for future requests
    response.cookies.set(COUNTRY_COOKIE_NAME, userCountry, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return response;
  }

  // Build the new URL with the correct country code
  const newPath = `/${userCountry}${pathname === '/' ? '' : pathname}`;
  const newUrl = new URL(newPath, request.url);

  // Don't redirect if we're already on the correct path
  if (newUrl.pathname === pathname) {
    return NextResponse.next();
  }

  console.log(`Redirecting from ${pathname} to ${newUrl.pathname}`);
  const response = NextResponse.redirect(newUrl);
  
  // Set the country cookie - ensure userCountry is always a string
  const countryToSet = userCountry || DEFAULT_COUNTRY;
  response.cookies.set(COUNTRY_COOKIE_NAME, countryToSet, {
    path: '/',
    maxAge: COUNTRY_COOKIE_MAX_AGE,
    sameSite: 'lax',
  });
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|images/|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};