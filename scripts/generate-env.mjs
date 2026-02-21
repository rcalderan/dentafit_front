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

const REQUIRED_VARS = ['API_BASE_URL', 'AWS_S3_BUCKET_URL'];

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

// 1. Start from .env file (local dev), if present
let fileVars = {};
if (existsSync(envFile)) {
  fileVars = parseEnvFile(readFileSync(envFile, 'utf-8'));
  console.log('📄  Loaded .env file.');
}

// 2. process.env always wins over .env (CI secrets injected via workflow env: block)
const merged = { ...fileVars };
for (const key of REQUIRED_VARS) {
  const val = process.env[key];
  if (val !== undefined && val !== '') {
    merged[key] = val;
  }
}

// Debug: show what was resolved (values masked for security)
for (const key of REQUIRED_VARS) {
  const val = merged[key];
  console.log(`    ${key}: ${val ? `${val.slice(0, 12)}...` : '(not set)'}`);
}

// Validate all required vars are present
const missing = REQUIRED_VARS.filter((k) => !merged[k] || merged[k].trim() === '');
if (missing.length > 0) {
  console.error('❌  Missing required environment variables:', missing.join(', '));
  console.error('    Create a .env file based on .env.template or set them in CI.');
  process.exit(1);
}

const content = `// AUTO-GENERATED — do not edit manually.
// Run: node scripts/generate-env.mjs
export const environment = {
  apiBaseUrl: '${merged.API_BASE_URL}',
  s3BucketUrl: '${merged.AWS_S3_BUCKET_URL}',
};
`;

writeFileSync(outputFile, content, 'utf-8');
console.log('✅  src/environments/environment.prod.ts generated successfully.');
console.log(`    API_BASE_URL  → ${merged.API_BASE_URL}`);
console.log(`    S3_BUCKET_URL → ${merged.AWS_S3_BUCKET_URL}`);
