import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// List of supported country codes
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'ae', 'kw', 'sy', 'eg']
const DEFAULT_COUNTRY = 'qa' // Default to Qatar if no match found

// List of paths that should not be redirected
const PUBLIC_PATHS = [
  '/api',
  '/_next',
  '/static',
  '/favicon.ico',
  '/images',
  '/assets',
  '/fonts',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.json',
  '/sw.js',
  '/workbox-',
  '/worker-',
  '/Mawater974Logo.png',
  '/Mawater974LogoWhite.png',
  '/Mawater974LogoBlack.png'
]

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
  
  // Debug log for all requests
  console.log('Middleware processing:', pathname)
  
  // Skip middleware for API routes, static files, etc.
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path))
  if (isPublicPath) {
    console.log('Skipping middleware for public path:', pathname)
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

// Only run middleware on document requests (not for static files, images, etc.)
export const config = {
  matcher: [
    /*
     * Match all document requests (HTML) that don't start with:
     * - api (API routes)
     * - _next (Next.js internals)
     * - static (static files)
     * - favicon.ico
     * - images/
     * - assets/
     * - fonts/
     * - sitemap.xml
     * - robots.txt
     * - manifest files
     * - service worker files
     * - image files
     * - font files
     */
    '/((?!api|_next|static|favicon.ico|images|assets|fonts|sitemap|robots.txt|manifest|sw|workbox|worker-|Mawater974Logo\.(png|svg|jpg|jpeg|webp|gif)|.*\.(css|js|json|txt|ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|otf)$).*)',
  ],
}
