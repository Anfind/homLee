/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Optimize hydration
    optimizePackageImports: ['lucide-react'],
  },
  // Handle browser extension interference
  reactStrictMode: true,
}

export default nextConfig
