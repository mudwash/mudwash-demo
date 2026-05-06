import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
  },
});

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.5', 
    '192.168.1.5:3000', 
    '192.168.1.7', 
    '192.168.1.7:3000', 
    '192.168.1.8', 
    '192.168.1.8:3000', 
    '192.168.20.22', 
    'localhost:3000', 
    '192.168.20.22:3000'
  ],
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      }
    ],
  },
  /* config options here */
};

export default withPWA(nextConfig);
