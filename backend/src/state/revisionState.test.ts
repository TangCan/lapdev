import { assertEquals } from 'jsr:@std/assert@1';
import { canApplyEvent, createEvent, RevisionState } from './revisionState.ts';

Deno.test('revision state rejects stale mutations and advances monotonically', () => {
  const state = new RevisionState({ file: 'a' });
  assertEquals(state.mutate(1, { file: 'b' }), null);
  assertEquals(state.mutate(0, { file: 'b' })?.revision, 1);
  assertEquals(state.mutate(0, { file: 'c' }), null);
});

Deno.test('event envelope carries required identity and revision metadata', () => {
  const event = createEvent({ type: 'file.updated', workspaceId: 'w', sessionId: 's', revision: 2, requestId: 'r', payload: { path: 'a' } });
  assertEquals(event.version, 1);
  assertEquals(canApplyEvent(1, event.revision), true);
  assertEquals(canApplyEvent(2, event.revision), false);
});
