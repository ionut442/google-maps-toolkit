import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "node:path";

const linkedTestBranch =
  process.env.NEON_BRANCH && process.env.NEON_BRANCH !== "production";
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  (linkedTestBranch ? process.env.DATABASE_URL : undefined);
const testDatabaseUrlUnpooled =
  process.env.TEST_DATABASE_URL_UNPOOLED ??
  (linkedTestBranch ? process.env.DATABASE_URL_UNPOOLED : undefined);
if (!testDatabaseUrl || !testDatabaseUrlUnpooled)
  throw new Error(
    "Tests require TEST_DATABASE_URL or a linked non-production Neon branch",
  );
process.env.DATABASE_URL = testDatabaseUrl;
process.env.DATABASE_URL_UNPOOLED = testDatabaseUrlUnpooled;
process.env.PRIVATE_STORAGE_PROVIDER = "local";
export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  test: {
    environment: "node",
    globalSetup: ["./tests/global-setup.ts"],
    // Real Neon branches can cold-start or briefly add network latency.
    testTimeout: 60_000,
    sequence: { concurrent: false },
    fileParallelism: false,
  },
});
