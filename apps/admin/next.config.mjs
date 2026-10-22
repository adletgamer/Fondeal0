/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The back-office must not advertise its framework.
  poweredByHeader: false,
  transpilePackages: ['@fondealo/ui'],
};

export default nextConfig;
