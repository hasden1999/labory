/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

// SECURITY: never trace local runtime data or secrets into the standalone bundle.
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
    // Applied by @vercel/nft while tracing each page. This is the only variant that
    // reliably matches on Windows, because nft compares POSIX-normalized relative paths.
    outputFileTracingIgnores: SENSITIVE_TRACE_PATTERNS,
    // Applied after tracing by collect-build-traces (Linux/macOS correctness).
    // On Windows Next joins the globs with `\` and picomatch treats them as escapes,
    // which is why `outputFileTracingIgnores` above is required as well.
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
