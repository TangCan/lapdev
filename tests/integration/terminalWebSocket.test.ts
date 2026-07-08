import { assertEquals, assertExists } from 'https://deno.land/std@0.200.0/testing/asserts.ts';
import { TerminalWebSocketHandler } from '../../backend/src/websocket/terminalWebSocket.ts';

Deno.test('[P0] TerminalWebSocketHandler should register terminal session', () => {
  const handler = new TerminalWebSocketHandler();
  const sessionId = 'test-session-123';

  const registerResult = handler.register(sessionId);
  assertEquals(registerResult, true);

  const client = handler.getClient(sessionId);
  assertExists(client);
});

Deno.test('[P0] TerminalWebSocketHandler should unregister terminal session', () => {
  const handler = new TerminalWebSocketHandler();
  const sessionId = 'test-session-456';

  handler.register(sessionId);
  const unregisterResult = handler.unregister(sessionId);
  assertEquals(unregisterResult, true);

  const client = handler.getClient(sessionId);
  assertEquals(client, undefined);
});

Deno.test('[P1] TerminalWebSocketHandler should broadcast to specific session', async () => {
  const handler = new TerminalWebSocketHandler();
  const sessionId = 'test-session-broadcast';

  handler.register(sessionId);
  const result = await handler.broadcast(sessionId, 'test output');
  assertEquals(result, true);
});

Deno.test('[P1] TerminalWebSocketHandler should handle unregistering non-existent session', () => {
  const handler = new TerminalWebSocketHandler();
  const result = handler.unregister('non-existent');
  assertEquals(result, false);
});

Deno.test('[P2] TerminalWebSocketHandler should list all registered sessions', () => {
  const handler = new TerminalWebSocketHandler();
  handler.register('session-1');
  handler.register('session-2');

  const sessions = handler.listSessions();
  assertEquals(sessions.length, 2);
});