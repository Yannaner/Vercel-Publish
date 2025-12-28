/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use static export for Vercel deployment
  // Note: This requires all pages to be pre-rendered at build time
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  eslint: {
    // Disable ESLint during builds to avoid parent config conflicts
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
