
export default async function middleware(req: Request) {
    const url = new URL(req.url);
    const ua = req.headers.get('user-agent') || '';

    // 1. More aggressive bot detection
    const isBot = /facebookexternalhit|facebookcatalog|facebook|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Discordbot|Slackbot/i.test(ua);

    if (isBot) {
        const pathname = url.pathname;

        // 2. Identify target pages
        const isCarPage = pathname.match(/\/[a-z]{2}\/cars\/([^\/]+)/i);
        const isPartPage = pathname.match(/\/[a-z]{2}\/spare-parts\/([^\/]+)/i);

        if (isCarPage || isPartPage) {
            const parts = pathname.split('/').filter(Boolean);
            const id = parts[parts.length - 1];
            const type = isPartPage ? 'part' : 'car';

            // 3. Construct absolute URL for the API fetch
            const host = req.headers.get('host') || 'mawater974.com';
            const protocol = req.headers.get('x-forwarded-proto') || 'https';
            const seoUrl = new URL('/api/og', `${protocol}://${host}`);

            seoUrl.searchParams.set('id', id);
            seoUrl.searchParams.set('type', type);
            seoUrl.searchParams.set('path', pathname);

            // Force fetch the dynamic SEO response
            return fetch(seoUrl.toString(), {
                headers: { 'User-Agent': ua }
            });
        }
    }

    // Proceed for normal users
    return;
}

// Ensure middleware runs on all page requests
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - .png, .jpg (images)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
