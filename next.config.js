/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'export',
  distDir: 'out',
  // Skip TypeScript and ESLint during build
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Disable image optimization during export
  images: {
    unoptimized: true,
    loader: 'imgix',
    path: '',
    domains: ['eyhpjdnfeetmlayyxshx.supabase.co']
  },
  // Disable minification for easier debugging
  swcMinify: false,
  compiler: {
    removeConsole: false // Keep console logs for now
  },
  // Handle webpack configurations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        http2: false,
        dgram: false,
        module: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    return config;
  },
  // Disable static page generation for problematic pages
  exportPathMap: async function() {
    return {
      '/': { page: '/' },
      // Add other pages that work well statically
    };
  },
  // Disable server components
  experimental: {
    serverComponents: false,
  }
};

module.exports = nextConfig;