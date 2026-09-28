import { describe, it, expect } from "vitest";
import { gatewayConfigError } from "@/lib/gateway";

/**
 * The failure this guards against actually happened to this deployment: the
 * gateway's tunnel URL stopped existing, the environment variable went unset,
 * the build succeeded, and every page rendered the unavailable state with
 * nothing reporting why. A localhost fallback is right in development and
 * cannot work in production.
 */
describe("gatewayConfigError", () => {
  it("says nothing in development, where the localhost default is correct", () => {
    expect(gatewayConfigError(undefined, "development")).toBeNull();
    expect(gatewayConfigError("http://localhost:3000", "development")).toBeNull();
    expect(gatewayConfigError("", "test")).toBeNull();
  });

  it("reports an unset variable in production", () => {
    const err = gatewayConfigError(undefined, "production");
    expect(err).toContain("NEXT_PUBLIC_GATEWAY_API_URL");
    expect(gatewayConfigError("", "production")).not.toBeNull();
    expect(gatewayConfigError("   ", "production")).not.toBeNull();
  });

  it("reports a localhost URL in production, in each form it takes", () => {
    for (const url of [
      "http://localhost:3000",
      "https://localhost",
      "http://127.0.0.1:3000",
      "http://[::1]:3000",
      "HTTP://LocalHost:3000",
    ]) {
      expect(gatewayConfigError(url, "production"), url).not.toBeNull();
    }
  });

  it("accepts a real gateway URL in production", () => {
    for (const url of [
      "https://kobodial-gateway.onrender.com",
      "https://gateway.example.com/",
      "http://10.0.0.5:3000",
    ]) {
      expect(gatewayConfigError(url, "production"), url).toBeNull();
    }
  });

  it("does not mistake a hostname that merely contains localhost", () => {
    // "localhost.example.com" is a real, reachable host. Matching it would
    // block a legitimate deploy, which is worse than the problem being solved.
    expect(gatewayConfigError("https://localhost.example.com", "production")).toBeNull();
    expect(gatewayConfigError("https://mylocalhost.dev", "production")).toBeNull();
  });
});
