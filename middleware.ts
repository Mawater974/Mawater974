import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCountryFromIP } from './utils/getCountryFromIP';

// List of supported countries and their codes
const SUPPORTED_COUNTRIES = ['qa', 'ae', 'sa', 'sy']; // Add more country codes as needed
const DEFAULT_COUNTRY = 'qa'; // Default country code (Qatar)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const pathParts = pathname.split('/').filter(Boolean);
  
  // Check if the path already starts with a country code
  const hasCountryInPath = pathParts.length > 0 && SUPPORTED_COUNTRIES.includes(pathParts[0].toLowerCase());
  
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
