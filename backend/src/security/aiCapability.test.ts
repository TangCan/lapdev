import { assertEquals } from 'jsr:@std/assert@1';
import { capabilityForPath } from './capability.ts';
import { redactAuditRecord } from './redaction.ts';

Deno.test('all AI provider entry points share the ai capability gate', () => {
  for (const route of ['/api/v1/ai/config', '/api/v1/ai/test', '/api/v1/ai/chat', '/api/v1/ai/chat/stream', '/api/v1/ai/completion']) {
    assertEquals(capabilityForPath(route), 'ai', route);
  }
});

Deno.test('AI audit data redacts keys and sensitive prompts', () => {
  const redacted = redactAuditRecord({ apiKey: 'sk-live-secret', prompt: 'private user context' });
  assertEquals(redacted.apiKey, '[REDACTED]');
  assertEquals(redacted.prompt, '[REDACTED]');
});
