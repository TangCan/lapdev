import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { createSecurityAuditEvent, emitSecurityAuditEvent } from './audit.ts';

Deno.test('security audit event uses a versioned correlated envelope', () => {
  const event = createSecurityAuditEvent({
    outcome: 'denied',
    reason: 'capability-denied',
    principalId: 'operator-1',
    workspaceId: 'workspace-1',
    sessionId: 'session-1',
    requestId: 'request-1',
    revision: 7,
    prompt: 'private prompt',
    apiKey: 'secret-key',
  });
  assertEquals(event.version, 1);
  assertEquals(event.outcome, 'denied');
  assertEquals(event.correlation.requestId, 'request-1');
  assertEquals(event.details.prompt, '[REDACTED]');
  assertEquals(event.details.apiKey, '[REDACTED]');
});

Deno.test('audit emission serializes safe metadata only', () => {
  const output = emitSecurityAuditEvent({
    outcome: 'allowed', reason: 'policy-match', principalId: 'p', workspaceId: 'w', sessionId: 's', requestId: 'r', revision: 1,
    apiKey: 'credential',
  });
  assertStringIncludes(output, 'security_audit');
  assertEquals(output.includes('credential'), false);
});
