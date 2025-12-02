import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of supported country codes
const supportedCountries = ['ae', 'qa', 'sa', 'kw', 'bh', 'om']
const defaultCountry = 'ae' // Default country code

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip API routes, _next/static, _next/image, and favicon.ico
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  // Check if the path already has a country code
  const pathParts = pathname.split('/').filter(Boolean)
  const maybeCountryCode = pathParts[0]?.toLowerCase()
  
  // If the first part is a valid country code, continue
  if (maybeCountryCode && supportedCountries.includes(maybeCountryCode)) {
    const response = NextResponse.next()
    // Set the country code in a cookie for future reference
    response.cookies.set('country', maybeCountryCode, { path: '/', maxAge: 60 * 60 * 24 * 30 }) // 30 days
    return response
  }

  // Get the country from cookie or use default
  const countryCookie = req.cookies.get('country')?.value
  const country = countryCookie && supportedCountries.includes(countryCookie) 
    ? countryCookie 
    : defaultCountry

  // Redirect to the country-specific URL
  const newUrl = new URL(`/${country}${pathname}`, req.url)
  
  // For the root path, we don't need to redirect if already on root
  if (pathname === '/' && !maybeCountryCode) {
    return NextResponse.redirect(newUrl)
  }
  
  // For other paths, redirect to include the country code
  return NextResponse.redirect(newUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|static/).*)',
  ],
}
