/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "remotion"],
  },
};

export default nextConfig;
