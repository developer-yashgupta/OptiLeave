/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Suppress the critical dependency warning from face-api
    config.ignoreWarnings = [
      { module: /node_modules\/@vladmandic\/face-api/ },
      /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
    ];

    // Add fallback for node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
  // Suppress React DevTools suggestion in production
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
