#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const [releaseDir = '_release', outputDir = releaseDir] = process.argv.slice(2);
const version = (process.env.RELEASE_VERSION || '').replace(/^v/, '');
const tag = process.env.RELEASE_TAG;
const commit = process.env.RELEASE_COMMIT;
const repository = process.env.GITHUB_REPOSITORY || 'lapdev/lapdev';
if (!version || !tag || !commit) throw new Error('RELEASE_VERSION, RELEASE_TAG and RELEASE_COMMIT are required');

const targets = {
  'linux-x64': { platform: 'linux', arch: 'x64', target: 'x86_64-unknown-linux-gnu' },
  'darwin-arm64': { platform: 'darwin', arch: 'arm64', target: 'aarch64-apple-darwin' },
};
const entries = [];
const checksums = [];
for (const [name, identity] of Object.entries(targets)) {
  const file = readdirSync(releaseDir).find((candidate) => candidate.endsWith(`-${name}.tar.gz`));
  if (!file) throw new Error(`missing archive for ${name}`);
  const path = join(releaseDir, file);
  const data = readFileSync(path);
  const sha256 = createHash('sha256').update(data).digest('hex');
  const size = String(statSync(path).size);
  entries.push({ version, ...identity, target: identity.target, asset: `https://github.com/${repository}/releases/download/${tag}/${file}`, size, sha256, commit, launcher: 'bin/lapdev-runtime' });
  checksums.push(`${sha256}  ${file}`);
  const destination = join(outputDir, file);
  if (path !== destination) copyFileSync(path, destination);
}

writeFileSync(join(outputDir, 'runtime-manifest.json'), `${JSON.stringify({ version, tag, commit, runtimes: entries }, null, 2)}\n`);
writeFileSync(join(outputDir, 'SHA256SUMS'), `${checksums.join('\n')}\n`);
const license = join(process.cwd(), 'LICENSE');
try { copyFileSync(license, join(outputDir, 'LICENSE')); } catch { /* license metadata is optional for repositories without a root LICENSE */ }
