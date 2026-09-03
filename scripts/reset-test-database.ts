import "dotenv/config";
import { execFileSync } from "node:child_process";
import path from "node:path";

function databaseIdentity(value: string) {
  const url = new URL(value);
  return `${url.hostname.replace("-pooler", "")}${url.pathname}`;
}

const testUrl = process.env.TEST_DATABASE_URL_UNPOOLED;
if (!testUrl)
  throw new Error("TEST_DATABASE_URL_UNPOOLED is required for db:reset");
if (
  process.env.DATABASE_URL &&
  databaseIdentity(testUrl) === databaseIdentity(process.env.DATABASE_URL)
)
  throw new Error(
    "db:reset refuses to target the configured application database",
  );

const prismaCli = path.join(
  process.cwd(),
  "node_modules",
  "prisma",
  "build",
  "index.js",
);
execFileSync(process.execPath, [prismaCli, "migrate", "reset", "--force"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? testUrl,
    DATABASE_URL_UNPOOLED: testUrl,
  },
  stdio: "inherit",
});
