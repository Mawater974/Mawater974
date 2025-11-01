module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://your-site-url.netlify.app',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  exclude: ['/server-sitemap.xml'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
};