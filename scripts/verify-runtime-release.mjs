#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const [releaseDir = '_release'] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(join(releaseDir, 'runtime-manifest.json'), 'utf8'));
for (const entry of manifest.runtimes || []) {
  const file = basename(new URL(entry.asset).pathname);
  const path = join(releaseDir, file);
  const data = readFileSync(path);
  const observed = createHash('sha256').update(data).digest('hex');
  if (String(statSync(path).size) !== entry.size || observed !== entry.sha256) {
    throw new Error(`release integrity mismatch for ${file}`);
  }
}
console.log(`verified ${manifest.runtimes.length} runtime release assets for ${manifest.tag}`);
