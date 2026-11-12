// Loads the repo-root .env (gitignored; see .env.example) into process.env when it exists.
// Variables already set in the shell win. Import this first in every entry point: lib/llm.ts
// reads its model settings when it loads.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(file)) process.loadEnvFile(file);
