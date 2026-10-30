import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^cloudflare:workers$/, replacement: `${root}tests/support/cloudflare-workers.ts` },
      { find: /^@\//, replacement: root },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Each service file boots its own Miniflare (workerd) and applies the committed
    // migrations in `beforeAll`. On a loaded machine that startup can outlast Vitest's
    // 10 s hook default, which fails the suite for reasons unrelated to the code under
    // test; the service cases themselves are fast, so a generous ceiling costs nothing
    // on a normal run and keeps a slow boot from looking like a failure.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
