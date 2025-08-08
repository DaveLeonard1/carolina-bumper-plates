// scripts/pull-env.cjs
// Pull Vercel/v0 env vars into .env.local before starting dev.
// Usage: run automatically via `npm run dev` by adding a predev script.

const { execSync } = require("node:child_process");

const target = ".env.local";

try {
  console.log("↻ Pulling env vars from Vercel into", target);
  execSync(`vercel env pull ${target}`, { stdio: "inherit" });
  console.log("✓ Env sync complete");
} catch (err) {
  console.error("\n⚠️  Couldn't pull envs from Vercel.");
  console.error("   Make sure you've run `vercel login` and `vercel link` in this project.");
  console.error("   Continuing without blocking dev...\n");
  process.exit(0); // don’t block dev; app will show its own env errors
}
