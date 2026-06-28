/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@scan2call/shared'],
  // Tree-shake large barrel packages so only the icons/helpers actually used
  // are bundled, cutting client JS across the app.
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    // Modern formats for smaller image payloads.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.scan2call.com.au',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflarestorage.com',
      },
    ],
  },
};

module.exports = nextConfig;
