#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const [releaseDir = '_release', outputDir = releaseDir] = process.argv.slice(2);
const version = (process.env.RELEASE_VERSION || '').replace(/^v/, '');
const tag = process.env.RELEASE_TAG;
const commit = process.env.RELEASE_COMMIT;
const repository = process.env.GITHUB_REPOSITORY || 'TangCan/lapdev';
if (!version || !tag || !commit) throw new Error('RELEASE_VERSION, RELEASE_TAG and RELEASE_COMMIT are required');
if (tag !== `v${version}`) throw new Error('release tag and version must match');
mkdirSync(outputDir, { recursive: true });

const targets = {
  'linux-x64': { platform: 'linux', arch: 'x64', target: 'x86_64-unknown-linux-gnu' },
  'darwin-arm64': { platform: 'darwin', arch: 'arm64', target: 'aarch64-apple-darwin' },
};
const entries = [];
const checksums = [];
for (const [name, identity] of Object.entries(targets)) {
  const file = `lapdev-runtime-${version}-${name}.tar.gz`;
  const path = join(releaseDir, file);
  const data = readFileSync(path);
  const sha256 = createHash('sha256').update(data).digest('hex');
  const size = String(statSync(path).size);
  entries.push({ version, ...identity, target: identity.target, asset: `https://github.com/${repository}/releases/download/${tag}/${file}`, size, sha256, commit, launcher: 'bin/lapdev-runtime' });
  checksums.push(`${sha256}  ${file}`);
  const destination = join(outputDir, file);
  if (path !== destination) copyFileSync(path, destination);
}

const cliFile = `lapdev-cli-${version}.tgz`;
const cliPath = join(releaseDir, cliFile);
const cliData = readFileSync(cliPath);
const cliHash = createHash('sha256').update(cliData).digest('hex');
const cli = { name: '@lapdev/cli', version, asset: `https://github.com/${repository}/releases/download/${tag}/${cliFile}`, size: String(statSync(cliPath).size), sha256: cliHash };
if (cliPath !== join(outputDir, cliFile)) copyFileSync(cliPath, join(outputDir, cliFile));
checksums.push(`${cliHash}  ${cliFile}`);
const manifestPath = join(outputDir, 'runtime-manifest.json');
writeFileSync(manifestPath, `${JSON.stringify({ version, tag, commit, cli, runtimes: entries }, null, 2)}\n`);
execFileSync(process.execPath, [fileURLToPath(new URL('./verify-npm-release.mjs', import.meta.url)), join(outputDir, cliFile), manifestPath], { stdio: 'inherit' });
checksums.push(`${createHash('sha256').update(readFileSync(manifestPath)).digest('hex')}  runtime-manifest.json`);
writeFileSync(join(outputDir, 'SHA256SUMS'), `${checksums.join('\n')}\n`);
const license = join(process.cwd(), 'LICENSE');
try { copyFileSync(license, join(outputDir, 'LICENSE')); } catch { /* license metadata is optional for repositories without a root LICENSE */ }
