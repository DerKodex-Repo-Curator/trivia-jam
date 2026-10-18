import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Load tests against a deployed Worker (`TRY_URL=… pnpm test:load`). Not part of `pnpm test`. */
export default defineConfig({
  resolve: { alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["e2e/load/*.load.test.ts"],
    testTimeout: 900_000,
    server: { deps: { inline: ["actor-kit"] } },
  },
});
