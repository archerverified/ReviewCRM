/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' to enable API routes and dynamic features on Vercel
  images: {
    unoptimized: true,
  },
}

export default nextConfig
