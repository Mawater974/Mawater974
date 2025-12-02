import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// List of supported country codes
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'ae', 'kw', 'sy', 'eg']
const DEFAULT_COUNTRY = 'qa' // Default to Qatar if no match found

// List of paths that should not be redirected
const PUBLIC_PATHS = ['/api', '/_next', '/static', '/favicon.ico']

// Function to get country from IP address
async function getCountryFromIP() {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    return data?.country_code?.toLowerCase() || null
  } catch (error) {
    console.error('Error getting country from IP:', error)
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Skip middleware for API routes, static files, etc.
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    await supabase.auth.getSession()
    return res
  }

  // Skip if we already have a country code in the URL
  const pathParts = pathname.split('/').filter(Boolean)
  if (pathParts.length > 0 && SUPPORTED_COUNTRIES.includes(pathParts[0])) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    await supabase.auth.getSession()
    return res
  }

  // Get country from IP
  let countryCode = await getCountryFromIP()
  
  // If we couldn't determine the country or it's not supported, use default
  if (!countryCode || !SUPPORTED_COUNTRIES.includes(countryCode.toLowerCase())) {
    countryCode = DEFAULT_COUNTRY
  } else {
    countryCode = countryCode.toLowerCase()
  }

  // Create a new URL with the country code
  const url = req.nextUrl.clone()
  url.pathname = `/${countryCode}${pathname === '/' ? '' : pathname}` 

  // Create a response that will redirect to the new URL
  const res = NextResponse.redirect(url)
  
  // Initialize Supabase client with the response
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - images
     * - fonts
     * - assets
     */
    '/((?!api|_next|_vercel|public|images|fonts|assets|favicon\.ico|sitemap\.xml|robots\.txt|sw\.js|workbox-.*\.js|worker-.*\.js|manifest\.webmanifest).*)',
  ],
}
