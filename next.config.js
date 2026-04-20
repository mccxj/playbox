const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');

initOpenNextCloudflareForDev();

const nextConfig = {
  productionBrowserSourceMaps: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
