import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json'
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
  
  // Fix for path mapping in production builds
  webpack: (config, { isServer }) => {
    // Ensure @ alias works in production
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    return config
  },
}

export default nextConfig
