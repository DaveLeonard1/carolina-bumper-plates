#!/usr/bin/env node
// Stub for environment pulling. In local dev we rely on .env.local.
// This exists to prevent `predev` from failing if no remote env sync is configured.
console.log("[predev] Skipping remote env sync. Using .env.local if present.");
process.exit(0);
