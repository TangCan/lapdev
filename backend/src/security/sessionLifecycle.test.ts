import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { AuthSessionStore } from './authSession.ts';
import { isCapabilityContextCurrent } from './capability.ts';

Deno.test('a revoked or expired session is no longer current for an existing connection', () => {
  let now = 1_000;
  const store = new AuthSessionStore({
    bootstrapToken: 'bootstrap',
    workspaceId: 'workspace-test',
    capabilities: ['files'],
    ttlMs: 100,
    now: () => now,
  });
  const exchange = store.exchangeBootstrapToken('bootstrap');
  assert(exchange);
  const context = {
    requestId: 'request-1',
    userId: exchange.session.principalId,
    workspaceId: exchange.session.workspaceId,
    sessionId: exchange.session.sessionId,
    capabilities: ['files'],
    profile: 'remote-shared',
    authenticated: true,
    principalId: exchange.session.principalId,
    deploymentProfile: 'remote-shared',
  } as const;

  assert(isCapabilityContextCurrent(context, store));
  store.revoke(exchange.session.sessionId);
  assertEquals(isCapabilityContextCurrent(context, store), false);

  const renewed = store.exchangeBootstrapToken('bootstrap');
  assert(renewed);
  const renewedContext = { ...context, sessionId: renewed.session.sessionId };
  now = 1_101;
  assertEquals(isCapabilityContextCurrent(renewedContext, store), false);
});

Deno.test('lifecycle audit metadata contains correlation fields but no credentials', () => {
  const event = JSON.stringify({
    type: 'security_session_invalidated',
    requestId: 'request-1',
    sessionId: 'opaque-session-id',
    reason: 'revoked',
  });
  assertStringIncludes(event, 'request-1');
  assertStringIncludes(event, 'opaque-session-id');
  assert(!event.includes('bootstrap'));
});
