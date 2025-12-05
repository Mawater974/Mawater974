import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCountryFromIP } from './utils/getCountryFromIP';

// List of supported countries and their codes
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'sy', 'ae', 'bh', 'om', 'eg'];
const DEFAULT_COUNTRY = 'qa'; // Default country code (UAE)

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
  '/users',
  '/contact',      // Global contact page
  '/terms',        // Global terms page
  '/privacy',      // Global privacy page
  '/sitemap.xml',  // Sitemap
  '/robots.txt'    // Robots.txt
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

  const pathParts = pathname.split('/').filter(Boolean);
  const firstPath = pathParts[0]?.toLowerCase();
  
  // Check if the path already starts with a supported country code
  if (firstPath && SUPPORTED_COUNTRIES.includes(firstPath)) {
    return NextResponse.next();
  }

  // Get user's country from IP
  let countryCode = DEFAULT_COUNTRY;
  try {
    const geoInfo = await getCountryFromIP();
    if (geoInfo && SUPPORTED_COUNTRIES.includes(geoInfo.code.toLowerCase())) {
      countryCode = geoInfo.code.toLowerCase();
    }
  } catch (error) {
    console.error('Error detecting country from IP:', error);
  }

  // Preserve query parameters
  const searchParams = new URLSearchParams(search);
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
  
  // Create new URL with country code
  const newPathname = `/${countryCode}${pathname === '/' ? '' : pathname}${queryString}`;
  const url = req.nextUrl.clone();
  url.pathname = newPathname;

  // Only redirect if not already on the correct path
  if (url.pathname !== pathname) {
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
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