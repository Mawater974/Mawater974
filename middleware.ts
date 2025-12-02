import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// List of supported country codes
const SUPPORTED_COUNTRIES = ['qa', 'sa', 'ae', 'kw', 'sy', 'eg']
const DEFAULT_COUNTRY = 'qa' // Default to Qatar if no match found

// File extensions that should bypass the middleware
const STATIC_EXTENSIONS = [
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.avif',
  // Fonts
  '.woff', '.woff2', '.ttf', '.eot',
  // Styles
  '.css', '.scss', '.sass', '.less',
  // Scripts
  '.js', '.jsx', '.ts', '.tsx',
  // Data
  '.json', '.xml', '.csv',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // Archives
  '.zip', '.gz', '.tar', '.rar',
  // Other
  '.txt', '.md', '.webmanifest'
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
  
  // Skip middleware for static files and common paths
  if (
    // Skip for all file extensions
    STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext)) ||
    // Skip for Next.js internal paths
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/Mawater974Logo.png' ||
    // Skip for any path that has a file extension
    /\.[^/]+$/.test(pathname)
  ) {
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
  // Only run middleware on the root path and pages that don't have a country code
  matcher: [
    '/',
    '/((?!_next/|api/|static/|images/|assets/|fonts/|icons/|.*\..*).*)',
  ],
}
