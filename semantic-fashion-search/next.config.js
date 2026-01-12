/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Configure image domains for external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '*.shopify.com',
      },
      {
        protocol: 'http',
        hostname: 'www.dhresource.com',
      },
      {
        protocol: 'https',
        hostname: 'www.dhresource.com',
      },
      {
        protocol: 'http',
        hostname: '*.dhresource.com',
      },
      {
        protocol: 'https',
        hostname: '*.dhresource.com',
      },
      {
        protocol: 'https',
        hostname: 'static-dress.missacc.com',
      },
      {
        protocol: 'https',
        hostname: '*.missacc.com',
      },
      // CJ Affiliate merchants
      {
        protocol: 'https',
        hostname: 'img.shein.com',
      },
      {
        protocol: 'https',
        hostname: '*.shein.com',
      },
      {
        protocol: 'https',
        hostname: 'images.posh.mk',
      },
      {
        protocol: 'https',
        hostname: 'di2ponv0v5otw.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'static.nike.com',
      },
      {
        protocol: 'https',
        hostname: '*.nike.com',
      },
      {
        protocol: 'https',
        hostname: '*.adidas.com',
      },
      // Allow all HTTPS images as fallback (can restrict later)
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Environment variables available to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'Semantic Fashion Search',
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
