/**
 * Strips comments from providers.jsonc and writes providers.json.
 * Run before build to ensure the JSON config is up to date.
 *
 * Usage: node scripts/generate-config-json.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripComments } from 'jsonc-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const srcPath = join(rootDir, 'src/config/providers.jsonc');
const destPath = join(rootDir, 'src/config/providers.json');

const raw = readFileSync(srcPath, 'utf-8');
const stripped = stripComments(raw);

// Validate
JSON.parse(stripped);

writeFileSync(destPath, stripped, 'utf-8');
console.log(`Generated ${destPath}`);
