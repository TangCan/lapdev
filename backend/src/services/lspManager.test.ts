import { assertEquals } from 'jsr:@std/assert@1';
import { LspManager } from './lspManager.ts';
Deno.test('LSP manager owns workspace/session lifecycle and restart health', () => {
  const manager = new LspManager();
  const session = manager.start('w', 's', 'typescript');
  assertEquals(manager.stop(session.key), true);
  assertEquals(manager.restart(session.key)?.restartCount, 1);
  assertEquals(manager.get(session.key)?.status, 'running');
});
