import { assertEquals } from 'jsr:@std/assert@1';
import { CapabilityPolicy } from './remotePolicy.ts';

const context = {
  principalId: 'operator-1',
  workspaceId: 'workspace-1',
  sessionId: 'session-1',
};

Deno.test('remote policy denies capabilities without an explicit matching rule', () => {
  const policy = new CapabilityPolicy([{ capability: 'files', workspaceId: 'workspace-1' }]);
  assertEquals(policy.evaluate(context, 'terminal'), false);
  assertEquals(policy.evaluate({ ...context, workspaceId: 'workspace-2' }, 'files'), false);
  assertEquals(policy.evaluate({ ...context, sessionId: 'session-2' }, 'files'), false);
});

Deno.test('remote policy requires every configured scope to match', () => {
  const policy = new CapabilityPolicy([{
    capability: 'files',
    principalId: 'operator-1',
    workspaceId: 'workspace-1',
    sessionId: 'session-1',
  }]);
  assertEquals(policy.evaluate(context, 'files'), true);
  assertEquals(policy.evaluate({ ...context, principalId: 'operator-2' }, 'files'), false);
});
