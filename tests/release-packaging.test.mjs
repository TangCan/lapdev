import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, cpSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let baseline;
const env = { ...process.env, RELEASE_VERSION: 'v1.0.3', RELEASE_TAG: 'v1.0.3', RELEASE_COMMIT: 'abc123', GITHUB_REF_NAME: 'v1.0.3', GITHUB_REPOSITORY: 'TangCan/lapdev' };
function run(script, dir) {
  return execFileSync(process.execPath, [`scripts/${script}.mjs`, dir, dir], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
before(() => {
  baseline = mkdtempSync(join(tmpdir(), 'lapdev-release-test-'));
  execFileSync('npm', ['pack', './cli', '--pack-destination', baseline], { stdio: 'pipe' });
  for (const target of ['linux-x64', 'darwin-arm64']) writeFileSync(join(baseline, `lapdev-runtime-1.0.3-${target}.tar.gz`), `runtime bytes ${target}`);
  run('generate-runtime-release-manifest', baseline);
});
after(() => rmSync(baseline, { recursive: true, force: true }));
function altered(change, action) {
  const temp = mkdtempSync(join(tmpdir(), 'lapdev-release-negative-'));
  try { cpSync(baseline, temp, { recursive: true }); change(temp); action(temp); }
  finally { rmSync(temp, { recursive: true, force: true }); }
}
test('complete Release includes CLI, runtimes and manifest checksums', () => {
  assert.match(run('verify-runtime-release', baseline), /CLI and 2 runtime/);
  const manifest = JSON.parse(readFileSync(join(baseline, 'runtime-manifest.json')));
  assert.equal(manifest.cli.asset, 'https://github.com/TangCan/lapdev/releases/download/v1.0.3/lapdev-cli-1.0.3.tgz');
  assert.equal(readFileSync(join(baseline, 'SHA256SUMS'), 'utf8').trim().split('\n').length, 4);
});
test('corrupted CLI fails release verification', () => altered(dir => writeFileSync(join(dir, 'lapdev-cli-1.0.3.tgz'), 'corrupt'), dir => assert.throws(() => run('verify-runtime-release', dir), /integrity mismatch/)));
test('missing CLI fails generation before publication', () => altered(dir => unlinkSync(join(dir, 'lapdev-cli-1.0.3.tgz')), dir => assert.throws(() => run('generate-runtime-release-manifest', dir), /ENOENT/)));
test('empty runtime manifest fails closed', () => altered(dir => {
  const path = join(dir, 'runtime-manifest.json');
  const manifest = JSON.parse(readFileSync(path)); manifest.runtimes = []; writeFileSync(path, JSON.stringify(manifest));
}, dir => assert.throws(() => run('verify-runtime-release', dir), /both supported runtimes/)));
test('missing manifest checksum fails verification', () => altered(dir => {
  const path = join(dir, 'SHA256SUMS'); writeFileSync(path, readFileSync(path, 'utf8').split('\n').filter(line => !line.endsWith('runtime-manifest.json')).join('\n'));
}, dir => assert.throws(() => run('verify-runtime-release', dir), /missing release checksums/)));
test('package version mismatch is rejected even with updated hash', () => altered(dir => {
  const source = join(dir, 'wrong-cli');
  cpSync('cli', source, { recursive: true });
  const pkg = JSON.parse(readFileSync(join(source, 'package.json'))); pkg.version = '9.9.9'; writeFileSync(join(source, 'package.json'), JSON.stringify(pkg));
  execFileSync('npm', ['pack', source, '--pack-destination', dir], { stdio: 'pipe' });
  cpSync(join(dir, 'lapdev-cli-9.9.9.tgz'), join(dir, 'lapdev-cli-1.0.3.tgz'));
}, dir => assert.throws(() => run('generate-runtime-release-manifest', dir), /version/)));
