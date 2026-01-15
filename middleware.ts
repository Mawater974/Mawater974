export const config = {
    matcher: ['/:countryCode/cars/:id', '/:countryCode/spare-parts/:id'],
};

export default function middleware(req: Request) {
    const url = new URL(req.url);
    const ua = req.headers.get('user-agent') || '';
    const isBot = /WhatsApp|facebookexternalhit|Twitterbot|LinkedInBot|TelegramBot|Discordbot/i.test(ua);

    if (isBot) {
        const { pathname } = url;

        // Extract ID from path
        const parts = pathname.split('/');
        const id = parts[parts.length - 1];
        const type = pathname.includes('spare-parts') ? 'part' : 'car';

        // Construct the rewrite URL to our API
        const seoUrl = new URL('/api/og', url.origin);
        seoUrl.searchParams.set('id', id);
        seoUrl.searchParams.set('type', type);
        seoUrl.searchParams.set('path', pathname);

        // In Vercel, a rewrite is done via a special header or by returning a fetch
        // But for Edge Middleware, we can just fetch it or use the Rewrite shorthand
        return fetch(seoUrl.toString());
    }

    // Not a bot, continue to the original request (index.html)
}
