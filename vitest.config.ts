import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text"]
    }
  },
  resolve: {
    // fileURLToPath (not URL.pathname) so the alias resolves on Windows, where pathname yields an invalid /C:/ path.
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) }
  }
});
