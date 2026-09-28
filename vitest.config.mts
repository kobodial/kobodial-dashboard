import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig.json, so tests import modules
    // by the same specifier the application uses.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
