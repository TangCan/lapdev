#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';

const [packageSource, runtimeArchive] = process.argv.slice(2);
if (!packageSource) throw new Error('usage: smoke-release-cli.mjs CLI_TGZ_OR_HTTPS_URL [RUNTIME_ARCHIVE]');
const source = packageSource.startsWith('https://') ? packageSource : resolve(packageSource);
const temp = mkdtempSync(join(tmpdir(), 'lapdev-release-smoke-'));
let child;
let exited;
let output = '';
try {
  const prefix = join(temp, 'install');
  const home = join(temp, 'home');
  const workspace = join(temp, 'workspace');
  mkdirSync(home);
  mkdirSync(workspace);
  // Isolate npm configuration and the CLI runtime cache from the runner's account.
  const env = { ...process.env, HOME: home, npm_config_cache: join(temp, 'npm-cache'), npm_config_userconfig: join(temp, 'npmrc'), npm_config_globalconfig: join(temp, 'global-npmrc') };
  delete env.LAPDEV_RUNTIME_DIR;
  delete env.LAPDEV_RUNTIME_MANIFEST_URL;
  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_TOKEN;
  const npmMajor = Number(execFileSync('npm', ['--version'], { env, encoding: 'utf8' }).trim().split('.')[0]);
  const remoteFlags = source.startsWith('https://') && npmMajor >= 12 ? ['--allow-remote=all'] : [];
  execFileSync('npm', ['install', ...remoteFlags, '--global', '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', source], { env, stdio: 'inherit', timeout: 120000 });
  const cli = join(prefix, 'bin', 'lapdev');
  const expectedVersion = JSON.parse(readFileSync(new URL('../cli/package.json', import.meta.url))).version;
  if (execFileSync(cli, ['version'], { env, encoding: 'utf8' }).trim() !== expectedVersion) throw new Error('installed CLI version mismatch');
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((done) => server.close(done));
  const args = ['web', '--no-open', '--workspace', workspace, '--port', String(port)];
  if (runtimeArchive) {
    const runtime = join(temp, 'runtime');
    mkdirSync(runtime);
    execFileSync('tar', ['-xzf', resolve(runtimeArchive), '-C', runtime]);
    args.push('--runtime-dir', runtime);
  }
  child = spawn(cli, args, { env, cwd: temp, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  exited = once(child, 'exit').catch(() => []);
  child.on('error', (error) => { output += error.message; });
  child.stdout.on('data', (data) => { output = (output + data).slice(-16000); });
  child.stderr.on('data', (data) => { output = (output + data).slice(-16000); });
  let healthy = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null || child.signalCode !== null) break;
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(1000) });
      await response.arrayBuffer();
      if (response.ok) { healthy = true; break; }
    } catch { /* Wait for the runtime download and startup. */ }
    await new Promise((done) => setTimeout(done, 1000));
  }
  if (!healthy) throw new Error(`installed Release CLI failed health check:\n${output}`);
  const ui = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(5000) });
  if (!ui.ok || !(await ui.text()).includes('<html')) throw new Error('runtime did not serve the frontend');
  console.log('Release CLI installation, runtime startup, health and frontend passed');
} finally {
  if (child?.pid && child.exitCode === null && child.signalCode === null) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* Already exited. */ }
    await Promise.race([exited.catch(() => {}), new Promise((done) => setTimeout(done, 3000))]);
    try { process.kill(-child.pid, 'SIGKILL'); } catch { /* Process group stopped. */ }
  }
  rmSync(temp, { recursive: true, force: true });
}
