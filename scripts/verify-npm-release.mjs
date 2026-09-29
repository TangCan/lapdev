#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [packageArchive, manifestPath] = process.argv.slice(2);
if (!packageArchive || !manifestPath) {
  console.error('usage: verify-npm-release.mjs PACKAGE_TGZ RUNTIME_MANIFEST_JSON');
  process.exit(2);
}

const packageJson = JSON.parse(execFileSync('tar', ['-xOzf', packageArchive, 'package/package.json'], { encoding: 'utf8' }));
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const expectedVersion = process.env.GITHUB_REF_NAME?.replace(/^v/, '') || packageJson.version;

if (packageJson.name !== '@lapdev/cli') throw new Error(`unexpected package name: ${packageJson.name}`);
if (packageJson.version !== expectedVersion) throw new Error(`CLI version ${packageJson.version} does not match ${expectedVersion}`);
if (!Array.isArray(manifest.runtimes) || manifest.runtimes.length === 0) throw new Error('runtime release manifest has no runtimes');
for (const runtime of manifest.runtimes) {
  if (runtime.version !== packageJson.version) throw new Error(`runtime ${runtime.platform}-${runtime.arch} version mismatch`);
}
console.log(`verified @lapdev/cli@${packageJson.version} against ${manifest.runtimes.length} runtime entries`);
