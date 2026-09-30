#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { isolatedEnvironment, prepareFixtures, runAcceptance, stopProcessGroup, cleanupInstances } from './release-runtime-acceptance.mjs';

const [packageSource, runtimeArchive] = process.argv.slice(2);
if (!packageSource) throw new Error('usage: smoke-release-cli.mjs CLI_TGZ_OR_HTTPS_URL [RUNTIME_ARCHIVE]');
const source = packageSource.startsWith('https://') ? packageSource : resolve(packageSource);
const temp = mkdtempSync(join(tmpdir(), 'lapdev-release-smoke-'));
const processes = [];
async function unusedPort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(done => server.close(done));
  return port;
}
async function start(cli, workspace, env, runtime) {
  const port = await unusedPort();
  const args = ['web', '--no-open', '--workspace', workspace, '--port', String(port)];
  if (runtime) args.push('--runtime-dir', runtime);
  const child = spawn(cli, args, { env, cwd: temp, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  const exited = once(child, 'exit').catch(() => []);
  let stopped = false;
  const instance = { child, exited, base: `http://127.0.0.1:${port}`, close: async () => {
    if (stopped) return;
    await stopProcessGroup(child, exited);
    stopped = true;
  } };
  processes.push(instance);
  let output = '';
  child.on('error', error => { output += error.message; });
  child.stdout.on('data', data => { output = (output + data).slice(-16000); });
  child.stderr.on('data', data => { output = (output + data).slice(-16000); });
  let deadline = Date.now() + (runtime ? 60000 : 1100000);
  let startupObserved = false;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) break;
    if (!startupObserved && output.includes('Lapdev runtime started')) {
      startupObserved = true;
      deadline = Math.min(deadline, Date.now() + 60000);
    }
    try {
      const response = await fetch(`${instance.base}/health`, { signal: AbortSignal.timeout(1000) });
      await response.arrayBuffer();
      if (response.ok) return instance;
    } catch { /* Wait for download and startup. */ }
    await new Promise(done => setTimeout(done, 1000));
  }
  // Remote logs can contain session identifiers: never print those logs.
  throw new Error(`installed Release CLI failed during ${startupObserved ? 'service startup' : runtime ? 'local runtime startup' : 'runtime download/install'}${env.CAPABILITY_POLICY_PROFILE === 'remote-shared' ? '' : `:\n${output}`}`);
}
try {
  const prefix = join(temp, 'install');
  const workspace = join(temp, 'workspace');
  mkdirSync(workspace);
  // Isolate npm configuration and the CLI runtime cache from the runner's account.
  const env = isolatedEnvironment(temp, { ...process.env,
    OPENAI_API_KEY: 'synthetic-release-probe', AWS_SECRET_ACCESS_KEY: 'synthetic-release-probe',
    GITHUB_TOKEN: 'synthetic-release-probe', CUSTOM_PASSWORD: 'synthetic-release-probe',
  });
  const downloadEnv = isolatedEnvironment(temp, process.env, { download: true });
  const fixtures = prepareFixtures(workspace, temp, env);
  const npmMajor = Number(execFileSync('npm', ['--version'], { env, encoding: 'utf8' }).trim().split('.')[0]);
  const remoteFlags = source.startsWith('https://') && npmMajor >= 12 ? ['--allow-remote=all'] : [];
  try {
    execFileSync('npm', ['install', ...remoteFlags, '--global', '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', source], { env: downloadEnv, stdio: 'pipe', timeout: 120000 });
  } catch { throw new Error('Release CLI package installation failed (download logs withheld to protect proxy credentials)'); }
  const cli = join(prefix, 'bin', 'lapdev');
  const expectedVersion = JSON.parse(readFileSync(new URL('../cli/package.json', import.meta.url))).version;
  if (execFileSync(cli, ['version'], { env, encoding: 'utf8' }).trim() !== expectedVersion) throw new Error('installed CLI version mismatch');
  let runtime;
  if (runtimeArchive) {
    runtime = join(temp, 'runtime');
    mkdirSync(runtime);
    execFileSync('tar', ['-xzf', resolve(runtimeArchive), '-C', runtime]);
  } else {
    // 下载进程单独使用代理认证，服务和终端只继承 env。
    try {
      execFileSync(cli, ['web', '--download-only', '--no-open'], { env: downloadEnv, stdio: 'pipe', timeout: 1100000 });
    } catch { throw new Error('Release runtime download failed (download logs withheld to protect proxy credentials)'); }
    runtime = join(env.HOME, '.cache', 'lapdev', expectedVersion, `${process.platform}-${process.arch}`);
  }
  const local = await start(cli, workspace, env, runtime);
  const ui = await fetch(`${local.base}/`, { signal: AbortSignal.timeout(5000) });
  if (!ui.ok || !(await ui.text()).includes('<html')) throw new Error('runtime did not serve the frontend');
  console.log('Release CLI installation, runtime startup, health and frontend passed; running core acceptance');
  await runAcceptance({ base: local.base, workspace, fixtures, env, startRemote: async () => {
    const root = join(temp, `remote-${processes.length}`);
    const remoteWorkspace = join(root, 'workspace');
    mkdirSync(remoteWorkspace, { recursive: true });
    const remoteEnv = isolatedEnvironment(root, env);
    const token = randomBytes(32).toString('hex');
    Object.assign(remoteEnv, { CAPABILITY_POLICY_PROFILE: 'remote-shared', DEPLOYMENT_PROFILE: 'remote-shared', CAPABILITY_ALLOWLIST: 'files', LAPDEV_REMOTE_ACCESS_TOKEN: token, WORKSPACE_ID: 'release-remote-fixture' });
    // Reuse the already downloaded archive/cache; keep HOME and state independent.
    const cachedRuntime = runtime || join(env.HOME, '.cache', 'lapdev', expectedVersion, `${process.platform}-${process.arch}`);
    return { ...await start(cli, remoteWorkspace, remoteEnv, cachedRuntime), token };
  } });
  console.log('Release runtime core and security acceptance passed');
} finally {
  try { await cleanupInstances(processes); }
  finally { rmSync(temp, { recursive: true, force: true }); }
}
