import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// List of supported country codes
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'ae', 'kw', 'sy', 'eg']
const DEFAULT_COUNTRY = 'qa' // Default to Qatar if no match found

// Paths that should bypass the middleware
const PUBLIC_PATHS = [
  '/api',
  '/_next',
  '/static',
  '/favicon.ico',
  '/images',
  '/assets',
  '/fonts',
  '/icons',
  '/Mawater974Logo.png',
  '/sitemap.xml',
  '/robots.txt'
]

// File extensions that should bypass the middleware
const FILE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.css',
  '.js',
  '.json',
  '.xml',
  '.txt'
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
  
  // Skip middleware for file extensions
  if (FILE_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return NextResponse.next()
  }
  
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Skip if we already have a country code in the URL
  const pathParts = pathname.split('/').filter(Boolean)
  if (pathParts.length > 0 && SUPPORTED_COUNTRIES.includes(pathParts[0].toLowerCase())) {
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

  // Don't redirect if this is an API request or static file
  if (pathname.startsWith('/api/') || pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
    return NextResponse.next()
  }

  // Create a new URL with the country code
  const url = req.nextUrl.clone()
  url.pathname = `/${countryCode}${pathname === '/' ? '' : pathname}`
  
  // Redirect to the new URL
  const res = NextResponse.redirect(url)
  const supabase = createMiddlewareClient({ req, res })
  await supabase.auth.getSession()
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|images/|assets/|fonts/|icons/|sitemap\.xml|robots\.txt).*)',
  ],
}
