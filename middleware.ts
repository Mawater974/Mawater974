// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COUNTRY_COOKIE_NAME = 'user_country';
const COUNTRY_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'sy', 'ae', 'bh', 'kw', 'om', 'eg'];
const DEFAULT_COUNTRY = 'eg';

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

function detectCountry(request: NextRequest): string {
  console.log('=== Country Detection Debug ===');
  
  // Helper function to normalize country code
  const normalizeCountryCode = (code: string | undefined): string | null => {
    if (!code) return null;
    const normalized = code.toLowerCase();
    return SUPPORTED_COUNTRIES.includes(normalized) ? normalized : null;
  };
  
  // 1. Try cookie
  const cookieCountry = normalizeCountryCode(request.cookies.get(COUNTRY_COOKIE_NAME)?.value);
  console.log('Cookie country:', cookieCountry);
  
  if (cookieCountry) {
    console.log('Using country from cookie:', cookieCountry);
    return cookieCountry;
  }

  // 2. Try Cloudflare/Vercel geo header
  const cfCountryHeader = request.headers.get('cf-ipcountry') || undefined;
  const cfCountry = normalizeCountryCode(cfCountryHeader);
  console.log('Cloudflare country header:', cfCountryHeader, '-> Normalized:', cfCountry);
  
  if (cfCountry) {
    console.log('Using country from header:', cfCountry);
    return cfCountry;
  }

  // 3. Try IP-based detection
  console.log('No country detected from cookie or headers, using default');
  console.log('Request headers:', JSON.stringify(Object.fromEntries(request.headers.entries()), null, 2));
  
  return DEFAULT_COUNTRY;
}

export async function middleware(request: NextRequest) {
  console.log('=== Middleware Executed ===');
  console.log('Path:', request.nextUrl.pathname);
  console.log('User Agent:', request.headers.get('user-agent'));
  console.log('X-Forwarded-For:', request.headers.get('x-forwarded-for'));
  console.log('X-Real-IP:', request.headers.get('x-real-ip'));
  
  const { pathname } = request.nextUrl;

  // Skip excluded paths
  if (EXCLUDED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    console.log('Skipping excluded path:', pathname);
    return NextResponse.next();
  }

  const pathParts = pathname.split('/').filter(Boolean);
  const firstPath = pathParts[0]?.toLowerCase();

  // If path already starts with a country (e.g., /qa/home)
  const normalizedFirstPath = firstPath?.toLowerCase();
  if (normalizedFirstPath && SUPPORTED_COUNTRIES.includes(normalizedFirstPath)) {
    const res = NextResponse.next();
    // Always store country code in lowercase
    res.cookies.set(COUNTRY_COOKIE_NAME, normalizedFirstPath, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  // Otherwise detect country and redirect
  const userCountry = detectCountry(request);

  const newUrl = new URL(
    `/${userCountry}${pathname === '/' ? '' : pathname}`,
    request.url
  );

  const response = NextResponse.redirect(newUrl);

  response.cookies.set(COUNTRY_COOKIE_NAME, userCountry, {
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
