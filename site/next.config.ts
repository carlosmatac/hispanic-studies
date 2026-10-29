import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // the back office saves a whole text at once (Acosta's is ~1 MB); Vercel takes up to 4.5 MB a request
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  // Video thumbnails come from YouTube's own image host, resized by next/image.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }],
  },
  // The site lives under a language segment; the bare root goes to English.
  async redirects() {
    return [
      { source: '/', destination: '/en', permanent: false },
      // the canon became the archive (2026-10-29); the browser keeps the #T030 of old links
      { source: '/:lang(en|es)/canon', destination: '/:lang/archive', permanent: true },
    ];
  },
};

export default nextConfig;
