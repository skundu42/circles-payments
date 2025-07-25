import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ⏹  Skip ESLint during `next build`
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ⏹  Ignore TypeScript compile-time errors during `next build`
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;