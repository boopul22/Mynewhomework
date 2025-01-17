import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/private/',
        '/*.json$',
        '/login',
        '/signup',
        '/reset-password',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
} 