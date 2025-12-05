import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCountryFromIP } from './utils/getCountryFromIP';

const COUNTRY_COOKIE_NAME = 'user_country';
const SESSION_COOKIE_NAME = 'session_id';
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

// List of supported countries and their codes (lowercase for case-insensitive matching)
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'sy', 'ae', 'bh', 'om', 'eg'];
const DEFAULT_COUNTRY = 'eg'; // Default country code (Egypt)

// Paths that should not have country code redirection
const EXCLUDED_PATHS = [
  '/api',          // API routes
  '/_next',        // Next.js internal
  '/favicon.ico',  // Favicon
  '/images',       // Static images
  '/admin',        // Admin routes
  '/profile', 
  '/notifications',
  '/favorites',
  '/my-ads',
  '/login',
  '/signup',
  '/reset-password',
  '/${country.code.toLowerCase()}',
  '/users',
  '/contact',      // Global contact page
  '/terms',        // Global terms page
  '/privacy',      // Global privacy page
  '/sitemap.xml',  // Sitemap
  '/robots.txt'    // Robots.txt
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for excluded paths
  const shouldExclude = EXCLUDED_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  if (shouldExclude) {
    return NextResponse.next();
  }

  // Get or create session ID
  let sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isNewSession = !sessionId;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  const pathParts = pathname.split('/').filter(Boolean);
  const firstPath = pathParts[0]?.toLowerCase();
  
  // Check if the path already starts with a supported country code
  if (firstPath && SUPPORTED_COUNTRIES.includes(firstPath.toLowerCase())) {
    // Update the country cookie if it's different
    const currentCountry = req.cookies.get(COUNTRY_COOKIE_NAME)?.value;
    if (currentCountry !== firstPath || isNewSession) {
      const response = NextResponse.next();
      
      // Set country cookie
      response.cookies.set(COUNTRY_COOKIE_NAME, firstPath, {
        path: '/',
        maxAge: SESSION_DURATION,
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      
      // Set session cookie if new session
      if (isNewSession) {
        response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
          path: '/',
          maxAge: SESSION_DURATION,
          sameSite: 'lax',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        });
      }
      
      return response;
    }
    
    // If it's a root path with country code (e.g., /qa), ensure it has a trailing slash
    if (pathname === `/${firstPath}`) {
      const url = req.nextUrl.clone();
      url.pathname = `${pathname}/`;
      // If we reach here and need to update cookies (but no redirect was needed)
  if (shouldUpdateCookies) {
    const response = NextResponse.next();
    
    // Set country cookie
    response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, {
      path: '/',
      maxAge: SESSION_DURATION,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
    
    // Set session cookie if new session
    if (isNewSession) {
      response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
        path: '/',
        maxAge: SESSION_DURATION,
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
    }
    
    return response;
  }
  
  return NextResponse.next();
    }
    return NextResponse.next();
  }

  // Check for existing country cookie first
  const cookieCountry = req.cookies.get(COUNTRY_COOKIE_NAME)?.value;
  let countryCode = cookieCountry;
  let shouldUpdateCookies = isNewSession;
  
  // Only detect country if we don't have a valid cookie or it's a new session
  if (!cookieCountry || !SUPPORTED_COUNTRIES.includes(cookieCountry.toLowerCase()) || isNewSession) {
    try {
      const geoInfo = await getCountryFromIP();
      const detectedCountry = geoInfo?.code?.toLowerCase();
      
      // Only use detected country if it's in our supported list
      if (detectedCountry && SUPPORTED_COUNTRIES.includes(detectedCountry)) {
        countryCode = detectedCountry;
        shouldUpdateCookies = true;
      } else {
        // If detected country is not supported, check the request headers for Cloudflare country
        const cfCountry = req.headers.get('cf-ipcountry')?.toLowerCase();
        if (cfCountry && SUPPORTED_COUNTRIES.includes(cfCountry)) {
          countryCode = cfCountry;
          shouldUpdateCookies = true;
        } else if (!cookieCountry) {
          // Fallback to default country only if we don't have a cookie
          countryCode = DEFAULT_COUNTRY;
          shouldUpdateCookies = true;
        }
      }
    } catch (error) {
      console.error('Error detecting country from IP:', error);
      // Fall back to Cloudflare headers if available
      const cfCountry = req.headers.get('cf-ipcountry')?.toLowerCase();
      if (cfCountry && SUPPORTED_COUNTRIES.includes(cfCountry)) {
        countryCode = cfCountry;
        shouldUpdateCookies = true;
      } else if (!cookieCountry) {
        // Fallback to default country only if we don't have a cookie
        countryCode = DEFAULT_COUNTRY;
        shouldUpdateCookies = true;
      }
    }
  }

  // If we need to redirect to add the country code
  if (countryCode && !pathname.startsWith(`/${countryCode}`) && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    // Preserve query parameters
    const searchParams = new URLSearchParams(req.nextUrl.search);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    // Create new URL with country code
    const newPathname = `/${countryCode}${pathname === '/' ? '' : pathname}${queryString}`;
    
    // Only create a new response if we need to update cookies
    if (shouldUpdateCookies) {
      const response = NextResponse.redirect(new URL(newPathname, req.url));
      
      // Set country cookie
      response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, {
        path: '/',
        maxAge: SESSION_DURATION,
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      
      // Set session cookie if new session
      if (isNewSession) {
        response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
          path: '/',
          maxAge: SESSION_DURATION,
          sameSite: 'lax',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
        });
      }
      
      return response;
    }
    
    return NextResponse.redirect(new URL(newPathname, req.url));
  }

  // Only redirect if not already on the correct path
  if (url.pathname !== pathname) {
    const response = NextResponse.redirect(url);
    // Set the country cookie when redirecting
    response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
    });
    return response;
  }
  
  const response = NextResponse.next();
  // Ensure the cookie is set even if no redirect happens
  if (!req.cookies.get(COUNTRY_COOKIE_NAME)?.value) {
    response.cookies.set(COUNTRY_COOKIE_NAME, countryCode, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'lax',
    });
  }
  return response;
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
    // - image files
    // - fonts
    '/((?!_next/static|_next/image|favicon.ico|api/|images/|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
