/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.scdn.co'], // Allow Spotify image domains
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    unoptimized: true, // Required for Netlify deployment
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['firebase/firestore', 'firebase/auth'],
  },
  // Netlify-specific configurations
  trailingSlash: true,
  distDir: '.next',
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  // Performance optimizations
  typescript: {
    ignoreBuildErrors: true, // Only in production
  },
  eslint: {
    ignoreDuringBuilds: true, // Only in production
  },
  // Use standalone output for better Netlify compatibility
  output: 'standalone',
};

module.exports = nextConfig;