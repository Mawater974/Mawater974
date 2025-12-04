import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCountryFromIP } from './utils/getCountryFromIP';

// List of supported countries and their codes with their respective domains
const SUPPORTED_COUNTRIES = ['qa', 'ae', 'sa', 'sy', 'bh', 'om', 'eg'] as const;
const DEFAULT_COUNTRY = 'qa'; // Default country code (Qatar)

type CountryCode = typeof SUPPORTED_COUNTRIES[number];

// Paths that should not have country code redirection
const EXCLUDED_PATHS = [
  '/',             // Root domain
  '/cars',         // Main cars page (will show in search results)
  '/api',          // API routes
  '/_next',        // Next.js internal
  '/favicon.ico',  // Favicon
  '/images',       // Static images
  '/admin',        // Admin routes
  '/profile',
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

// Check if the path should be excluded from country code routing
const isExcludedPath = (path: string): boolean => {
  return EXCLUDED_PATHS.some(excludedPath => 
    path === excludedPath || path.startsWith(`${excludedPath}/`)
  );
};

// Check if the path already has a valid country code
const hasValidCountryCode = (path: string): { isValid: boolean; countryCode?: CountryCode } => {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return { isValid: false };
  
  const potentialCode = segments[0].toLowerCase();
  if (SUPPORTED_COUNTRIES.includes(potentialCode as CountryCode)) {
    return { isValid: true, countryCode: potentialCode as CountryCode };
  }
  
  return { isValid: false };
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  
  // Skip middleware for excluded paths
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }
  
  // Check if the path already has a valid country code
  const { isValid: hasCountryCode, countryCode: existingCountryCode } = hasValidCountryCode(pathname);
  
  // If it's a direct domain access (no country code in path) and not an excluded path
  if (!hasCountryCode && pathname !== '/' && pathname !== '/cars') {
    let countryCode: string = DEFAULT_COUNTRY;
    
    try {
      // Get country from IP address
      const ipCountry = await getCountryFromIP(req);
      
      // If we got a valid country code from IP and it's in our supported countries
      if (ipCountry && SUPPORTED_COUNTRIES.includes(ipCountry.toLowerCase() as CountryCode)) {
        countryCode = ipCountry.toLowerCase();
      }
    } catch (error) {
      console.error('Error getting country from IP:', error);
      // Fall back to default country if there's an error
    }
    
    // Create new URL with country code
    const url = req.nextUrl.clone();
    
    // Remove leading slash if present
    const cleanPath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
    
    // Build the new path with country code
    url.pathname = `/${countryCode}${cleanPath ? `/${cleanPath}` : ''}`;
    
    // Preserve query parameters
    url.search = search;
    
    return NextResponse.redirect(url);
  }
  
  // If we have a valid country code, ensure it's in the correct case
  if (existingCountryCode) {
    const segments = pathname.split('/').filter(Boolean);
    const currentCode = segments[0];
    
    if (currentCode !== existingCountryCode) {
      // Fix the case of the country code if needed
      segments[0] = existingCountryCode;
      const newPath = `/${segments.join('/')}`;
      
      const url = req.nextUrl.clone();
      url.pathname = newPath;
      url.search = search;
      
      return NextResponse.redirect(url);
    }
  }
  
  // Continue with the request if no redirection is needed
  return NextResponse.next();
  
  // Skip middleware for excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const pathParts = pathname.split('/').filter(Boolean);
  
  // Check if the path already starts with a country code
  const hasCountryInPath = pathParts.length > 0 && 
    SUPPORTED_COUNTRIES.includes(pathParts[0].toLowerCase());
  
  // If the path already has a country code, don't redirect
  if (hasCountryInPath) {
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

  // Create new URL with country code
  const newPathname = `/${countryCode}${pathname === '/' ? '' : pathname}`;
  const url = req.nextUrl.clone();
  url.pathname = newPathname;

  // Redirect to the new URL
  return NextResponse.redirect(url);
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