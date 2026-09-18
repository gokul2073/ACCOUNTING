import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.68.138.51', 'localhost', '127.0.0.1'],
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
