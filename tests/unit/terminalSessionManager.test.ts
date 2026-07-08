import { assertEquals, assertExists } from 'https://deno.land/std@0.200.0/testing/asserts.ts';
import { TerminalSessionManager } from '../../backend/src/services/terminalSessionManager.ts';

Deno.test('[P0] TerminalSessionManager should create a new session', () => {
  const manager = new TerminalSessionManager();
  const session = manager.create();

  assertExists(session);
  assertExists(session.sessionId);
  assertEquals(session.status, 'active');
});

Deno.test('[P0] TerminalSessionManager should close an existing session', () => {
  const manager = new TerminalSessionManager();
  const session = manager.create();
  const sessionId = session.sessionId;

  const result = manager.close(sessionId);
  assertEquals(result, true);

  const closedSession = manager.get(sessionId);
  assertEquals(closedSession, undefined);
});

Deno.test('[P0] TerminalSessionManager should track multiple sessions', () => {
  const manager = new TerminalSessionManager();

  const session1 = manager.create();
  const session2 = manager.create();
  const session3 = manager.create();

  assertEquals(manager.list().length, 3);
  assertExists(manager.get(session1.sessionId));
  assertExists(manager.get(session2.sessionId));
  assertExists(manager.get(session3.sessionId));
});

Deno.test('[P1] TerminalSessionManager should return undefined for non-existent session', () => {
  const manager = new TerminalSessionManager();
  const session = manager.get('non-existent-session');
  assertEquals(session, undefined);
});

Deno.test('[P1] TerminalSessionManager should handle closing non-existent session', () => {
  const manager = new TerminalSessionManager();
  const result = manager.close('non-existent-session');
  assertEquals(result, false);
});

Deno.test('[P1] TerminalSessionManager should resize session', () => {
  const manager = new TerminalSessionManager();
  const session = manager.create();

  const result = manager.resize(session.sessionId, 80, 24);
  assertEquals(result, true);
});

Deno.test('[P2] TerminalSessionManager should return false when resizing non-existent session', () => {
  const manager = new TerminalSessionManager();
  const result = manager.resize('non-existent-session', 80, 24);
  assertEquals(result, false);
});

Deno.test('[P2] TerminalSessionManager should clear all sessions', () => {
  const manager = new TerminalSessionManager();
  manager.create();
  manager.create();
  assertEquals(manager.list().length, 2);

  manager.clear();
  assertEquals(manager.list().length, 0);
});