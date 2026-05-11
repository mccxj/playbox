// Only initialize Cloudflare-specific config when running on Cloudflare Workers
// This avoids issues when building on other platforms (Vercel, etc.)
if (!process.env.VERCEL) {
  try {
    const { initOpenNextCloudflareForDev } = require('@opennextjs/cloudflare');
    initOpenNextCloudflareForDev();
  } catch (e) {
    // Cloudflare packages not available, skip initialization
  }
}

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
