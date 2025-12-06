import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCountryFromIP } from './utils/geoLocation';

const COUNTRY_COOKIE_NAME = 'user_country';
const COUNTRY_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'sy', 'ae', 'bh', 'kw', 'om', 'eg'];
const DEFAULT_COUNTRY = 'eg';

// Paths that should skip country redirection
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

async function detectUserCountry(req: NextRequest): Promise<string> {
  // Check cookie first if available
  const cookieCountry = req.cookies.get(COUNTRY_COOKIE_NAME)?.value;
  if (cookieCountry && SUPPORTED_COUNTRIES.includes(cookieCountry)) {
    return cookieCountry;
  }

  // Try IP detection
  try {
    const geoInfo = await getCountryFromIP();
    if (geoInfo && geoInfo.code && geoInfo.code !== '--') {
      const countryCode = geoInfo.code.toLowerCase();
      
      // If the country is in our supported list, use it (e.g., qa -> qa, ae -> ae)
      // Otherwise, default to 'eg' for all non-supported countries
      return SUPPORTED_COUNTRIES.includes(countryCode) ? countryCode : 'eg';
    }
    
    // Fall back to Cloudflare headers if available
    const cfCountry = req.headers.get('cf-ipcountry')?.toLowerCase();
    if (cfCountry) {
      if (SUPPORTED_COUNTRIES.includes(cfCountry)) {
        return cfCountry;
      }
      // For non-supported countries in Cloudflare headers, default to 'eg'
      return 'eg';
    }
  } catch (error) {
    console.error('Error detecting country:', error);
  }
  
  // Default to Egypt for unknown locations
  return 'eg';
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const pathParts = pathname.split('/').filter(Boolean);
  const firstPath = pathParts[0]?.toLowerCase();
  
  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // If the first path segment is a supported country code
  if (firstPath && SUPPORTED_COUNTRIES.includes(firstPath)) {
    const response = NextResponse.next();
    // Update cookie if different
    if (req.cookies.get(COUNTRY_COOKIE_NAME)?.value !== firstPath) {
      response.cookies.set(COUNTRY_COOKIE_NAME, firstPath, {
        path: '/',
        maxAge: COUNTRY_COOKIE_MAX_AGE,
        sameSite: 'lax',
      });
    }
    return response;
  }

  // For root path or paths without country code, detect country and redirect
  const countryCode = await detectUserCountry(req);
  const newPathname = `/${countryCode}${pathname === '/' ? '' : pathname}`;
  const response = NextResponse.redirect(new URL(newPathname, req.url));
  
  // Set the country cookie
  response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, {
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
