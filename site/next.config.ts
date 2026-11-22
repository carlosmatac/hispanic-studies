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
      // the Collaborate page (issue #93) has a Spanish address; each language keeps its own
      { source: '/es/work-with-us', destination: '/es/colabora', permanent: false },
      { source: '/en/colabora', destination: '/en/work-with-us', permanent: false },
      // the brief's suggested English address, without the language
      { source: '/work-with-us', destination: '/en/work-with-us', permanent: false },
    ];
  },
  async rewrites() {
    return [{ source: '/es/colabora', destination: '/es/work-with-us' }];
  },
};

export default nextConfig;
