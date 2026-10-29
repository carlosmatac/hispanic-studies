import type { MetadataRoute } from 'next';

/* Everything is open to search engines except the CMS (/keystatic) and the APIs. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/keystatic', '/api/'] }] };
}
