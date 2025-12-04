import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCountryFromIP } from './utils/getCountryFromIP';
import { userAgent } from 'next/server';

// List of supported countries and their codes with their respective domains
const SUPPORTED_COUNTRIES = ['qa', 'ae', 'sa', 'sy', 'bh', 'om', 'eg'] as const;
const DEFAULT_COUNTRY = 'qa'; // Default country code (Qatar)

type CountryCode = typeof SUPPORTED_COUNTRIES[number];

// Paths that should not have country code redirection
const EXCLUDED_PATHS = [
  '/',
  '/cars',
  '/api',
  '/_next',
  '/favicon.ico',
  '/images',
  '/admin',
  '/profile',
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
  '/sitemap-index.xml',
  '/robots.txt',
  '/ads.txt',
  '/.well-known',
  '/_vercel',
  '/_error',
  '/404',
  '/500'
];

// List of search engine bot user agents
const SEARCH_ENGINE_BOTS = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebot',
  'ia_archiver',
  'ahrefsbot',
  'semrushbot'
];

// Function to check if the request is from a search engine bot
const isSearchEngineBot = (userAgent: string | null): boolean => {
  if (!userAgent) return false;
  return SEARCH_ENGINE_BOTS.some(bot => 
    userAgent.toLowerCase().includes(bot)
  );
};

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
  const { pathname, search, origin } = req.nextUrl;
  const hostname = req.headers.get('host') || 'mawater974.com';
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = isSearchEngineBot(userAgent);
  
  // Skip middleware for excluded paths
  if (isExcludedPath(pathname)) {
    // Add link headers for search engines on root and /cars
    if (pathname === '/' || pathname === '/cars') {
      const response = NextResponse.next();
      
      // Add hreflang links for search engines
      const links = SUPPORTED_COUNTRIES.map(country => 
        `<${origin}/${country}${pathname === '/' ? '' : pathname}>; rel="alternate"; hreflang="${country}"`
      ).join(',');
      
      response.headers.set('Link', links);
      return response;
    }
    return NextResponse.next();
  }
  
  // Special handling for search engine bots
  if (isBot) {
    // Let search engines index all country-specific pages
    if (hasValidCountryCode(pathname).isValid) {
      const response = NextResponse.next();
      
      // Add canonical URL
      const canonicalUrl = `${origin}${pathname}`;
      response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
      
      // Add hreflang links
      const hreflangLinks = SUPPORTED_COUNTRIES.map(country => {
        const url = country === pathname.split('/')[1] 
          ? `${origin}${pathname}`
          : `${origin}/${country}${pathname.substring(3)}`; // Replace country code
        return `<${url}>; rel="alternate"; hreflang="${country}"`;
      });
      
      // Add x-default hreflang
      hreflangLinks.push(`<${origin}${pathname}>; rel="alternate"; hreflang="x-default"`);
      
      response.headers.set('Link', hreflangLinks.join(','));
      return response;
    }
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
    // - sitemap and robots.txt
    '/((?!_next/static|_next/image|favicon.ico|api/|images/|sitemap|robots\.txt|ads\.txt|\.well-known|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot|xml)$).*)',
  ],
};

// Add custom headers for search engines
const addSearchEngineHeaders = (response: NextResponse, pathname: string, origin: string) => {
  // Add canonical URL
  const canonicalUrl = `${origin}${pathname}`;
  response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
  
  // Add hreflang links for country-specific pages
  if (pathname.match(/^\/[a-z]{2}(\/|$)/)) {
    const hreflangLinks = SUPPORTED_COUNTRIES.map(country => {
      const url = country === pathname.split('/')[1] 
        ? `${origin}${pathname}`
        : `${origin}/${country}${pathname.substring(3)}`; // Replace country code
      return `<${url}>; rel="alternate"; hreflang="${country}"`;
    });
    
    // Add x-default hreflang
    hreflangLinks.push(`<${origin}${pathname}>; rel="alternate"; hreflang="x-default"`);
    
    response.headers.set('Link', hreflangLinks.join(','));
  }
  
  return response;
};