  import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import Navbar from '../components/Navbar'
import AIChatButton from '../components/AIChatButton'
import { GoogleAnalytics } from '@next/third-parties/google'
import { ThemeProvider } from '../contexts/ThemeContext'
import { LanguageProvider } from '../contexts/LanguageContext'
import { CountryProvider } from '../contexts/CountryContext'
import AnalyticsProvider from '../components/AnalyticsProvider'
import { SupabaseProvider } from '@/contexts/SupabaseContext'
import Footer from '@/components/Footer'

// Initialize Font Awesome
config.autoAddCss = false

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
})

// Google Analytics Debug Script
const gaDebugScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-VPPL3CMS1K');

    window.addEventListener('load', function() {
        console.log('Checking GA status...');
        if (window.gtag) {
            console.log('Google Analytics is loaded and ready');
            window.gtag('event', 'test_event', {
                'event_category': 'test',
                'event_label': 'test'
            });
        } else {
            console.log('Google Analytics is not loaded');
        }
    });
`;

// Script to prevent theme flash and handle initial theme
const themeScript = `
  (function() {
    document.documentElement.classList.add('js')
    var darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    function getThemePreference() {
      if(typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme')
      }
      return darkQuery.matches ? 'dark' : 'light'
    }
    
    var theme = getThemePreference()
    
    if(theme === 'dark') {
      document.documentElement.classList.add('dark')
    }
  })()
`

// Script to handle initial language
const languageScript = `
  (function() {
    var lang = localStorage.getItem('language') || 'en'
    document.documentElement.setAttribute('lang', lang)
    if(lang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl')
    }
  })()
`

export const metadata = {
  title: 'Mawater974',
  description: 'Your premier destination for cars',
  icons: {
    icon: '/Mawater974Logo.png',
    shortcut: '/Mawater974Logo.png',
    apple: '/Mawater974Logo.png',
  },
  metadataBase: new URL('https://mawater974.com'),
  openGraph: {
    title: 'Mawater974',
    description: 'Your premier destination for cars',
    images: [{
      url: '/Mawater974Logo.png',
      width: 1200,
      height: 630,
      alt: 'Mawater974 Logo'
    }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mawater974',
    description: 'Your premier destination for cars',
    images: ['/Mawater974Logo.png'],
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageScript }} />
        <script dangerouslySetInnerHTML={{ __html: gaDebugScript }} />
        <GoogleAnalytics gaId="G-VPPL3CMS1K" />
        <meta property="og:title" content={metadata.openGraph.title} />
        <meta property="og:description" content={metadata.openGraph.description} />
        <meta property="og:image" content={metadata.openGraph.images[0].url} />
        <meta property="og:type" content={metadata.openGraph.type} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        {/* Instagram specific */}
        <meta property="og:site_name" content="Mawater974" />
        <meta property="og:image:alt" content="Mawater974 Logo" />
        <meta property="twitter:card" content={metadata.twitter.card} />
        <meta property="twitter:title" content={metadata.twitter.title} />
        <meta property="twitter:description" content={metadata.twitter.description} />
        <meta property="twitter:image" content={metadata.twitter.images[0]} />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SupabaseProvider>
          <LanguageProvider>
            <ThemeProvider>
              <CountryProvider>
                <Providers>
                  <AnalyticsProvider>
                    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                      <Navbar />
                      <main className="flex-grow pt-28 sm:pt-28 md:pt-28 lg:pt-16">
                        {children}
                      </main>
                      <AIChatButton />
                    </div>
                    <Footer/>
                  </AnalyticsProvider>
                </Providers>
              </CountryProvider>
            </ThemeProvider>
          </LanguageProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
