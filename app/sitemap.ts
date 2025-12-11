import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://mawater974.com'

  // Only include homepage, /cars, and /showrooms for search engines
  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1
    },
    {
      url: `${baseUrl}/cars`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${baseUrl}/showrooms`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7
    }
  ]
}
