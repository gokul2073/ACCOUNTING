import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '10.49.242.51',
    '10.255.165.51',
    '10.91.219.51',
    '10.68.138.51',
    'localhost',
    '127.0.0.1',
    '*.local',
  ],
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'jsonwebtoken'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'clsx', 'tailwind-merge', 'zod'],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next', '**/prisma/dev.db*'],
      };
    }
    return config;
  },
  turbopack: {},
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
