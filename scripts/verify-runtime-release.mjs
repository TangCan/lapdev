#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [releaseDir = '_release'] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(join(releaseDir, 'runtime-manifest.json'), 'utf8'));
if (!manifest.version || manifest.tag !== `v${manifest.version}` || !manifest.commit) throw new Error('invalid release identity');
if (process.env.GITHUB_REF_NAME && process.env.GITHUB_REF_NAME !== manifest.tag) throw new Error('release tag mismatch');
if (!Array.isArray(manifest.runtimes) || manifest.runtimes.length !== 2) throw new Error('release must include both supported runtimes');
if (manifest.cli?.name !== '@lapdev/cli' || manifest.cli.version !== manifest.version) throw new Error('release CLI metadata missing or mismatched');
const expectedFiles = new Set(['runtime-manifest.json']);
const targets = new Set(['linux-x64', 'darwin-arm64']);
for (const entry of [...manifest.runtimes, manifest.cli]) {
  if (entry.version !== manifest.version) throw new Error('release asset version mismatch');
  const isCli = entry === manifest.cli;
  const target = `${entry.platform}-${entry.arch}`;
  if (!isCli && (!targets.delete(target) || entry.commit !== manifest.commit)) throw new Error('runtime identity mismatch');
  const file = isCli ? `lapdev-cli-${manifest.version}.tgz` : `lapdev-runtime-${manifest.version}-${target}.tar.gz`;
  const url = new URL(entry.asset);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port || basename(url.pathname) !== file || !url.pathname.endsWith(`/releases/download/${manifest.tag}/${file}`)) throw new Error(`invalid release asset URL: ${file}`);
  if (process.env.GITHUB_REPOSITORY && url.pathname !== `/${process.env.GITHUB_REPOSITORY}/releases/download/${manifest.tag}/${file}`) throw new Error('release repository mismatch');
  const path = join(releaseDir, file);
  const data = readFileSync(path);
  const observed = createHash('sha256').update(data).digest('hex');
  if (String(statSync(path).size) !== entry.size || observed !== entry.sha256) {
    throw new Error(`release integrity mismatch for ${file}`);
  }
  expectedFiles.add(file);
}
const sums = readFileSync(join(releaseDir, 'SHA256SUMS'), 'utf8').trim().split('\n');
for (const line of sums) {
  const match = /^([a-f0-9]{64})  ([A-Za-z0-9._-]+)$/.exec(line);
  if (!match || !expectedFiles.delete(match[2])) throw new Error('unexpected or duplicate checksum entry');
  if (createHash('sha256').update(readFileSync(join(releaseDir, match[2]))).digest('hex') !== match[1]) throw new Error(`checksum mismatch for ${match[2]}`);
}
if (expectedFiles.size) throw new Error('missing release checksums');
execFileSync(process.execPath, [fileURLToPath(new URL('./verify-npm-release.mjs', import.meta.url)), join(releaseDir, `lapdev-cli-${manifest.version}.tgz`), join(releaseDir, 'runtime-manifest.json')], { stdio: 'inherit' });
console.log(`verified CLI and ${manifest.runtimes.length} runtime release assets for ${manifest.tag}`);
