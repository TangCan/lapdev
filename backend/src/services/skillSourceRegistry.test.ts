import { assertEquals } from 'jsr:@std/assert@1';
import { SkillSourceRegistry } from './skillSourceRegistry.ts';
Deno.test('skill source registry preserves identity, priority and failed metadata', () => {
  const registry = new SkillSourceRegistry();
  registry.register({ id: 'codex', path: '.agents/skills', label: 'codex-primary', enabled: true, priority: 100, status: 'available' });
  registry.register({ id: 'legacy', path: '.lapdev/skills', label: 'lapdev-legacy', enabled: true, priority: 10, status: 'available' });
  registry.setStatus('legacy', 'failed', 'parse failure');
  assertEquals(registry.list()[0].id, 'codex');
  assertEquals(registry.list()[1].error, 'parse failure');
});
