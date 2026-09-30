import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { request } from 'node:https';
import { once } from 'node:events';
import { isolatedEnvironment, stopProcessGroup } from '../scripts/release-runtime-acceptance.mjs';

test('listener defaults remain loopback in both profiles and support explicit IPv4/IPv6 hosts', () => {
  for (const profile of ['local-trusted', 'remote-shared']) {
    for (const host of ['', '127.0.0.2', '::1', '0.0.0.0']) {
      const env = { ...process.env, CAPABILITY_POLICY_PROFILE: profile, LAPDEV_HOST: host };
      const output = execFileSync('deno', ['eval', `import { HOST, LISTEN_ADDRESS } from './backend/src/config/index.ts'; console.log(JSON.stringify({HOST,LISTEN_ADDRESS}));`], { env, encoding: 'utf8', timeout: 10000 });
      assert.deepEqual(JSON.parse(output.trim()), { HOST: host || '127.0.0.1', LISTEN_ADDRESS: host === '::1' ? '[::1]' : host || '127.0.0.1' });
    }
  }
});

test('HTTP, HTTPS and TLS fallback all bind the configured host', () => {
  const main = readFileSync('backend/src/main.ts', 'utf8');
  const serveOptions = [...main.matchAll(/Deno\.serve\(\{([^}]+)\}/g)].map(match => match[1]);
  assert.equal(serveOptions.length, 3);
  for (const options of serveOptions) assert.match(options, /hostname:\s*HOST/);
  assert.ok(!main.includes('Server running on http://localhost'));
  assert.match(readFileSync('scripts/entrypoint.sh', 'utf8'), /--allow-env=[^"\n]*LAPDEV_HOST/);
});

test('CLI announces configured protocol and address including IPv6 brackets', () => {
  const cli = readFileSync('cli/bin/lapdev.js', 'utf8');
  const snippet = cli.slice(cli.indexOf('  const host = process.env.LAPDEV_HOST'), cli.indexOf('  if (!options.noOpen)'));
  assert.ok(snippet.includes('Lapdev runtime started'));
  for (const [host, tls, expected] of [['', '', 'http://127.0.0.1:3456'], ['127.0.0.2', '', 'http://127.0.0.2:3456'], ['::1', 'true', 'https://[::1]:3456']]) {
    const output = execFileSync(process.execPath, ['-e', `const port='3456'; ${snippet}`], { env: { ...process.env, LAPDEV_HOST: host, TLS_ENABLED: tls }, encoding: 'utf8' });
    assert.equal(output.trim(), `Lapdev runtime started at ${expected}`);
  }
});

test('real HTTP, HTTPS and TLS fallback listeners use loopback defaults and explicit hosts', { timeout: 90000 }, async () => {
  const root = mkdtempSync(join(tmpdir(), 'lapdev-listener-test-'));
  try {
    const cert = join(root, 'cert.pem');
    const key = join(root, 'key.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=localhost'], { stdio: 'pipe', timeout: 10000 });
    for (const mode of ['http', 'https', 'fallback', 'explicit', 'https-explicit', 'fallback-explicit']) {
      const env = isolatedEnvironment(join(root, mode));
      delete env.LAPDEV_HOST;
      if (mode.includes('explicit')) env.LAPDEV_HOST = '127.0.0.2';
      const host = env.LAPDEV_HOST || '127.0.0.1';
      const reservation = createServer();
      reservation.listen(0, host);
      await once(reservation, 'listening');
      const port = reservation.address().port;
      await new Promise(done => reservation.close(done));
      env.PORT = String(port);
      env.WORKSPACE_PATH = join(root, mode, 'workspace');
      mkdirSync(env.WORKSPACE_PATH);
      env.TLS_ENABLED = mode.startsWith('https') || mode.startsWith('fallback') ? 'true' : 'false';
      env.TLS_CERT_PATH = mode.startsWith('fallback') ? join(root, 'missing.pem') : cert;
      env.TLS_KEY_PATH = key;
      const child = spawn('deno', ['run', '--no-lock', '--no-check', '--allow-all', '--config', resolve('backend/deno.json'), resolve('backend/src/main.ts')], { env, cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
      const exited = once(child, 'exit').catch(() => []);
      let output = '';
      child.stdout.on('data', data => { output += data; });
      child.stderr.on('data', data => { output += data; });
      child.on('error', error => { output += error.message; });
      try {
        const protocol = mode.startsWith('https') ? 'https' : 'http';
        const deadline = Date.now() + 20000;
        while (!output.includes(`Listening on ${protocol}://${host}:${port}`) && Date.now() < deadline && child.exitCode === null) await new Promise(done => setTimeout(done, 50));
        assert.ok(output.includes(`Listening on ${protocol}://${host}:${port}`), `${mode}: ${output}`);
        if (protocol === 'https') {
          const status = await new Promise((done, reject) => {
            const req = request(`https://${host}:${port}/health`, { rejectUnauthorized: false, agent: false }, res => { res.resume(); res.on('end', () => done(res.statusCode)); });
            req.setTimeout(3000, () => req.destroy(new Error('TLS health timeout')));
            req.on('error', reject); req.end();
          });
          assert.equal(status, 200);
        } else {
          const response = await fetch(`http://${host}:${port}/health`, { signal: AbortSignal.timeout(3000) });
          await response.arrayBuffer();
          assert.equal(response.status, 200);
        }
        if (mode.startsWith('fallback')) assert.match(output, /Falling back to HTTP/);
      } finally { await stopProcessGroup(child, exited); }
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});
