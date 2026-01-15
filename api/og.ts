import { NextRequest } from 'next/server';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const originalPath = searchParams.get('path');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    let title = "Mawater974 - Premium Marketplace";
    let description = "Buy and sell cars and spare parts in Qatar.";
    let imageUrl = "https://mawater974.com/logo.png";

    try {
        if (type === 'car') {
            // Fetch car with brand/model names
            const res = await fetch(
                `${supabaseUrl}/rest/v1/cars?id=eq.${id}&select=year,price,description,brands(name,name_ar),models(name,name_ar),car_images(image_url)`,
                { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }
            );
            const data = await res.json();
            if (data && data[0]) {
                const car = data[0];
                const brand = car.brands?.name || '';
                const model = car.models?.name || '';
                title = `${brand} ${model} ${car.year} | Mawater974`;
                description = car.description?.substring(0, 160) || `Price: ${car.price} QAR. View details on Mawater974.`;
                if (car.car_images && car.car_images[0]) {
                    imageUrl = car.car_images[0].image_url;
                }
            }
        } else {
            // Fetch spare part
            const res = await fetch(
                `${supabaseUrl}/rest/v1/spare_parts?id=eq.${id}&select=title,price,description,spare_part_images(url)`,
                { headers: { apikey: supabaseKey!, Authorization: `Bearer ${supabaseKey}` } }
            );
            const data = await res.json();
            if (data && data[0]) {
                const part = data[0];
                title = `${part.title} | Spare Parts | Mawater974`;
                description = part.description?.substring(0, 160) || `Price: ${part.price}. View details on Mawater974.`;
                if (part.spare_part_images && part.spare_part_images[0]) {
                    imageUrl = part.spare_part_images[0].url;
                }
            }
        }
    } catch (e) {
        console.error("SEO Fetch Error:", e);
    }

    // Return a minimal HTML page that bots can read
    return new Response(
        `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta name="description" content="${description}">
      
      <!-- Open Graph -->
      <meta property="og:type" content="article">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${description}">
      <meta property="og:image" content="${imageUrl}">
      <meta property="og:url" content="https://mawater974.com${originalPath}">
      
      <!-- Twitter -->
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${description}">
      <meta name="twitter:image" content="${imageUrl}">

      <!-- Redirect real users if they somehow land here -->
      <meta http-equiv="refresh" content="0;url=${originalPath}">
    </head>
    <body>
      <h1>${title}</h1>
      <img src="${imageUrl}" />
      <p>${description}</p>
      <script>window.location.href = "${originalPath}";</script>
    </body>
    </html>`,
        {
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, s-maxage=3600',
            },
        }
    );
}
