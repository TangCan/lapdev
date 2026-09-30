#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [archive] = process.argv.slice(2);
if (!archive) throw new Error('usage: publish-npm-release.mjs PACKAGE_TGZ');
const pkg = JSON.parse(execFileSync('tar', ['-xOzf', archive, 'package/package.json'], { encoding: 'utf8' }));
if (pkg.name !== '@lapdev/cli') throw new Error('unexpected npm package');
const endpoint = `https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/${encodeURIComponent(pkg.version)}`;
const response = await fetch(endpoint, { redirect: 'error' });
if (response.ok) {
  const published = await response.json();
  const integrity = `sha512-${createHash('sha512').update(readFileSync(archive)).digest('base64')}`;
  if (published.dist?.integrity !== integrity) {
    throw new Error(`${pkg.name}@${pkg.version} already exists with different package bytes; use a new version`);
  }
  console.log(`${pkg.name}@${pkg.version} already published with matching integrity; skipping duplicate publish`);
} else if (response.status === 404) {
  execFileSync('npm', ['publish', archive, '--access', 'public'], { stdio: 'inherit' });
} else {
  throw new Error(`npm registry check failed: HTTP ${response.status}`);
}
