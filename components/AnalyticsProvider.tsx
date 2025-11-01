'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const GA_TRACKING_ID = 'G-VPPL3CMS1K';

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', GA_TRACKING_ID, {
        send_page_view: false // Disable automatic page views
      });
    } catch (error) {
      // Silently fail if analytics is blocked
      console.debug('Analytics blocked or failed to load');
    }
  }, []);

  return (
    <>
      <Script
        id="gtag-base"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){try{dataLayer.push(arguments);}catch(e){}}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        onError={() => {
          console.debug('Analytics blocked or failed to load');
        }}
      />
      {children}
    </>
  );
}
