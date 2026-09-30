import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID, randomBytes } from 'node:crypto';
import { request as httpRequest } from 'node:http';

export function prepareFixtures(workspace, root, env) {
  const identity = `release-probe-${randomUUID()}`;
  const skillDir = join(workspace, '.agents', 'skills', identity);
  mkdirSync(skillDir, { recursive: true });
  const skillContent = `---\nname: ${identity}\ndescription: Isolated release acceptance fixture\ntrigger:\n  keywords: [${identity}]\n---\nReturn the release fixture marker.\n`;
  writeFileSync(join(skillDir, 'SKILL.md'), skillContent);
  const blockedIdentity = `blocked-${randomUUID()}`;
  const outsideSkill = join(root, 'outside-skill.md');
  writeFileSync(outsideSkill, skillContent.replaceAll(identity, blockedIdentity));
  const blockedDir = join(workspace, '.agents', 'skills', blockedIdentity);
  mkdirSync(blockedDir);
  symlinkSync(outsideSkill, join(blockedDir, 'SKILL.md'));
  const sentinel = join(root, 'outside-sentinel.txt');
  const sentinelContent = `outside-${randomUUID()}`;
  writeFileSync(sentinel, sentinelContent);
  symlinkSync(sentinel, join(workspace, 'outside-link.txt'));
  writeFileSync(join(workspace, 'tracked.txt'), 'baseline\n');
  let gitError;
  try {
    // The only commit is in this disposable fixture repository.
    for (const args of [
      ['init', '--quiet'], ['add', 'tracked.txt'],
      ['-c', 'user.name=Release Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture'],
    ]) execFileSync('git', args, { cwd: workspace, env, stdio: 'pipe', timeout: 10000 });
    writeFileSync(join(workspace, 'tracked.txt'), 'modified-release-fixture\n');
  } catch { gitError = 'Git dependency or disposable repository initialization failed'; }
  return { identity, blockedIdentity, skillContent, sentinel, sentinelContent, gitError };
}

