import { assert, assertEquals, assertNotEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { AuthSessionStore, extractBootstrapToken } from './authSession.ts';

const options = {
  bootstrapToken: 'bootstrap-secret-for-test',
  workspaceId: 'workspace-test',
  capabilities: ['files'] as const,
  ttlMs: 1_000,
  now: () => 10_000,
};

Deno.test('exchanges the bootstrap token for an opaque short-lived session cookie', () => {
  const store = new AuthSessionStore(options);
  const exchange = store.exchangeBootstrapToken(options.bootstrapToken);

  assert(exchange);
  assertNotEquals(exchange.session.sessionId, options.bootstrapToken);
  assertEquals(exchange.session.workspaceId, options.workspaceId);
  assertEquals(exchange.session.expiresAt, 11_000);
  assertStringIncludes(exchange.setCookie, 'Secure');
  assertStringIncludes(exchange.setCookie, 'HttpOnly');
  assertStringIncludes(exchange.setCookie, 'SameSite=Lax');
  assertStringIncludes(exchange.setCookie, 'Path=/');
  assert(!exchange.setCookie.includes(options.bootstrapToken));
});

Deno.test('rejects forged or malformed bootstrap credentials without creating a session', () => {
  const store = new AuthSessionStore(options);

  assertEquals(store.exchangeBootstrapToken('forged-token'), null);
  assertEquals(store.exchangeBootstrapToken(''), null);
  assertEquals(store.size, 0);
});

Deno.test('resolves a session cookie from current server state', () => {
  let now = 10_000;
  const store = new AuthSessionStore({ ...options, now: () => now });
  const exchange = store.exchangeBootstrapToken(options.bootstrapToken);
  assert(exchange);

  const resolved = store.resolveRequest(new Request('http://localhost/', {
    headers: { Cookie: exchange.cookieHeader },
  }));
  assert(resolved);
  assertEquals(resolved.sessionId, exchange.session.sessionId);
  assertEquals(resolved.workspaceId, options.workspaceId);

  now = 11_001;
  assertEquals(store.resolveRequest(new Request('http://localhost/', {
    headers: { Cookie: exchange.cookieHeader },
  })), null);
});

Deno.test('accepts bearer sessions for websocket and non-browser clients', () => {
  const store = new AuthSessionStore(options);
  const exchange = store.exchangeBootstrapToken(options.bootstrapToken);
  assert(exchange);

  const resolved = store.resolveRequest(new Request('http://localhost/ws', {
    headers: { Authorization: `Bearer ${exchange.session.sessionId}` },
  }));
  assert(resolved);
  assertEquals(resolved.sessionId, exchange.session.sessionId);
});

Deno.test('does not treat malformed or unrelated cookies as session credentials', () => {
  const store = new AuthSessionStore(options);
  assertEquals(store.resolveRequest(new Request('http://localhost/', {
    headers: { Cookie: 'other=value; __Host-lapdev_session=' },
  })), null);
  assertEquals(extractBootstrapToken(new Request('http://localhost/', {
    headers: { Authorization: 'Basic bootstrap-secret-for-test' },
  })), null);
});

Deno.test('revocation invalidates a session before its expiry', () => {
  const store = new AuthSessionStore(options);
  const exchange = store.exchangeBootstrapToken(options.bootstrapToken);
  assert(exchange);
  store.revoke(exchange.session.sessionId);
  assertEquals(store.resolveRequest(new Request('http://localhost/', {
    headers: { Authorization: `Bearer ${exchange.session.sessionId}` },
  })), null);
});
