import { assertEquals, assert } from 'jsr:@std/assert@1';
import { AuthSessionStore } from '../security/authSession.ts';
import { resolveCapabilityContext } from '../security/capability.ts';
import { broadcastFileChange, broadcastGitStatus, getTerminalClient, handleWebSocket, registerTerminalClient, sendTerminalOutput, unregisterTerminalClient } from './fileWatcher.ts';

Deno.test('WebSocket 消息分发执行当前能力策略、会话有效性和终端绑定', async () => {
  const previous = ['CAPABILITY_POLICY_PROFILE', 'CAPABILITY_ALLOWLIST'].map((key) => [key, Deno.env.get(key)] as const);
  let now = Date.now();
  const store = new AuthSessionStore({ bootstrapToken: 'fixture', workspaceId: 'fixture', ttlMs: 1000, now: () => now });
  const sockets: ReturnType<typeof socket>[] = [];
  const terminalCalls: string[] = [];
  const loadTerminalHandlers = async () => ({
    flushPendingOutput: async (id: string) => { terminalCalls.push(`flush:${id}`); },
    forwardTerminalInput: async (id: string, input: string) => { terminalCalls.push(`input:${id}:${input}`); },
  });
  function socket() {
    return { readyState: WebSocket.OPEN, messages: [] as Record<string, unknown>[], closed: false,
      send(data: string) { this.messages.push(JSON.parse(data)); },
      close() { this.closed = true; },
      onmessage: undefined as undefined | ((event: { data: string }) => Promise<void>),
      onclose: undefined as undefined | (() => void) };
  }
  function connect(authenticated = true) {
    const exchange = store.exchangeBootstrapToken('fixture')!;
    const context = resolveCapabilityContext(new Request('http://localhost/ws', {
      headers: authenticated ? { Authorization: `Bearer ${exchange.session.sessionId}` } : {},
    }), [], store);
    const ws = socket();
    sockets.push(ws);
    handleWebSocket(ws, context, store, loadTerminalHandlers);
    return { ws, context };
  }
  async function send(ws: ReturnType<typeof socket>, type: string, sessionId?: string) {
    ws.messages.length = 0;
    await ws.onmessage!({ data: JSON.stringify({ type, sessionId, input: 'fixture' }) });
  }
  try {
    Deno.env.set('CAPABILITY_POLICY_PROFILE', 'remote-shared');
    Deno.env.set('CAPABILITY_ALLOWLIST', 'files');
    const { ws, context } = connect();
    context.capabilities.push('git', 'terminal');
    const owner = socket();
    for (const type of ['subscribeToGit', 'unsubscribeFromGit', 'terminalRegister', 'terminalInput', 'terminalUnregister']) {
      registerTerminalClient(context.sessionId, owner);
      await send(ws, type, context.sessionId);
      assertEquals(ws.messages[0]?.code, 'CAPABILITY_DENIED');
      assertEquals(getTerminalClient(context.sessionId), owner);
      unregisterTerminalClient(context.sessionId);
    }
    assertEquals(terminalCalls, []);
    ws.messages.length = 0;
    await broadcastGitStatus({ fixture: true });
    assertEquals(ws.messages, []);
    await send(ws, 'subscribe');
    assertEquals(ws.messages[0]?.type, 'subscribed');
    await send(ws, 'unsubscribe');
    assertEquals(ws.messages, []);
    Deno.env.set('CAPABILITY_ALLOWLIST', 'git,terminal');
    for (const type of ['subscribe', 'unsubscribe']) {
      await send(ws, type);
      assertEquals(ws.messages[0]?.code, 'CAPABILITY_DENIED');
    }
    await send(ws, 'subscribeToGit');
    assertEquals(ws.messages[0]?.type, 'gitSubscribed');
    await broadcastGitStatus({ fixture: true });
    assertEquals(ws.messages.at(-1)?.type, 'gitStatus');
    Deno.env.set('CAPABILITY_ALLOWLIST', 'files');
    await send(ws, 'unsubscribeFromGit');
    assertEquals(ws.messages[0]?.code, 'CAPABILITY_DENIED');
    const denial = [...ws.messages];
    await broadcastGitStatus({ fixture: true });
    assertEquals(ws.messages, denial);
    Deno.env.set('CAPABILITY_ALLOWLIST', 'git,terminal');
    await send(ws, 'unsubscribeFromGit');
    assertEquals(ws.messages[0]?.type, 'gitUnsubscribed');
    await send(ws, 'terminalRegister', context.sessionId);
    assertEquals(ws.messages[0]?.type, 'terminalRegistered');
    assertEquals(getTerminalClient(context.sessionId), ws);
    assertEquals(terminalCalls, [`flush:${context.sessionId}`]);
    for (const type of ['terminalRegister', 'terminalInput', 'terminalUnregister']) {
      await send(ws, type, 'other-session');
      assertEquals(ws.messages[0]?.code, 'SESSION_MISMATCH');
      assertEquals(getTerminalClient(context.sessionId), ws);
    }
    assertEquals(terminalCalls, [`flush:${context.sessionId}`]);
    await send(ws, 'terminalInput', context.sessionId);
    assertEquals(ws.messages, []);
    assertEquals(terminalCalls, [`flush:${context.sessionId}`, `input:${context.sessionId}:fixture`]);
    await send(ws, 'terminalUnregister', context.sessionId);
    assertEquals(getTerminalClient(context.sessionId), undefined);
    store.revoke(context.sessionId);
    await send(ws, 'subscribeToGit');
    assert(ws.closed);
    const expired = connect();
    now += 1001;
    await send(expired.ws, 'terminalRegister', expired.context.sessionId);
    assert(expired.ws.closed);
    const missing = connect(false);
    await send(missing.ws, 'subscribe');
    assert(missing.ws.closed);
    const anonymous = socket();
    sockets.push(anonymous);
    handleWebSocket(anonymous, undefined, store, loadTerminalHandlers);
    await send(anonymous, 'subscribe');
    assertEquals(anonymous.messages[0]?.code, 'CAPABILITY_DENIED');
    Deno.env.set('CAPABILITY_ALLOWLIST', 'files');
    const retainedRemote = connect();
    Deno.env.set('CAPABILITY_POLICY_PROFILE', 'local-trusted');
    Deno.env.delete('CAPABILITY_ALLOWLIST');
    const callsBeforeSwitch = [...terminalCalls];
    for (const type of ['subscribeToGit', 'unsubscribeFromGit', 'terminalRegister', 'terminalInput', 'terminalUnregister']) {
      await send(retainedRemote.ws, type, retainedRemote.context.sessionId);
      assertEquals(retainedRemote.ws.messages[0]?.code, 'CAPABILITY_DENIED');
      assertEquals(getTerminalClient(retainedRemote.context.sessionId), undefined);
      assertEquals(retainedRemote.ws.closed, false);
    }
    retainedRemote.ws.messages.length = 0;
    await broadcastGitStatus({ fixture: true });
    assertEquals(retainedRemote.ws.messages, []);
    assertEquals(terminalCalls, callsBeforeSwitch);
    const local = connect();
    await send(local.ws, 'subscribeToGit');
    assertEquals(local.ws.messages[0]?.type, 'gitSubscribed');
    await broadcastGitStatus({ fixture: true });
    assertEquals(local.ws.messages.at(-1)?.type, 'gitStatus');
    assertEquals(retainedRemote.ws.messages, []);
    await send(local.ws, 'subscribe');
    assertEquals(local.ws.messages[0]?.type, 'subscribed');
    await send(local.ws, 'terminalRegister', 'local-terminal');
    assertEquals(getTerminalClient('local-terminal'), local.ws);
    await send(local.ws, 'terminalUnregister', 'local-terminal');
    await send(local.ws, 'ping');
    assertEquals(local.ws.messages[0]?.type, 'pong');
    await send(local.ws, 'unknown');
    assertEquals(local.ws.messages[0]?.message, 'Unknown message type');
    await send(local.ws, 'constructor');
    assertEquals(local.ws.messages[0]?.message, 'Unknown message type');
  } finally {
    for (const ws of sockets) ws.onclose?.();
    for (const [key, value] of previous) {
      if (value === undefined) Deno.env.delete(key); else Deno.env.set(key, value);
    }
  }
});

