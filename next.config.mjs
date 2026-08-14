import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully pre-rendered HTML per route — nothing to boot before first paint.
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  // a stray lockfile above this folder would otherwise be inferred as the workspace root
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
};
export default nextConfig;
