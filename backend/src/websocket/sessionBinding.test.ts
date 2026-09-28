import { assertEquals } from 'jsr:@std/assert@1';
import { isSessionBound } from './fileWatcher.ts';

Deno.test('session binding policy rejects a mismatched terminal session', () => {
  assertEquals(isSessionBound({ sessionId: 'session-a' } as never, 'session-b'), false);
  assertEquals(isSessionBound({ sessionId: 'session-a' } as never, 'session-a'), true);
  assertEquals(isSessionBound(undefined, 'session-b'), true);
});
