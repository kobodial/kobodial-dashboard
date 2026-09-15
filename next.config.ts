import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Next 16 writes editor tooling rule files into the project root on
  // startup. This repo doesn't carry them, so the generator is off rather
  // than the files being deleted after every run.
  agentRules: false,
};

export default nextConfig;
