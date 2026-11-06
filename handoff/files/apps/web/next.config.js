/** @type {import('next').NextConfig} */
const path = require('path');
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

// SECURITY: never trace local runtime data, temp directories, or secrets into the standalone bundle.
// `data/` holds patient stores, SQLite databases, backups and local device state.
const SENSITIVE_TRACE_PATTERNS = [
  '**/apps/web/data/**/*',
  '**/apps/server/prisma/**/*.db',
  '**/apps/server/prisma/**/*.db-*',
  '**/apps/server/prisma/**/*.db.*',
  '**/apps/desktop/**/data/**/*',
  '**/apps/desktop/**/standalone/**/data/**/*',
  '**/.env',
  '**/.env.*',
  '**/AppData/**/*',
  '**/Temp/**/*',
  '**/*.tmp',
];

const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
    outputFileTracingRoot: path.join(__dirname, '../../'),
    outputFileTracingIgnores: SENSITIVE_TRACE_PATTERNS,
    outputFileTracingExcludes: {
      '*': SENSITIVE_TRACE_PATTERNS,
    },
  },
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
