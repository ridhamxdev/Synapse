/** @type {import('next').NextConfig} */
const nextConfig = {
  // Move allowedDevOrigins to root level (not under experimental)
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.0.104:3000',
    /^192\.168\.\d+\.\d+:3000$/,
  ],

  // Image domains for your WhatsApp clone
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',
      }
    ],
  },

  // Webpack configuration for Socket.io compatibility
  webpack: (config:any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })

    return config
  },

  // Experimental features (keep separate)
  experimental: {
    // Remove allowedDevOrigins from here
    serverActions: {
      allowedOrigins: ['localhost:3000', '192.168.0.104:3000']
    }
  }
}

module.exports = nextConfig
