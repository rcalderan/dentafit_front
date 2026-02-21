/**
 * Pre-build script: reads .env (or process.env in CI) and generates
 * src/environments/environment.prod.ts with the resolved values.
 *
 * Usage:
 *   node scripts/generate-env.mjs          # reads .env file
 *   API_BASE_URL=https://... node scripts/generate-env.mjs  # CI via env vars
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const envFile = resolve(rootDir, '.env');
const outputFile = resolve(rootDir, 'src/environments/environment.prod.ts');

const REQUIRED_VARS = ['API_BASE_URL', 'S3_BUCKET_URL'];

/** Minimal .env parser — no external dependencies needed. */
function parseEnvFile(content) {
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex < 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
    vars[key] = value;
  }
  return vars;
}

// Merge: .env file values are overridden by actual process.env vars (CI-friendly)
let fileVars = {};
if (existsSync(envFile)) {
  fileVars = parseEnvFile(readFileSync(envFile, 'utf-8'));
} else {
  console.warn('⚠️   .env file not found — falling back to process.env variables.');
}

const merged = { ...fileVars };
for (const key of REQUIRED_VARS) {
  if (process.env[key]) merged[key] = process.env[key];
}

// Validate all required vars are present
const missing = REQUIRED_VARS.filter((k) => !merged[k]);
if (missing.length > 0) {
  console.error('❌  Missing required environment variables:', missing.join(', '));
  console.error('    Create a .env file based on .env.template or set them in CI.');
  process.exit(1);
}

const content = `// AUTO-GENERATED — do not edit manually.
// Run: node scripts/generate-env.mjs
export const environment = {
  apiBaseUrl: '${merged.API_BASE_URL}',
  s3BucketUrl: '${merged.S3_BUCKET_URL}',
};
`;

writeFileSync(outputFile, content, 'utf-8');
console.log('✅  src/environments/environment.prod.ts generated successfully.');
console.log(`    API_BASE_URL  → ${merged.API_BASE_URL}`);
console.log(`    S3_BUCKET_URL → ${merged.S3_BUCKET_URL}`);
