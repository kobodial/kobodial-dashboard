import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dashboard renders operational data that changes constantly and is
  // never worth serving stale — every page fetches through lib/gateway.ts,
  // which sets its own no-store on each request.
  reactStrictMode: true,
};

export default nextConfig;
