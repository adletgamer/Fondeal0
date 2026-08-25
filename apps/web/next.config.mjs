/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile workspace packages from source (they ship .ts/.tsx, not built dist).
  transpilePackages: ['@fondealo/ui', '@fondealo/sdk', '@fondealo/types'],
};

export default nextConfig;