Deno.test('业务出站：订阅、静默失效、动态能力、模式切换及异常隔离', async (t) => {
  const previous = ['CAPABILITY_POLICY_PROFILE', 'CAPABILITY_ALLOWLIST'].map((key) => [key, Deno.env.get(key)] as const);
  let now = 0;
  const store = new AuthSessionStore({ bootstrapToken: 'fixture', workspaceId: 'outbound-fixture', ttlMs: 1000, now: () => now });
  const sockets: ReturnType<typeof socket>[] = [];
  const audits: string[] = [];
  const logs: string[] = [];
  const credentials: string[] = [];
  const originalConsole = { info: console.info, log: console.log, error: console.error, warn: console.warn };
  for (const level of ['info', 'log', 'error', 'warn'] as const) {
    console[level] = (...args: unknown[]) => {
      const line = args.map(String).join(' '); logs.push(line);
      if (level === 'info') audits.push(line);
    };
  }
  function socket() {
    return {
      readyState: WebSocket.OPEN, messages: [] as Record<string, unknown>[], closed: false, fail: false,
      send(data: string) { if (this.fail) throw new Error(data); this.messages.push(JSON.parse(data)); },
      close() { this.closed = true; },
      onmessage: undefined as undefined | ((event: { data: string }) => Promise<void>),
      onclose: undefined as undefined | (() => void),
      onerror: undefined as undefined | (() => void),
    };
  }
  function connect(flush: (id: string) => Promise<void> = async () => {}) {
    const session = store.exchangeBootstrapToken('fixture')!.session;
    credentials.push(session.sessionId);
    const context = resolveCapabilityContext(new Request('http://localhost/ws', { headers: { Authorization: `Bearer ${session.sessionId}` } }), [], store);
    const ws = socket(); sockets.push(ws);
    handleWebSocket(ws, context, store, async () => ({ flushPendingOutput: flush, forwardTerminalInput: async () => {} }));
    return { ws, context };
  }
  async function message(ws: ReturnType<typeof socket>, type: string, sessionId?: string) {
    await ws.onmessage!({ data: JSON.stringify({ type, sessionId }) });
  }
  async function subscribe(client: ReturnType<typeof connect>) {
    await message(client.ws, 'subscribe');
    await message(client.ws, 'subscribeToGit');
    await message(client.ws, 'terminalRegister', client.context.sessionId);
    client.ws.messages.length = 0;
  }
  async function push(client: ReturnType<typeof connect>) {
    await broadcastFileChange('modify', '/workspace/private-payload');
    await broadcastGitStatus({ privatePayload: 'private-payload' });
    await sendTerminalOutput(client.context.sessionId, 'private-payload');
  }
  function reset() {
    for (const ws of sockets) ws.onclose?.();
    Deno.env.set('CAPABILITY_POLICY_PROFILE', 'remote-shared');
    Deno.env.set('CAPABILITY_ALLOWLIST', 'files,git,terminal');
    now = 0;
    audits.length = 0;
  }
  async function step(name: string, run: () => Promise<void>) {
    await t.step(name, async () => {
      try { await run(); } finally { for (const ws of sockets) ws.onclose?.(); }
      const captured = logs.join('\n');
      for (const credential of credentials) assert(!captured.includes(credential));
      assert(!captured.includes('private-payload'));
    });
  }
  try {
    await step('文件须显式订阅，取消没有确认，合法绑定终端保持原格式', async () => {
      reset(); const a = connect(); const b = connect();
      await broadcastFileChange('create', '/workspace/example');
      assertEquals(a.ws.messages, []); assertEquals(b.ws.messages, []);
      await subscribe(a); await push(a);
      assertEquals(a.ws.messages.map((m) => m.type), ['fileModified', 'gitStatus', 'terminalOutput']);
      assertEquals(a.ws.messages[0].path, '/workspace/private-payload');
      assertEquals(a.ws.messages[2].sessionId, a.context.sessionId);
      assertEquals(b.ws.messages, []);
      a.ws.messages.length = 0; await message(a.ws, 'unsubscribe');
      await broadcastFileChange('remove', '/workspace/example'); assertEquals(a.ws.messages, []);
      registerTerminalClient('wrong-binding', a.ws);
      await sendTerminalOutput('wrong-binding', 'private-payload');
      assertEquals(getTerminalClient('wrong-binding'), undefined); assertEquals(a.ws.messages, []);
      const bindingDenial = audits.map((line) => JSON.parse(line)).find((event) => event.reason === 'SESSION_MISMATCH');
      assert(bindingDenial); assertEquals(bindingDenial.outcome, 'denied');
      assertEquals(bindingDenial.details.capability, 'terminal');
      assertEquals(bindingDenial.correlation.requestId, a.context.requestId);
      assertEquals(bindingDenial.correlation.principalId, a.context.principalId);
      const correlated = audits.map((line) => JSON.parse(line)).filter((event) => event.correlation?.requestId === a.context.requestId);
      assertEquals(new Set(correlated.map((event) => event.correlation.sessionId)).size, 1);
      assert(bindingDenial.correlation.sessionId !== a.context.sessionId);
      assert(bindingDenial.correlation.sessionId !== a.context.auditSessionId);
      const untracked = socket(); registerTerminalClient('untracked', untracked);
      await sendTerminalOutput('untracked', 'private-payload');
      assertEquals(untracked.messages, []); assertEquals(getTerminalClient('untracked'), undefined);
    });
    for (const invalidation of ['revoke', 'expire'] as const) {
      for (const first of ['files', 'git', 'terminal'] as const) {
        await step(`静默${invalidation}由${first}首次推送检查，其他连接可用`, async () => {
          reset(); const a = connect(); await subscribe(a);
          if (invalidation === 'expire') now = 500;
          const b = connect(); await subscribe(b);
          if (invalidation === 'revoke') store.revoke(a.context.sessionId); else now = 1001;
          if (first === 'files') await broadcastFileChange('create', 'private-payload');
          if (first === 'git') await broadcastGitStatus({ secret: 'private-payload' });
          if (first === 'terminal') await sendTerminalOutput(a.context.sessionId, 'private-payload');
          await push(a); await sendTerminalOutput(b.context.sessionId, 'private-payload');
          assertEquals(a.ws.messages, []); assert(a.ws.closed);
          assertEquals(getTerminalClient(a.context.sessionId), undefined);
          assert(!b.ws.closed); assert(b.ws.messages.some((m) => m.type === 'gitStatus'));
          assert(b.ws.messages.some((m) => m.type === 'fileModified'));
          assert(b.ws.messages.some((m) => m.type === 'terminalOutput'));
          const denial = audits.map((line) => JSON.parse(line)).find((event) => event.outcome === 'denied' && event.correlation?.requestId === a.context.requestId);
          assert(denial); assertEquals(denial.correlation.principalId, a.context.principalId);
          assertEquals(denial.correlation.workspaceId, a.context.workspaceId);
          assert(denial.correlation.sessionId !== a.context.sessionId);
          const lifecycle = audits.map((line) => JSON.parse(line)).find((event) => event.type === 'security_session_invalidated' && event.requestId === a.context.requestId);
          assert(lifecycle); assertEquals(lifecycle.sessionId, denial.correlation.sessionId);
          assert(!audits.join('\n').includes('private-payload'));
        });
      }
    }
    for (const capability of ['files', 'git', 'terminal'] as const) {
      await step(`${capability}收紧仅移除对应映射，恢复须重新订阅或注册`, async () => {
        reset(); const a = connect(); await subscribe(a);
        Deno.env.set('CAPABILITY_ALLOWLIST', ['files', 'git', 'terminal'].filter((c) => c !== capability).join(','));
        await push(a);
        const deniedType = { files: 'fileModified', git: 'gitStatus', terminal: 'terminalOutput' }[capability];
        assert(!a.ws.messages.some((m) => m.type === deniedType)); assertEquals(a.ws.messages.length, 2); assert(!a.ws.closed);
        assert(audits.map((line) => JSON.parse(line)).some((event) => event.outcome === 'denied' && event.details?.capability === capability));
        Deno.env.set('CAPABILITY_ALLOWLIST', 'files,git,terminal'); a.ws.messages.length = 0;
        await push(a); assert(!a.ws.messages.some((m) => m.type === deniedType));
        await message(a.ws, { files: 'subscribe', git: 'subscribeToGit', terminal: 'terminalRegister' }[capability], a.context.sessionId);
        a.ws.messages.length = 0; await push(a); assertEquals(a.ws.messages.length, 3);
      });
    }
    await step('旧远程连接切换本地不提升授权', async () => {
      reset(); const a = connect(); await subscribe(a);
      const anonymous = socket(); sockets.push(anonymous);
      handleWebSocket(anonymous, undefined, store);
      Deno.env.set('CAPABILITY_POLICY_PROFILE', 'local-trusted'); Deno.env.delete('CAPABILITY_ALLOWLIST');
      await push(a); assertEquals(a.ws.messages, []); assert(!a.ws.closed);
      assertEquals(getTerminalClient(a.context.sessionId), undefined);
      await message(anonymous, 'subscribe');
      assertEquals(anonymous.messages[0]?.code, 'CAPABILITY_DENIED');
      anonymous.messages.length = 0;
      registerTerminalClient('anonymous-terminal', anonymous);
      await sendTerminalOutput('anonymous-terminal', 'private-payload');
      assertEquals(anonymous.messages, []);
      assertEquals(getTerminalClient('anonymous-terminal'), undefined);
    });
    await step('本地出站 Git 能力收紧与恢复须重新订阅', async () => {
      reset(); Deno.env.set('CAPABILITY_POLICY_PROFILE', 'local-trusted');
      const a = connect(); await subscribe(a);
      Deno.env.set('CAPABILITY_ALLOWLIST', 'files,terminal');
      await push(a);
      assertEquals(a.ws.messages.map((m) => m.type), ['fileModified', 'terminalOutput']); assert(!a.ws.closed);
      Deno.env.set('CAPABILITY_ALLOWLIST', 'files,git,terminal'); a.ws.messages.length = 0;
      await push(a); assertEquals(a.ws.messages.map((m) => m.type), ['fileModified', 'terminalOutput']);
      await message(a.ws, 'subscribeToGit'); a.ws.messages.length = 0;
      await push(a); assertEquals(a.ws.messages.map((m) => m.type), ['fileModified', 'gitStatus', 'terminalOutput']);
    });
    for (const failure of ['malformed', 'handler'] as const) {
      await step(`${failure}异常清理并关闭，保留其他连接`, async () => {
        reset(); const a = connect(async () => { throw new Error('private-payload'); }); const b = connect();
        await message(a.ws, 'subscribe'); await message(a.ws, 'subscribeToGit');
        await subscribe(b); a.ws.messages.length = 0;
        if (failure === 'malformed') {
          registerTerminalClient(a.context.sessionId, a.ws);
          await a.ws.onmessage!({ data: '{private-payload' });
        } else await message(a.ws, 'terminalRegister', a.context.sessionId);
        assert(a.ws.closed); assertEquals(getTerminalClient(a.context.sessionId), undefined);
        await push(a); await sendTerminalOutput(b.context.sessionId, 'private-payload');
        assertEquals(a.ws.messages, []); assertEquals(b.ws.messages.length, 3); assert(!b.ws.closed);
      });
    }
    for (const action of ['remove', 'revoke', 'deny', 'send-failure'] as const) {
      await step(`终端 flush ${action}后不能确认注册成功`, async () => {
        reset();
        let a: ReturnType<typeof connect>;
        a = connect(async (id) => {
          if (action === 'remove') unregisterTerminalClient(id);
          if (action === 'revoke') store.revoke(id);
          if (action === 'deny') Deno.env.set('CAPABILITY_ALLOWLIST', 'files,git');
          if (action === 'send-failure') { a.ws.fail = true; await sendTerminalOutput(id, 'private-payload'); }
        });
        await message(a.ws, 'terminalRegister', a.context.sessionId);
        assertEquals(a.ws.messages, []); assertEquals(getTerminalClient(a.context.sessionId), undefined);
        assertEquals(a.ws.closed, action === 'revoke' || action === 'send-failure');
      });
    }
    for (const first of ['files', 'git', 'terminal'] as const) {
      for (const failure of ['closed', 'send', 'error', 'missing-state'] as const) {
        await step(`${first}遇到${failure}清理全部映射且不影响其他连接`, async () => {
          reset(); const a = connect(); const b = connect(); await subscribe(a); await subscribe(b);
          if (failure === 'closed') a.ws.readyState = WebSocket.CLOSED;
          if (failure === 'send') a.ws.fail = true;
          if (failure === 'error') a.ws.onerror!();
          if (failure === 'missing-state') { a.ws.onclose!(); registerTerminalClient(a.context.sessionId, a.ws); }
          if (first === 'files') await broadcastFileChange('modify', 'private-payload');
          if (first === 'git') await broadcastGitStatus({ secret: 'private-payload' });
          if (first === 'terminal') await sendTerminalOutput(a.context.sessionId, 'private-payload');
          await push(a); await sendTerminalOutput(b.context.sessionId, 'private-payload');
          assertEquals(a.ws.messages, []); assertEquals(getTerminalClient(a.context.sessionId), undefined);
          if (failure === 'send' || failure === 'error') assert(a.ws.closed);
          assert(b.ws.messages.some((m) => m.type === 'terminalOutput'));
          a.ws.onclose!(); a.ws.onerror!();
        });
      }
    }
  } finally {
    for (const ws of sockets) ws.onclose?.();
    Object.assign(console, originalConsole);
    for (const [key, value] of previous) { if (value === undefined) Deno.env.delete(key); else Deno.env.set(key, value); }
  }
});
