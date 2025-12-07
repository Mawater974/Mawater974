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

function detectCountry(req: NextRequest): string {
  // 1. Try cookie
  const cookieCountry = req.cookies.get(COUNTRY_COOKIE_NAME)?.value;
  if (cookieCountry && SUPPORTED_COUNTRIES.includes(cookieCountry)) {
    return cookieCountry;
  }

  // 2. Try Cloudflare/Vercel geo header
  const cfCountry = req.headers.get('cf-ipcountry')?.toLowerCase();
  if (cfCountry) {
    return SUPPORTED_COUNTRIES.includes(cfCountry)
      ? cfCountry
      : DEFAULT_COUNTRY;
  }

  // 3. Default
  return DEFAULT_COUNTRY;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip excluded paths
  if (EXCLUDED_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const pathParts = pathname.split('/').filter(Boolean);
  const firstPath = pathParts[0]?.toLowerCase();

  // If path already starts with a country (e.g., /qa/home)
  if (firstPath && SUPPORTED_COUNTRIES.includes(firstPath)) {
    const res = NextResponse.next();
    res.cookies.set(COUNTRY_COOKIE_NAME, firstPath, {
      path: '/',
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
    return res;
  }

  // Otherwise detect country and redirect
  const userCountry = detectCountry(req);

  const newUrl = new URL(
    `/${userCountry}${pathname === '/' ? '' : pathname}`,
    req.url
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
