import type { MetadataRoute } from 'next';

const BASE_URL = process.env.APP_URL || 'https://scan2call.com.au';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/settings/',
          '/api/',
          '/scan/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
