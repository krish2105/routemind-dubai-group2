import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three / r3f ship ESM; transpile to be safe on all platforms
  transpilePackages: ["three"],
};

export default nextConfig;
