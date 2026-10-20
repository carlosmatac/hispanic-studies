import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The site lives under a language segment; the bare root goes to English.
  async redirects() {
    return [{ source: '/', destination: '/en', permanent: false }];
  },
};

export default nextConfig;
