/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable API routes and dynamic features on Vercel
  images: {
    unoptimized: true,
  },
  eslint: {
    // ESLint 9 with flat config is incompatible with Next.js 14's ESLint integration
    // Run linting separately with `pnpm lint`
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
