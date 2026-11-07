/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@evolyn/shared'],
  optimizeFonts: false,
  async rewrites() {
    const backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (backendUrl && !backendUrl.startsWith('/')) {
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl.replace(/\/$/, '')}/api/:path*`,
        },
        {
          source: '/uploads/:path*',
          destination: `${backendUrl.replace(/\/$/, '')}/uploads/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