export function isolatedEnvironment(root, inherited = process.env, { download = false } = {}) {
  const env = {};
  for (const name of ['PATH', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TERM']) {
    if (inherited[name] !== undefined) env[name] = inherited[name];
  }
  for (const name of ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']) {
    if (!inherited[name]) continue;
    try {
      const proxy = new URL(inherited[name]);
      if (download || (!proxy.username && !proxy.password)) env[name] = inherited[name];
    } catch { /* 非法代理配置不进入验收环境。 */ }
  }
  Object.assign(env, {
    HOME: join(root, 'home'), USERPROFILE: join(root, 'home'),
    XDG_CACHE_HOME: join(root, 'cache'), TMPDIR: join(root, 'tmp'),
    npm_config_cache: join(root, 'npm-cache'), npm_config_userconfig: join(root, 'npmrc'),
    npm_config_globalconfig: join(root, 'global-npmrc'),
    LAPDEV_HOST: '127.0.0.1', TLS_ENABLED: 'false',
    CAPABILITY_POLICY_PROFILE: 'local-trusted', DEPLOYMENT_PROFILE: 'local-trusted',
    LAPDEV_KV_PATH: join(root, 'state.kv'),
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: join(root, 'gitconfig'),
    NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1',
  });
  for (const path of [env.HOME, env.XDG_CACHE_HOME, env.TMPDIR]) mkdirSync(path, { recursive: true });
  return env;
}

export async function cleanupInstances(instances) {
  const errors = [];
  for (const instance of [...instances].reverse()) {
    try { await instance.close(); }
    catch { errors.push(new Error('Runtime instance cleanup failed')); }
  }
  if (errors.length) throw new AggregateError(errors, `${errors.length} runtime cleanup failure(s)`);
}

export async function requestJSON(base, path, { body, headers = {}, timeoutMs = 5000, method } = {}) {
  const response = await fetch(`${base}${path}`, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await response.json();
  return { status: response.status, data };
}

function success(result) {
  assert.ok(result.status >= 200 && result.status < 300, `HTTP ${result.status}: ${JSON.stringify(result.data)}`);
  assert.equal(result.data.status, 'success', JSON.stringify(result.data));
  return result.data;
}

export function assertDenied(result, status, code) {
  assert.equal(result.status, status, `expected rejection HTTP ${status}, got ${result.status}`);
  assert.equal(result.data.error?.code, code, 'incorrect rejection contract');
}

export async function collectChecks(checks, report = console.log) {
  const results = [];
  for (const [name, check] of checks) {
    try {
      const evidence = await check();
      results.push({ name, status: 'pass', evidence: evidence || 'assertions passed' });
    } catch (error) {
      results.push({ name, status: 'fail', evidence: error.message });
    }
    report(JSON.stringify(results.at(-1)));
  }
  const failed = results.filter(result => result.status === 'fail');
  if (failed.length) {
    const error = new Error(`Release acceptance failed: ${failed.map(result => result.name).join(', ')}`);
    error.results = results;
    throw error;
  }
  return results;
}

export async function websocketExchange(base, message, predicate, timeoutMs = 5000) {
  const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/ws`);
  try {
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('WebSocket acknowledgement timeout')), timeoutMs);
      function finish(error, value) {
        clearTimeout(timer);
        ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
        error ? reject(error) : resolve(value);
      }
      ws.onopen = () => ws.send(JSON.stringify(message));
      ws.onmessage = event => {
        try { const value = JSON.parse(event.data); if (predicate(value)) finish(null, value); }
        catch (error) { finish(error); }
      };
      ws.onerror = () => finish(new Error('WebSocket connection failed'));
      ws.onclose = () => finish(new Error('WebSocket closed before acknowledgement'));
    });
  } finally { ws.close(); }
}

// Use an actual Upgrade request so rejection status is observable, and so session
// cookies can be supplied without relying on a browser's cookie jar.
export async function websocketUpgrade(base, cookie, timeoutMs = 5000) {
  return await new Promise((resolve, reject) => {
    const req = httpRequest(`${base}/ws`, { headers: {
      Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13',
      'Sec-WebSocket-Key': randomBytes(16).toString('base64'), Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
    } });
    const timer = setTimeout(() => req.destroy(new Error('WebSocket Upgrade timeout')), timeoutMs);
    req.on('error', error => { clearTimeout(timer); reject(error); });
    req.on('upgrade', (res, socket) => {
      clearTimeout(timer);
      socket.destroy();
      resolve({ status: res.statusCode, data: {} });
    });
    req.on('response', res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        clearTimeout(timer);
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { reject(new Error(`invalid WebSocket rejection response (HTTP ${res.statusCode})`)); }
      });
      res.on('error', error => { clearTimeout(timer); reject(error); });
    });
    req.end();
  });
}

// 带会话 Cookie 的真实消息交换；客户端帧按 RFC 6455 掩码。
export async function sessionWebsocketExchange(base, cookie, message, predicate, timeoutMs = 5000) {
  return await new Promise((resolve, reject) => {
    let socket;
    let buffer = Buffer.alloc(0);
    const key = randomBytes(16).toString('base64');
    const req = httpRequest(`${base}/ws`, { headers: {
      Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Version': '13',
      'Sec-WebSocket-Key': key, Origin: base, Cookie: cookie,
    } });
    const timer = setTimeout(() => finish(new Error('Session WebSocket message timeout')), timeoutMs);
    let finished = false;
    function finish(error, value) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket?.destroy();
      req.destroy();
      error ? reject(error) : resolve(value);
    }
    function consume(chunk) {
      buffer = Buffer.concat([buffer, chunk]);
      try {
        while (buffer.length >= 2) {
          const opcode = buffer[0] & 15;
          let length = buffer[1] & 127;
          let offset = 2;
          if (length === 126) { if (buffer.length < 4) return; length = buffer.readUInt16BE(2); offset = 4; }
          if (length === 127 || length > 65535 || (buffer[1] & 128)) throw new Error('Unsupported server WebSocket frame');
          if (buffer.length < offset + length) return;
          const payload = buffer.subarray(offset, offset + length);
          buffer = buffer.subarray(offset + length);
          if (opcode === 8) throw new Error('Session WebSocket closed before response');
          if (opcode === 1) {
            const value = JSON.parse(payload.toString());
            if (predicate(value)) return finish(null, value);
          }
        }
      } catch (error) { finish(error); }
    }
    req.on('error', () => finish(new Error('Session WebSocket connection failed')));
    req.on('response', res => { res.resume(); finish(new Error(`Session WebSocket rejected (HTTP ${res.statusCode})`)); });
    req.on('upgrade', (res, upgraded, head) => {
      socket = upgraded;
      socket.on('error', () => finish(new Error('Session WebSocket socket failed')));
      socket.on('close', () => finish(new Error('Session WebSocket closed before response')));
      socket.on('data', consume);
      const payload = Buffer.from(JSON.stringify(message));
      assert.ok(payload.length < 126, 'fixture WebSocket message too large');
      const mask = randomBytes(4);
      const masked = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]));
      socket.write(Buffer.concat([Buffer.from([0x81, 0x80 | payload.length]), mask, masked]));
      if (head.length) consume(head);
    });
    req.end();
  });
}

export function assertMessageDenied(message) {
  assert.equal(message.type, 'error', `restricted WebSocket operation succeeded: ${message.type}`);
  assert.equal(message.code, 'CAPABILITY_DENIED', 'restricted message lacks capability rejection');
}

export async function runAcceptance({ base, workspace, fixtures, env, startRemote, report }) {
  const api = (path, options) => requestJSON(base, path, options);
  const file = '/workspace/acceptance.txt';
  const hasFixture = skills => Array.isArray(skills) && skills.some(skill =>
    skill.name === fixtures.identity && skill.source === 'codex-primary' &&
    skill.content === 'Return the release fixture marker.');
  const checks = [
    ['files', async () => {
      success(await api('/api/v1/files/create', { body: { path: file, type: 'file', content: 'created' } }));
      assert.equal(success(await api(`/api/v1/files/read?path=${encodeURIComponent(file)}`)).data.content, 'created');
      success(await api('/api/v1/files/write', { body: { path: file, content: 'updated' } }));
      assert.equal(success(await api(`/api/v1/files/read?path=${encodeURIComponent(file)}`)).data.content, 'updated');
      const tree = success(await api('/api/v1/files/tree?path=/workspace&depth=3')).data;
      assert.ok(tree.children.some(entry => entry.name === 'acceptance.txt' && entry.type === 'file'));
      assert.equal(readFileSync(join(workspace, 'acceptance.txt'), 'utf8'), 'updated');
    }],
    ['git', async () => {
      assert.ok(!fixtures.gitError, fixtures.gitError);
      const status = success(await api('/api/v1/git/status')).data;
      assert.ok(status.changes.some(change => change.path === 'tracked.txt' && change.status === 'modified'));
      const diff = success(await api('/api/v1/git/diff?path=tracked.txt')).data.diff;
      assert.ok(diff.includes('-baseline') && diff.includes('+modified-release-fixture'), 'Git diff missing fixture change');
    }],
    ['websocket', () => websocketExchange(base, { type: 'subscribe' }, value => value.type === 'subscribed').then(() => 'received subscribed acknowledgement')],
    ['terminal', async () => {
      let sessionId;
      try {
        sessionId = success(await api('/api/v1/terminal/create', { body: {} })).sessionId;
        assert.equal(typeof sessionId, 'string');
        // Construct the marker inside the shell: echoed input cannot satisfy this assertion.
        const marker = `release-output-${randomUUID()}`;
        success(await api('/api/v1/terminal/command', { body: { sessionId, command: `if [ -z "\${OPENAI_API_KEY}\${AWS_SECRET_ACCESS_KEY}\${GITHUB_TOKEN}\${CUSTOM_PASSWORD}" ]; then printf '%s%s\\n' '${marker.slice(0, 16)}' '${marker.slice(16)}'; fi` } }));
        const deadline = Date.now() + 10000;
        let output = '';
        while (Date.now() < deadline) {
          output += success(await api(`/api/v1/terminal/output?sessionId=${encodeURIComponent(sessionId)}`)).output;
          if (output.includes(marker)) break;
          await new Promise(done => setTimeout(done, 100));
        }
        assert.ok(output.includes(marker), 'terminal output marker timeout');
      } finally {
        if (sessionId) success(await api('/api/v1/terminal/close', { body: { sessionId } }));
      }
      const closed = await api(`/api/v1/terminal/output?sessionId=${encodeURIComponent(sessionId)}`);
      assert.equal(closed.status, 400);
      assert.equal(closed.data.message, 'Session not found');
    }],
    ['skills-load', async () => {
      const loaded = await api('/api/v1/skills/load');
      assert.equal(loaded.status, 200);
      assert.ok(hasFixture(loaded.data.skills), `workspace Codex fixture absent: ${JSON.stringify(loaded.data)}`);
    }],
    ['skills-list', async () => {
      const list = await api('/api/v1/skills/list');
      assert.equal(list.status, 200);
      assert.ok(hasFixture(list.data), 'workspace Codex fixture absent from list');
    }],
    ['skills-match', async () => {
      const matched = await api('/api/v1/skills/match', { body: { query: fixtures.identity } });
      assert.equal(matched.status, 200);
      assert.ok(hasFixture(matched.data), 'workspace Codex fixture absent from match');
    }],
    ['skills-project-boundary', async () => {
      const loaded = await api('/api/v1/skills/load');
      const listed = await api('/api/v1/skills/list');
      const matched = await api('/api/v1/skills/match', { body: { query: fixtures.blockedIdentity } });
      for (const result of [loaded, listed, matched]) assert.equal(result.status, 200);
      for (const skills of [loaded.data.skills, listed.data, matched.data]) {
        assert.ok(Array.isArray(skills));
        assert.ok(!skills.some(skill => skill.name === fixtures.blockedIdentity), 'outside project skill was loaded');
      }
      assert.ok(loaded.data.diagnostics?.some(diagnostic => diagnostic.severity === 'error'), 'missing project boundary diagnostic');
    }],
    ['lsp-status', async () => {
      const status = success(await api('/api/v1/lsp/status?language=typescript'));
      assert.equal(typeof status.running, 'boolean');
      assert.equal(status.running, false, 'fresh runtime unexpectedly reports running LSP');
      const dependencies = {};
      for (const tool of ['typescript-language-server', 'rust-analyzer', 'pylsp', 'gopls']) {
        try { execFileSync(tool, ['--version'], { env, stdio: 'pipe', timeout: 3000 }); dependencies[tool] = 'available'; }
        catch (error) { dependencies[tool] = error.code === 'ENOENT' ? 'missing' : 'version probe failed'; }
      }
      return { running: status.running, dependencies, coverage: 'status contract only; no language functionality or server installation' };
    }],
    ...[fixtures.sentinel, '../outside-sentinel.txt', '/workspace/../outside-sentinel.txt', '/workspace/outside-link.txt'].flatMap((path, index) => [
      [`workspace-boundary-read-${index}`, async () => {
        const read = await api(`/api/v1/files/read?path=${encodeURIComponent(path)}`);
        assert.equal(read.status, 404, `outside read was not rejected: ${path}`);
        assert.equal(read.data.status, 'error');
        assert.equal(read.data.message, 'Invalid workspace path');
      }],
      [`workspace-boundary-write-${index}`, async () => {
        const write = await api('/api/v1/files/write', { body: { path, content: 'must-not-write' } });
        assert.equal(write.status, 403, `outside write was not rejected: ${path}`);
        assert.equal(write.data.status, 'error');
      }],
    ]),
    ['workspace-boundary-sentinel', () => assert.equal(readFileSync(fixtures.sentinel, 'utf8'), fixtures.sentinelContent, 'outside sentinel changed')],
    ['remote-authorization', async () => {
      const remote = await startRemote();
      try {
        const probes = [
          ['/api/v1/files/tree?path=/workspace'], ['/api/v1/git/status'],
          ['/api/v1/terminal/create', { body: {} }], ['/api/v1/lsp/status?language=typescript'],
          ['/api/v1/skills/list'], ['/api/v1/ai/config'], ['/api/v1/agent/list-files', { body: {} }], ['/api/bmad/status'],
        ];
        for (const [path, options] of probes) assertDenied(await requestJSON(remote.base, path, options), 401, 'UNAUTHENTICATED');
        assertDenied(await websocketUpgrade(remote.base), 401, 'UNAUTHENTICATED');
        const exchange = await fetch(`${remote.base}/api/v1/auth/session`, {
          method: 'POST', headers: { Authorization: `Bearer ${remote.token}` }, signal: AbortSignal.timeout(5000),
        });
        assert.equal(exchange.status, 200, 'temporary session exchange failed');
        await exchange.arrayBuffer();
        const cookie = exchange.headers.get('set-cookie')?.split(';', 1)[0];
        assert.ok(cookie, 'session exchange missing cookie');
        success(await requestJSON(remote.base, probes[0][0], { headers: { Cookie: cookie } }));
        assert.equal((await websocketUpgrade(remote.base, cookie)).status, 101, 'authenticated files WebSocket rejected');
        for (const [path, options] of probes.slice(1)) assertDenied(await requestJSON(remote.base, path, { ...options, headers: { Cookie: cookie } }), 403, 'CAPABILITY_DENIED');
        return 'anonymous API/WS rejected; session grants files only';
      } finally { await remote.close(); }
    }],
    ...[
      ['remote-ws-files', { type: 'subscribe' }, value => value.type === 'subscribed' || value.type === 'error', value => assert.equal(value.type, 'subscribed')],
      ['remote-ws-git-denied', { type: 'subscribeToGit' }, value => value.type === 'gitSubscribed' || value.type === 'error', assertMessageDenied],
      ['remote-ws-terminal-denied', { type: 'terminalRegister', sessionId: 'release-fixture' }, value => value.type === 'terminalRegistered' || value.type === 'error', assertMessageDenied],
    ].map(([name, message, predicate, verify]) => [name, async () => {
      const remote = await startRemote();
      try {
        const exchange = await fetch(`${remote.base}/api/v1/auth/session`, {
          method: 'POST', headers: { Authorization: `Bearer ${remote.token}` }, signal: AbortSignal.timeout(5000),
        });
        assert.equal(exchange.status, 200);
        await exchange.arrayBuffer();
        const cookie = exchange.headers.get('set-cookie')?.split(';', 1)[0];
        assert.ok(cookie, 'session exchange missing cookie');
        const probe = message.type === 'terminalRegister'
          ? { ...message, sessionId: cookie.slice(cookie.indexOf('=') + 1) }
          : message;
        verify(await sessionWebsocketExchange(remote.base, cookie, probe, predicate));
      } finally { await remote.close(); }
    }]),
  ];
  return await collectChecks(checks, report);
}

export async function stopProcessGroup(child, exited, graceMs = 3000) {
  if (!child?.pid) return;
  // The launcher may already have exited while its descendants are still alive.
  try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  let timer;
  try { await Promise.race([exited.catch(() => {}), new Promise(done => { timer = setTimeout(done, graceMs); })]); }
  finally { clearTimeout(timer); }
  try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
}
