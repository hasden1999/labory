/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  async rewrites() {
    if (API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${API_URL}/:path*`,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
