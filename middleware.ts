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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  // Extract the first path segment as potential country code
  const pathParts = pathname.split('/').filter(Boolean);
  const firstPath = pathParts[0]?.toLowerCase();

  // If the path already starts with a supported country code
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

  // Try to detect country from IP if no valid country in URL
  let countryCode = req.cookies.get(COUNTRY_COOKIE_NAME)?.value;

  if (!countryCode || !SUPPORTED_COUNTRIES.includes(countryCode)) {
    try {
      const geoInfo = await getCountryFromIP();
      if (geoInfo && SUPPORTED_COUNTRIES.includes(geoInfo.code.toLowerCase())) {
        countryCode = geoInfo.code.toLowerCase();
      } else {
        // Fall back to Cloudflare headers if available
        const cfCountry = req.headers.get('cf-ipcountry')?.toLowerCase();
        countryCode = cfCountry && SUPPORTED_COUNTRIES.includes(cfCountry) 
          ? cfCountry 
          : DEFAULT_COUNTRY;
      }
    } catch (error) {
      console.error('Error detecting country:', error);
      countryCode = DEFAULT_COUNTRY;
    }
  }

  // Create new URL with the country code
  const newPathname = `/${countryCode}${pathname === '/' ? '' : pathname}`;
  const url = req.nextUrl.clone();
  url.pathname = newPathname;

  // Only redirect if not already on the correct path
  if (url.pathname !== pathname) {
    const response = NextResponse.redirect(url);
    response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return response;
  }
  
  // If we're already on the correct path, just ensure the cookie is set
  const response = NextResponse.next();
  if (!req.cookies.get(COUNTRY_COOKIE_NAME)?.value) {
    response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|images/|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
