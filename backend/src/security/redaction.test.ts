import { assertEquals } from 'jsr:@std/assert@1';
import { redactAuditRecord } from './redaction.ts';
Deno.test('redacts secrets and truncates large audit values', () => {
  const result = redactAuditRecord({ apiKey: 'secret', prompt: 'private', message: 'x'.repeat(600) });
  assertEquals(result.apiKey, '[REDACTED]');
  assertEquals(result.prompt, '[REDACTED]');
  assertEquals(String(result.message).endsWith('[TRUNCATED]'), true);
});
