import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Video thumbnails come from YouTube's own image host, resized by next/image.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' }],
  },
  // The site lives under a language segment; the bare root goes to English.
  async redirects() {
    return [{ source: '/', destination: '/en', permanent: false }];
  },
};

export default nextConfig;
