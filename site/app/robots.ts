import type { MetadataRoute } from 'next';

/* Everything is open to search engines except the back office (/admin) and the APIs. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }] };
}
