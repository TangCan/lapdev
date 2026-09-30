import { assert, assertEquals } from 'jsr:@std/assert@1';
import { AuthSessionStore } from './authSession.ts';
import { auditCapabilityDecision, authorizeCapability, capabilityError, capabilityForPath, currentPolicyProfile, nextAuditRevision, resolveCapabilityContext } from './capability.ts';

Deno.test('production HTTP and handshake audits isolate credentials across the session matrix', () => {
  const keys = ['CAPABILITY_POLICY_PROFILE', 'CAPABILITY_ALLOWLIST'];
  const previous = keys.map((key) => Deno.env.get(key));
  const original = console.info;
  const logs: string[] = [];
  console.info = (...values: unknown[]) => { logs.push(values.join(' ')); };
  let now = 0;
  const bootstrap = 'synthetic-bootstrap-audit-test';
  const store = new AuthSessionStore({ bootstrapToken: bootstrap, workspaceId: 'audit-matrix', ttlMs: 1000, now: () => now });
  const a = store.exchangeBootstrapToken(bootstrap)!;
  const b = store.exchangeBootstrapToken(bootstrap)!;
  function run(headers: HeadersInit, path = '/api/v1/files') {
    const context = resolveCapabilityContext(new Request(`http://localhost${path}`, { headers }), [], store);
    for (const capability of ['files', 'terminal'] as const) {
      auditCapabilityDecision(context, capability, authorizeCapability(context, capability));
    }
    return context;
  }
  try {
    Deno.env.set(keys[0], 'remote-shared'); Deno.env.set(keys[1], 'files');
    const cookie = run({ Cookie: a.cookieHeader, 'X-Request-Id': 'request-cookie', 'X-Session-Id': 'untrusted-audit-id' });
    const bearer = run({ Authorization: `Bearer ${a.session.sessionId}`, 'X-Request-Id': 'request-bearer' }, '/ws');
    assertEquals(cookie.auditSessionId, bearer.auditSessionId);
    const legacy = { ...cookie };
    delete legacy.auditSessionId;
    auditCapabilityDecision(legacy, 'files', authorizeCapability(legacy, 'files'));
    auditCapabilityDecision(legacy, 'files', authorizeCapability(legacy, 'files'));
    assertEquals(JSON.parse(logs.at(-1)!).correlation.sessionId, JSON.parse(logs.at(-2)!).correlation.sessionId);
    assert(cookie.auditSessionId !== run({ Cookie: b.cookieHeader }).auditSessionId);
    const attempts: HeadersInit[] = [{ Cookie: `__Host-lapdev_session=${cookie.auditSessionId}` }, { Authorization: `Bearer ${cookie.auditSessionId}` }, {}];
    for (const headers of attempts) {
      const context = run(headers);
      assertEquals(capabilityError(context, authorizeCapability(context, 'files')).status, 401);
    }
    store.revoke(a.session.sessionId);
    assertEquals(run({ Cookie: a.cookieHeader }).authenticated, false);
    now = 1001;
    assertEquals(run({ Authorization: `Bearer ${b.session.sessionId}` }).authenticated, false);
    Deno.env.set(keys[0], 'local-trusted');
    const local = run({ 'X-Session-Id': a.session.sessionId });
    delete local.auditSessionId;
    auditCapabilityDecision(local, 'files', authorizeCapability(local, 'files'));
    auditCapabilityDecision(local, 'files', authorizeCapability(local, 'files'));
    const events = logs.map((line) => JSON.parse(line));
    assertEquals(events.at(-1).correlation.sessionId, events.at(-2).correlation.sessionId);
    for (const event of events.slice(0, 4)) {
      assertEquals(event.version, 1);
      assertEquals(event.correlation.sessionId, cookie.auditSessionId);
      assertEquals(event.correlation.principalId, 'remote-operator');
      assertEquals(event.correlation.workspaceId, 'audit-matrix');
      assert(event.correlation.revision > 0);
    }
    assertEquals(events[0].correlation.requestId, 'request-cookie');
    assertEquals(events[2].correlation.requestId, 'request-bearer');
    assertEquals(events[0].outcome, 'allowed'); assertEquals(events[1].outcome, 'denied');
    for (const secret of [bootstrap, a.cookieHeader, a.session.sessionId, b.session.sessionId, 'untrusted-audit-id']) assert(!logs.join('\n').includes(secret));
  } finally {
    console.info = original;
    keys.forEach((key, index) => { if (previous[index] === undefined) Deno.env.delete(key); else Deno.env.set(key, previous[index]!); });
  }
});

