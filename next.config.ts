import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dashboard renders operational data that changes constantly and is
  // never worth serving stale — every page fetches through lib/gateway.ts,
  // which sets its own no-store on each request.
  reactStrictMode: true,

  // Next 16 writes AGENTS.md and CLAUDE.md into the project root by
  // default. This repo doesn't carry AI-tooling files, so the generator
  // is off rather than the files being deleted repeatedly.
  agentRules: false,
};

export default nextConfig;
