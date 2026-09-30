import { assert, assertEquals } from 'jsr:@std/assert@1';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

Deno.test('real HTTP routes and WebSocket upgrades share safe server audit correlation', async () => {
  const root = await Deno.makeTempDir({ prefix: 'lapdev-http-audit-' });
  const reservation = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const port = (reservation.addr as Deno.NetAddr).port;
  reservation.close();
  const base = `http://127.0.0.1:${port}`;
  const bootstrap = 'synthetic-real-server-bootstrap';
  const bodyCredential = 'synthetic-unverified-body-credential';
  const command = 'sudo synthetic-private-command';
  const workspace = `${root}/workspace`;
  await Deno.mkdir(workspace);
  const env: Record<string, string> = {
    HOME: root, TMPDIR: root, XDG_CACHE_HOME: `${root}/cache`,
    PORT: String(port), LAPDEV_HOST: '127.0.0.1', TLS_ENABLED: 'false',
    WORKSPACE_PATH: workspace, WORKSPACE_ID: 'http-audit-workspace',
    DEPLOYMENT_PROFILE: 'remote-shared', CAPABILITY_POLICY_PROFILE: 'remote-shared',
    CAPABILITY_ALLOWLIST: 'files,terminal', LAPDEV_REMOTE_ACCESS_TOKEN: bootstrap,
    NO_PROXY: '127.0.0.1,localhost', no_proxy: '127.0.0.1,localhost',
  };
  // Reuse dependency cache only; never inherit provider, proxy or auth settings.
  const cache = Deno.env.get('DENO_DIR');
  if (cache) env.DENO_DIR = cache;
  else {
    const cacheEnv: Record<string, string> = {};
    for (const key of ['HOME', 'XDG_CACHE_HOME']) {
      const value = Deno.env.get(key);
      if (value) cacheEnv[key] = value;
    }
    const info = await new Deno.Command(Deno.execPath(), {
      args: ['info', '--json'], clearEnv: true, env: cacheEnv,
      signal: AbortSignal.timeout(3000), stdout: 'piped', stderr: 'null',
    }).output();
    assertEquals(info.code, 0);
    env.DENO_DIR = JSON.parse(new TextDecoder().decode(info.stdout)).denoDir;
  }
  const child = new Deno.Command(Deno.execPath(), {
    args: ['run', '--no-lock', '--no-check', '--allow-all', '--config',
      new URL('../../deno.json', import.meta.url).pathname, new URL('../main.ts', import.meta.url).pathname],
    cwd: root, clearEnv: true, env, stdin: 'null', stdout: 'piped', stderr: 'piped',
  }).spawn();
  let output = '';
  async function capture(stream: ReadableStream<Uint8Array>) {
    const decoder = new TextDecoder();
    for await (const chunk of stream) output += decoder.decode(chunk, { stream: true });
    output += decoder.decode();
  }
  const readers = Promise.all([capture(child.stdout), capture(child.stderr)]);
  let exited = false;
  const status = child.status.then((value) => { exited = true; return value; });
  function audits() {
    return output.split('\n').filter((line) => line.startsWith('{"type":"security_audit"')).map((line) => JSON.parse(line));
  }
  async function waitFor(predicate: () => boolean, label: string) {
    const deadline = Date.now() + 15000;
    while (!predicate() && !exited && Date.now() < deadline) await delay(20);
    assert(predicate(), label); // Do not print subprocess logs containing possible credentials.
  }
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(3000) });
    const body = await response.json();
    return { response, body };
  }
  async function upgrade(headers: Record<string, string>) {
    const conn = await Deno.connect({ hostname: '127.0.0.1', port });
    const timer = setTimeout(() => { try { conn.close(); } catch { /* already closed */ } }, 3000);
    try {
      const lines = ['GET /ws HTTP/1.1', `Host: 127.0.0.1:${port}`, 'Connection: Upgrade', 'Upgrade: websocket',
        'Sec-WebSocket-Version: 13', 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
        ...Object.entries(headers).map(([key, value]) => `${key}: ${value}`), '', ''];
      const bytes = new TextEncoder().encode(lines.join('\r\n'));
      let sent = 0;
      while (sent < bytes.length) sent += await conn.write(bytes.subarray(sent));
      let result = '';
      const buffer = new Uint8Array(4096);
      while (!result.includes('\r\n\r\n')) {
        const count = await conn.read(buffer);
        assert(count !== null, 'upgrade response ended before headers');
        result += new TextDecoder().decode(buffer.subarray(0, count));
        assert(result.length < 16384, 'bounded upgrade headers');
      }
      return Number(/^HTTP\/1.1 (\d+)/.exec(result)?.[1]);
    } finally { clearTimeout(timer); try { conn.close(); } catch { /* timeout closed it */ } }
  }
  try {
    await waitFor(() => output.includes(`Listening on http://127.0.0.1:${port}`), 'server starts on loopback');
    const exchange = await request('/api/v1/auth/session', { method: 'POST', headers: { Authorization: `Bearer ${bootstrap}` } });
    assertEquals(exchange.response.status, 200);
    const cookie = exchange.response.headers.get('Set-Cookie')!.split(';')[0];
    const credential = cookie.slice(cookie.indexOf('=') + 1);
    const terminal = await request('/api/v1/terminal/command', { method: 'POST', headers: { Cookie: cookie },
      body: JSON.stringify({ sessionId: bodyCredential, command }) });
    assertEquals(terminal.response.status, 403);
    assertEquals(terminal.body.error.code, 'HIGH_RISK_COMMAND');
    const id = terminal.body.error.requestId;
    assert(id);
    assertEquals(terminal.response.headers.get('X-Request-Id'), id);
    await waitFor(() => audits().filter((event) => event.correlation.requestId === id).length === 2, 'both route audits emitted');
    const [entry, denial] = audits().filter((event) => event.correlation.requestId === id);
    assertEquals(entry.reason, 'ALLOWED'); assertEquals(denial.reason, 'high-risk-command');
    assertEquals(entry.correlation.sessionId, denial.correlation.sessionId);
    const safeId = entry.correlation.sessionId;
    assert(safeId && safeId !== credential && safeId !== bodyCredential);
    assertEquals(denial.correlation.principalId, 'remote-operator');
    assertEquals(denial.correlation.workspaceId, 'http-audit-workspace');
    assert(denial.correlation.revision > entry.correlation.revision);
    for (const headers of [{ Cookie: cookie }, { Authorization: `Bearer ${credential}` }] as Record<string, string>[]) {
      const allowedId = crypto.randomUUID();
      const allowed = await request('/api/v1/files/tree?path=/workspace', { headers: { ...headers, 'X-Request-Id': allowedId } });
      assertEquals(allowed.response.status, 200);
      const deniedId = crypto.randomUUID();
      const denied = await request('/api/v1/git/status', { headers: { ...headers, 'X-Request-Id': deniedId } });
      assertEquals(denied.response.status, 403); assertEquals(denied.body.error.code, 'CAPABILITY_DENIED');
      const wsId = crypto.randomUUID();
      assertEquals(await upgrade({ ...headers, 'X-Request-Id': wsId }), 101);
      await waitFor(() => [allowedId, deniedId, wsId].every((requestId) => audits().some((event) => event.correlation.requestId === requestId)), 'HTTP and actual upgrade audit');
      for (const [requestId, reason] of [[allowedId, 'ALLOWED'], [deniedId, 'CAPABILITY_DENIED'], [wsId, 'ALLOWED']]) {
        const event = audits().find((event) => event.correlation.requestId === requestId)!;
        assertEquals(event.reason, reason); assertEquals(event.correlation.sessionId, safeId);
        assertEquals(event.correlation.principalId, 'remote-operator'); assertEquals(event.correlation.workspaceId, 'http-audit-workspace');
      }
    }
    for (const headers of [{ Cookie: `__Host-lapdev_session=${safeId}` }, { Authorization: `Bearer ${safeId}` }] as Record<string, string>[]) {
      const requestId = crypto.randomUUID();
      assertEquals((await request('/api/v1/files/tree', { headers })).response.status, 401);
      assertEquals(await upgrade({ ...headers, 'X-Request-Id': requestId }), 401);
      await waitFor(() => audits().some((event) => event.correlation.requestId === requestId), 'denied actual upgrade audit');
      assertEquals(audits().find((event) => event.correlation.requestId === requestId)!.reason, 'UNAUTHENTICATED');
    }
    // Drain logs after shutdown before checking every captured console channel.
    child.kill('SIGTERM');
    const shutdownTimer = setTimeout(() => { if (!exited) { try { child.kill('SIGKILL'); } catch { /* exited */ } } }, 3000);
    try { await status; await readers; } finally { clearTimeout(shutdownTimer); }
    for (const secret of [bootstrap, credential, cookie, bodyCredential, command]) assert(!output.includes(secret), 'credential or command leaked');
  } finally {
    if (!exited) child.kill('SIGKILL');
    const timer = setTimeout(() => { if (!exited) { try { child.kill('SIGKILL'); } catch { /* exited */ } } }, 3000);
    try { await status; await readers; } finally { clearTimeout(timer); await Deno.remove(root, { recursive: true }); }
  }
});
