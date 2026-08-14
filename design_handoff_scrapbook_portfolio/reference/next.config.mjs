/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully pre-rendered HTML per route — nothing to boot before first paint.
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
};
export default nextConfig;
