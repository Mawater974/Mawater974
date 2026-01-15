
export default async (request: Request, context: any) => {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";

    // 1. Detect Social Media Bots
    const isBot = /facebookexternalhit|facebookcatalog|facebook|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Discordbot|Slackbot/i.test(ua);

    if (isBot) {
        const pathname = url.pathname;

        // 2. Identify target pages (e.g. /qa/cars/123)
        const carMatch = pathname.match(/\/[a-z]{2}\/cars\/([^\/]+)/i);
        const partMatch = pathname.match(/\/[a-z]{2}\/spare-parts\/([^\/]+)/i);

        if (carMatch || partMatch) {
            const id = carMatch ? carMatch[1] : partMatch![1];
            const type = partMatch ? 'part' : 'car';

            const supabaseUrl = Deno.env.get("SUPABASE_URL");
            const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

            if (!supabaseUrl || !supabaseKey) return;

            let title = "Mawater974 - Premium Marketplace";
            let description = "Buy and sell cars and spare parts.";
            let imageUrl = "https://mawater974.com/og-image.png";

            try {
                if (type === 'car') {
                    const res = await fetch(
                        `${supabaseUrl}/rest/v1/cars?id=eq.${id}&select=year,price,description,brands(name,name_ar),models(name,name_ar),car_images(image_url,is_main),countries(currency_code)`,
                        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
                    );
                    const data = await res.json();
                    if (data && data[0]) {
                        const car = data[0];
                        const brand = car.brands?.name || '';
                        const model = car.models?.name || '';
                        const currency = car.countries?.currency_code || 'QAR';
                        title = `${brand} ${model} ${car.year} | Mawater974`;
                        description = `Price: ${car.price.toLocaleString()} ${currency}. ${car.description?.substring(0, 100) || 'View details.'}`;
                        const mainImg = car.car_images?.find((img: any) => img.is_main) || car.car_images?.[0];
                        if (mainImg) imageUrl = mainImg.image_url;
                    }
                } else {
                    const res = await fetch(
                        `${supabaseUrl}/rest/v1/spare_parts?id=eq.${id}&select=title,price,currency,description,spare_part_images(url,is_primary)`,
                        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
                    );
                    const data = await res.json();
                    if (data && data[0]) {
                        const part = data[0];
                        title = `${part.title} | Mawater974`;
                        description = `Price: ${part.price.toLocaleString()} ${part.currency}. ${part.description?.substring(0, 100) || 'View details.'}`;
                        const mainImg = part.spare_part_images?.find((img: any) => img.is_primary) || part.spare_part_images?.[0];
                        if (mainImg) imageUrl = mainImg.url;
                    }
                }
            } catch (e) {
                console.error("SEO Edge Error:", e);
            }

            const optimizedImageUrl = imageUrl.includes('supabase.co')
                ? `${imageUrl}?width=600&height=315&resize=contain`
                : imageUrl;

            return new Response(
                `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta property="fb:app_id" content="966242223397117">
          <meta property="og:image" content="${optimizedImageUrl}">
          <meta property="og:image:width" content="600">
          <meta property="og:image:height" content="315">
          <meta property="og:type" content="article">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:url" content="https://mawater974.com${pathname}">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${description}">
          <meta name="twitter:image" content="${optimizedImageUrl}">
          <meta http-equiv="refresh" content="0;url=https://mawater974.com${pathname}">
        </head>
        <body>
          <script>window.location.href = "https://mawater974.com${pathname}";</script>
        </body>
        </html>`,
                { headers: { "content-type": "text/html" } }
            );
        }
    }
    return;
};
