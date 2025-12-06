import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCountryFromIP } from './utils/geoLocation';

const COUNTRY_COOKIE_NAME = 'user_country';
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'sy', 'ae', 'bh', 'kw','om', 'eg'];
const DEFAULT_COUNTRY = 'eg'; // Default to Egypt if country detection fails

// Paths that should skip country redirection
const EXCLUDED_PATHS = [
  '/api',              // API routes
  '/_next',            // Next.js internal
  '/favicon.ico',      // Favicon
  '/images',           // Static images
  '/admin',            // Admin routes
  '/profile', 
  '/notifications',
  '/favorites',
  '/my-ads',
  '/login',
  '/signup',
  '/reset-password',
  '/users',
  '/contact',          // Global contact page
  '/terms',            // Global terms page
  '/privacy',          // Global privacy page
  '/sitemap.xml',      // Sitemap
  '/robots.txt'        // Robots.txt
];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  
  // Skip middleware for excluded paths
  const shouldExclude = EXCLUDED_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  if (shouldExclude) {
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
      setCountryCookie(response, firstPath);
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

  // Remove any existing country code from the path
  let cleanPath = pathname;
  const existingCountryInPath = pathname.split('/')[1]?.toLowerCase();
  if (existingCountryInPath && SUPPORTED_COUNTRIES.includes(existingCountryInPath)) {
    // Remove the country code from the path
    cleanPath = pathname.split('/').slice(2).join('/') || '/';
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  }

  // Create new URL with the new country code and clean path
  const newPathname = `/${countryCode}${cleanPath === '/' ? '' : cleanPath}`;
  const url = req.nextUrl.clone();
  url.pathname = newPathname;

  // Only redirect if not already on the correct path
  if (url.pathname !== pathname) {
    const response = NextResponse.redirect(url);
    setCountryCookie(response, countryCode);
    return response;
  }
  
  // If we're already on the correct path, just ensure the cookie is set
  const response = NextResponse.next();
  if (!req.cookies.get(COUNTRY_COOKIE_NAME)?.value) {
    setCountryCookie(response, countryCode);
  }
  return response;
}

// Helper function to set country cookie
function setCountryCookie(response: NextResponse, countryCode: string) {
  response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, {
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: 'lax',
  });
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Match all request paths except for:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - api routes
    // - public folder
    // - static files
    '/((?!_next/static|_next/image|favicon.ico|api/|images/|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
