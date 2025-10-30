/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    domains: ['eyhpjdnfeetmlayyxshx.supabase.co'],
    unoptimized: true
  },
  compiler: {
    removeConsole: false
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  // Add this to handle static exports
  output: 'export',
  // Add this to handle dynamic routes
  trailingSlash: true,
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Add this to handle dynamic routes
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      // Add other static paths here
    };
  }
};

module.exports = nextConfig;
