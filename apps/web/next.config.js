/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@scan2call/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.scan2call.net',
      },
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