Deno.test('local trusted context has a stable identity and allows default capability', () => {
  const context = resolveCapabilityContext(new Request('http://localhost/api/v1/files/tree'), ['files']);
  assertEquals(context.userId, 'local-user');
  assertEquals(authorizeCapability(context, 'files').allowed, true);
});

Deno.test('remote shared profile rejects privileged requests without authentication', () => {
  const previous = Deno.env.get('CAPABILITY_POLICY_PROFILE');
  Deno.env.set('CAPABILITY_POLICY_PROFILE', 'remote-shared');
  try {
    const context = resolveCapabilityContext(new Request('http://localhost/api/v1/files/tree'), ['files']);
    const decision = authorizeCapability(context, 'files');
    assertEquals(currentPolicyProfile(), 'remote-shared');
    assertEquals(decision.code, 'UNAUTHENTICATED');
  } finally {
    if (previous === undefined) Deno.env.delete('CAPABILITY_POLICY_PROFILE');
    else Deno.env.set('CAPABILITY_POLICY_PROFILE', previous);
  }
});

Deno.test('capability allow-list rejects a capability outside the request context', () => {
  const previous = Deno.env.get('CAPABILITY_ALLOWLIST');
  Deno.env.set('CAPABILITY_ALLOWLIST', 'files');
  try {
    const request = new Request('http://localhost/api/v1/git/status');
    const context = resolveCapabilityContext(request, []);
    assertEquals(authorizeCapability(context, 'git').code, 'CAPABILITY_DENIED');
    assert(capabilityForPath('/api/v1/agent/read-file') === 'agent');
  } finally {
    if (previous === undefined) Deno.env.delete('CAPABILITY_ALLOWLIST');
    else Deno.env.set('CAPABILITY_ALLOWLIST', previous);
  }
});

Deno.test('remote HTTP and WebSocket-shaped requests resolve the same authenticated context', () => {
  const previous = Deno.env.get('CAPABILITY_POLICY_PROFILE');
  const previousAllowlist = Deno.env.get('CAPABILITY_ALLOWLIST');
  Deno.env.set('CAPABILITY_POLICY_PROFILE', 'remote-shared');
  Deno.env.set('CAPABILITY_ALLOWLIST', 'files');
  try {
    const store = new AuthSessionStore({ bootstrapToken: 'bootstrap', workspaceId: 'workspace-1', capabilities: ['files'] });
    const exchange = store.exchangeBootstrapToken('bootstrap');
    assert(exchange);
    const httpContext = resolveCapabilityContext(new Request('http://localhost/api/v1/files/tree', {
      headers: { Cookie: exchange.cookieHeader },
    }), [], store, 'files');
    const wsContext = resolveCapabilityContext(new Request('http://localhost/ws', {
      headers: { Authorization: `Bearer ${exchange.session.sessionId}` },
    }), [], store);
    assertEquals(httpContext.userId, wsContext.userId);
    assertEquals(httpContext.workspaceId, wsContext.workspaceId);
    assertEquals(httpContext.sessionId, wsContext.sessionId);
    assertEquals(httpContext.profile, 'remote-shared');
    assertEquals(httpContext.requestedCapability, 'files');
    assertEquals(authorizeCapability(wsContext, 'files').allowed, true);
  } finally {
    if (previous === undefined) Deno.env.delete('CAPABILITY_POLICY_PROFILE');
    else Deno.env.set('CAPABILITY_POLICY_PROFILE', previous);
    if (previousAllowlist === undefined) Deno.env.delete('CAPABILITY_ALLOWLIST');
    else Deno.env.set('CAPABILITY_ALLOWLIST', previousAllowlist);
  }
});

Deno.test('audit revisions advance from a server-side workspace source', () => {
  const workspaceId = `revision-test-${crypto.randomUUID()}`;
  assertEquals(nextAuditRevision(workspaceId), 1);
  assertEquals(nextAuditRevision(workspaceId), 2);
});

Deno.test('capability audit events carry a non-zero revision', () => {
  const context = resolveCapabilityContext(new Request('http://localhost/api/v1/files/tree'), ['files']);
  const originalInfo = console.info;
  let serialized = '';
  console.info = (value?: unknown) => {
    serialized = String(value);
  };
  try {
    auditCapabilityDecision(context, 'files', { allowed: true, code: 'ALLOWED', message: 'Allowed' });
  } finally {
    console.info = originalInfo;
  }
  assert(JSON.parse(serialized).correlation.revision > 0);
});
