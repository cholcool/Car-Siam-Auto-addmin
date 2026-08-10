/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'portal.carsiamauto.com',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;
