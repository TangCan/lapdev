import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { assertDenied, assertMessageDenied, cleanupInstances, collectChecks, isolatedEnvironment, prepareFixtures, requestJSON, sessionWebsocketExchange, websocketExchange, websocketUpgrade, stopProcessGroup } from '../scripts/release-runtime-acceptance.mjs';

async function serverFixture(handler, run, upgrade) {
  const server = createServer(handler);
  if (upgrade) server.on('upgrade', upgrade);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(done => server.close(done)); }
}

test('assertion failures remain failures while subsequent capabilities run', async () => {
  const reports = [];
  await assert.rejects(collectChecks([
    ['broken', () => assert.equal('wrong', 'expected')],
    ['next', () => 'still checked'],
  ], line => reports.push(JSON.parse(line))), error => {
    assert.equal(error.results[0].status, 'fail');
    assert.equal(error.results[1].status, 'pass');
    return /broken/.test(error.message);
  });
  assert.equal(reports.length, 2);
});

test('rejection checks reject success, unrelated errors, and incorrect auth codes', () => {
  assertDenied({ status: 401, data: { error: { code: 'UNAUTHENTICATED' } } }, 401, 'UNAUTHENTICATED');
  assertDenied({ status: 403, data: { error: { code: 'CAPABILITY_DENIED' } } }, 403, 'CAPABILITY_DENIED');
  for (const result of [{ status: 200, data: {} }, { status: 500, data: {} }, { status: 401, data: { error: { code: 'OTHER' } } }]) {
    assert.throws(() => assertDenied(result, 401, 'UNAUTHENTICATED'));
  }
});

test('HTTP timeout also bounds a stalled response body', async () => {
  await serverFixture((_req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.write('{'); }, async base => {
    await assert.rejects(requestJSON(base, '/', { timeoutMs: 50 }), /abort|timeout/i);
  });
});

test('WebSocket rejection checks observe an actual HTTP authorization response', async () => {
  await serverFixture((_req, res) => {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'UNAUTHENTICATED' } }));
  }, async base => assertDenied(await websocketUpgrade(base), 401, 'UNAUTHENTICATED'));
});

test('WebSocket acknowledgement timeout closes the upgraded connection', async () => {
  let closed;
  await serverFixture((_req, res) => res.end(), async base => {
    await assert.rejects(websocketExchange(base, { type: 'subscribe' }, data => data.type === 'subscribed', 50), /timeout/);
    await Promise.race([closed, new Promise((_resolve, reject) => setTimeout(() => reject(new Error('socket not closed')), 1000))]);
  }, (req, socket) => {
    closed = once(socket, 'close');
    const accept = createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    socket.on('data', data => { if ((data[0] & 15) === 8) socket.end(Buffer.from([0x88, 0])); });
  });
});

test('fixtures use temporary workspace skills and never inherit runtime credentials or policy', () => {
  const root = mkdtempSync(join(tmpdir(), 'release-fixtures-test-'));
  try {
    const env = isolatedEnvironment(root, { PATH: process.env.PATH, LAPDEV_HOST: '0.0.0.0', LAPDEV_REMOTE_ACCESS_TOKEN: 'secret', CAPABILITY_ALLOWLIST: 'ai', TLS_ENABLED: 'true', GIT_DIR: '/outside', HOME: '/outside', LAPDEV_RUNTIME_DIR: '/old-runtime' });
    assert.equal(env.LAPDEV_HOST, '127.0.0.1');
    assert.equal(env.TLS_ENABLED, 'false');
    for (const name of ['LAPDEV_REMOTE_ACCESS_TOKEN', 'LAPDEV_RUNTIME_DIR', 'CAPABILITY_ALLOWLIST', 'GIT_DIR']) assert.equal(env[name], undefined);
    const workspace = join(root, 'workspace');
    const fixtures = prepareFixtures(workspace, root, env);
    assert.match(readFileSync(join(workspace, '.agents/skills', fixtures.identity, 'SKILL.md'), 'utf8'), /Isolated release acceptance/);
    assert.equal(readFileSync(fixtures.sentinel, 'utf8'), fixtures.sentinelContent);
  } finally { rmSync(root, { recursive: true, force: true }); }
  assert.equal(existsSync(root), false);
});

