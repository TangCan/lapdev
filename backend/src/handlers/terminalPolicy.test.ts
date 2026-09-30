import { assertEquals } from 'jsr:@std/assert@1';
import { AuthSessionStore } from '../security/authSession.ts';

// The default store captures its bootstrap token on module load. Initialize this
// test worker with a synthetic token and restore the environment immediately.
const bootstrapToken = 'synthetic-terminal-bootstrap';
const previousBootstrap = Deno.env.get('LAPDEV_REMOTE_ACCESS_TOKEN');
const previousWorkspace = Deno.env.get('WORKSPACE_ID');
const modules = await (async () => {
  Deno.env.set('LAPDEV_REMOTE_ACCESS_TOKEN', bootstrapToken);
  Deno.env.set('WORKSPACE_ID', 'terminal-fallback-workspace');
  try {
    return { terminal: await import('./terminalHandler.ts'), capability: await import('../security/capability.ts') };
  } finally {
    if (previousBootstrap === undefined) Deno.env.delete('LAPDEV_REMOTE_ACCESS_TOKEN'); else Deno.env.set('LAPDEV_REMOTE_ACCESS_TOKEN', previousBootstrap);
    if (previousWorkspace === undefined) Deno.env.delete('WORKSPACE_ID'); else Deno.env.set('WORKSPACE_ID', previousWorkspace);
  }
})();
const { handleTerminalCommand, isHighRiskCommand } = modules.terminal;
const { auditCapabilityDecision, authorizeCapability, resolveCapabilityContext, getRemoteAuthSessionStore } = modules.capability;

Deno.test('high-risk denial shares entry correlation without logging body credentials or command', async () => {
  const keys = ['CAPABILITY_POLICY_PROFILE', 'CAPABILITY_ALLOWLIST'];
  const previous = keys.map((key) => Deno.env.get(key));
  Deno.env.set(keys[0], 'local-trusted');
  Deno.env.set(keys[1], 'terminal');
  const req = new Request('http://localhost/api/v1/terminal/command', {
    method: 'POST', body: JSON.stringify({ sessionId: 'synthetic-body-credential', command: 'sudo synthetic-private-command' }),
  });
  const context = resolveCapabilityContext(req);
  const original = console.info;
  const logs: string[] = [];
  console.info = (value: unknown) => { logs.push(String(value)); };
  try {
    auditCapabilityDecision(context, 'terminal', authorizeCapability(context, 'terminal'));
    const response = await handleTerminalCommand(req, context);
    assertEquals(response.status, 403);
    assertEquals((await response.json()).error.code, 'HIGH_RISK_COMMAND');
    assertEquals(response.headers.get('X-Request-Id'), context.requestId);
    const events = logs.map((line) => JSON.parse(line));
    assertEquals(events[1].correlation.sessionId, events[0].correlation.sessionId);
    assertEquals(events[1].correlation.requestId, context.requestId);
    assertEquals(events[1].correlation.revision > events[0].correlation.revision, true);
    assertEquals(logs.join('').includes('synthetic-body-credential'), false);
    assertEquals(logs.join('').includes('sudo synthetic-private-command'), false);
  } finally {
    console.info = original;
    keys.forEach((key, index) => { if (previous[index] === undefined) Deno.env.delete(key); else Deno.env.set(key, previous[index]!); });
  }
});

Deno.test('remote terminal denial audits supplied context and omitted-context fallback', async () => {
  const keys = ['CAPABILITY_POLICY_PROFILE', 'CAPABILITY_ALLOWLIST'];
  const previous = keys.map((key) => Deno.env.get(key));
  const original = console.info;
  const logs: string[] = [];
  console.info = (value: unknown) => { logs.push(String(value)); };
  Deno.env.set(keys[0], 'remote-shared'); Deno.env.set(keys[1], 'terminal');
  const bootstrap = bootstrapToken;
  const store = new AuthSessionStore({ bootstrapToken: bootstrap, workspaceId: 'terminal-fixture', principalId: 'terminal-operator' });
  const session = store.exchangeBootstrapToken(bootstrap)!.session;
  const fallbackSession = getRemoteAuthSessionStore().exchangeBootstrapToken(bootstrap)!.session;
  try {
    for (const supplied of [true, false]) {
      const activeSession = supplied ? session : fallbackSession;
      const req = new Request('http://localhost/api/v1/terminal/command', { method: 'POST',
        headers: { Authorization: `Bearer ${activeSession.sessionId}` },
        body: JSON.stringify({ sessionId: activeSession.sessionId, command: 'sudo synthetic-private-command' }) });
      const context = resolveCapabilityContext(req, [], supplied ? store : getRemoteAuthSessionStore());
      assertEquals(context.authenticated, true);
      const response = await handleTerminalCommand(req, supplied ? context : undefined);
      const body = await response.json();
      const event = JSON.parse(logs.at(-1)!);
      assertEquals(response.status, 403); assertEquals(body.error.code, 'HIGH_RISK_COMMAND');
      assertEquals(response.headers.get('X-Request-Id'), body.error.requestId);
      assertEquals(event.correlation.requestId, body.error.requestId);
      assertEquals(event.correlation.sessionId, context.auditSessionId);
      assertEquals(typeof event.correlation.sessionId, 'string');
      assertEquals(event.correlation.sessionId.length > 0, true);
      assertEquals(event.correlation.principalId, supplied ? 'terminal-operator' : 'remote-operator');
      assertEquals(event.correlation.workspaceId, supplied ? 'terminal-fixture' : 'terminal-fallback-workspace');
    }
    assertEquals(logs.join('').includes(session.sessionId), false);
    assertEquals(logs.join('').includes(fallbackSession.sessionId), false);
    assertEquals(logs.join('').includes(bootstrap), false);
    assertEquals(logs.join('').includes('sudo synthetic-private-command'), false);
  } finally {
    getRemoteAuthSessionStore().revoke(fallbackSession.sessionId);
    console.info = original;
    keys.forEach((key, index) => { if (previous[index] === undefined) Deno.env.delete(key); else Deno.env.set(key, previous[index]!); });
  }
});

Deno.test('terminal policy identifies destructive and privileged commands', () => {
  assertEquals(isHighRiskCommand('sudo apt install x'), true);
  assertEquals(isHighRiskCommand('rm -rf /'), true);
  assertEquals(isHighRiskCommand('git reset --hard HEAD'), true);
  assertEquals(isHighRiskCommand('printf "hello"'), false);
});
