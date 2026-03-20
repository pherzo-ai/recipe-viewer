import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: '/recipe-app',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/recipe-app',
  },
}

export default nextConfig