test('cleanup kills a process group even when its launcher has already exited', async () => {
  const child = spawn(process.execPath, ['-e', `const {spawn}=require('node:child_process'); const p=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'}); console.log(p.pid); p.unref();`], { detached: true, stdio: ['ignore', 'pipe', 'ignore'] });
  const exited = once(child, 'exit');
  const [data] = await once(child.stdout, 'data');
  const descendantPid = Number(data.toString().trim());
  await exited;
  try {
    process.kill(descendantPid, 0);
    await stopProcessGroup(child, exited, 50);
    let stopped = false;
    for (let i = 0; i < 50; i++) {
      try {
        process.kill(descendantPid, 0);
        if (process.platform === 'linux' && /State:\s+Z/.test(readFileSync(`/proc/${descendantPid}/status`, 'utf8'))) { stopped = true; break; }
      } catch (error) { if (error.code === 'ESRCH' || error.code === 'ENOENT') { stopped = true; break; } throw error; }
      await new Promise(done => setTimeout(done, 20));
    }
    assert.ok(stopped, 'descendant survived cleanup');
  } finally { try { process.kill(descendantPid, 'SIGKILL'); } catch {} }
});

test('environment whitelist excludes synthetic provider, cloud, GitHub and arbitrary credentials', () => {
  const root = mkdtempSync(join(tmpdir(), 'release-env-test-'));
  try {
    const inherited = { PATH: process.env.PATH, LANG: 'C.UTF-8', OPENAI_API_KEY: 'synthetic', AWS_SECRET_ACCESS_KEY: 'synthetic', AWS_PROFILE: 'synthetic', GOOGLE_APPLICATION_CREDENTIALS: '/synthetic', GH_TOKEN: 'synthetic', GITHUB_TOKEN: 'synthetic', CUSTOM_PASSWORD: 'synthetic', NODE_OPTIONS: '--require=/outside', HTTPS_PROXY: 'http://fixture:synthetic@localhost:9999', http_proxy: 'http://localhost:8888' };
    const env = isolatedEnvironment(root, inherited);
    for (const name of Object.keys(inherited).filter(name => !['PATH', 'LANG', 'http_proxy'].includes(name))) assert.equal(env[name], undefined, name);
    assert.equal(env.http_proxy, inherited.http_proxy);
    assert.equal(isolatedEnvironment(root, inherited, { download: true }).HTTPS_PROXY, inherited.HTTPS_PROXY);
    const output = execFileSync(process.execPath, ['-e', 'process.stdout.write(JSON.stringify(process.env))'], { env, encoding: 'utf8' });
    assert.ok(!output.includes('synthetic'));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('cleanup attempts all instances and aggregates failures', async () => {
  const attempted = [];
  await assert.rejects(cleanupInstances([
    { close: () => { attempted.push('last'); } },
    { close: () => { attempted.push('middle'); throw new Error('synthetic'); } },
    { close: () => { attempted.push('first'); throw new Error('synthetic'); } },
  ]), error => error instanceof AggregateError && error.errors.length === 2);
  assert.deepEqual(attempted, ['first', 'middle', 'last']);
});

test('restricted messages reject successful acknowledgements and session mismatch', () => {
  assertMessageDenied({ type: 'error', code: 'CAPABILITY_DENIED' });
  for (const message of [{ type: 'gitSubscribed' }, { type: 'terminalRegistered' }, { type: 'error', code: 'SESSION_MISMATCH' }]) assert.throws(() => assertMessageDenied(message));
});

test('download-only validates the runtime without spawning its launcher', () => {
  const output = execFileSync(process.execPath, ['cli/bin/lapdev.js', 'web', '--download-only', '--runtime-dir', 'tests/fixtures/runtime-6-1'], { encoding: 'utf8', timeout: 3000 });
  assert.equal(output, '');
  assert.throws(() => execFileSync(process.execPath, ['cli/bin/lapdev.js', 'web', '--download-only', '--runtime-dir', 'tests/fixtures/runtime-6-1/missing'], { stdio: 'pipe', timeout: 3000 }), error => error.status === 3);
});

test('session message exchange sends a masked authenticated message and reads the response', async () => {
  await serverFixture((_req, res) => res.end(), async base => {
    const result = await sessionWebsocketExchange(base, 'fixture=session', { type: 'subscribeToGit' }, value => value.type === 'gitSubscribed');
    assert.throws(() => assertMessageDenied(result), /succeeded/);
  }, (req, socket) => {
    assert.equal(req.headers.cookie, 'fixture=session');
    socket.on('end', () => socket.end());
    const accept = createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
    socket.once('data', frame => {
      assert.equal(frame[1] & 128, 128);
      const decoded = Buffer.from(frame.subarray(6).map((byte, index) => byte ^ frame[2 + index % 4]));
      assert.equal(JSON.parse(decoded.toString()).type, 'subscribeToGit');
      const payload = Buffer.from(JSON.stringify({ type: 'gitSubscribed' }));
      socket.write(Buffer.concat([Buffer.from([0x81, payload.length]), payload]));
    });
  });
});
