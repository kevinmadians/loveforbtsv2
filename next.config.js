/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.scdn.co'], // Allow Spotify image domains
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    unoptimized: true, // Add this for Netlify compatibility
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
  // Configure for Netlify deployment
  trailingSlash: true,
  distDir: '.next',
  generateBuildId: async () => 'build',
  // Disable problematic optimizations
  optimizeFonts: false,
  optimizeImages: false,
  // Use standalone output for better compatibility
  output: 'standalone',
  // Disable static optimization for error pages
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

module.exports = nextConfig;