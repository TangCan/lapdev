import { assert, assertEquals } from 'jsr:@std/assert@1';
import { authorizeCapability, capabilityForPath, currentPolicyProfile, resolveCapabilityContext } from './capability.ts';

Deno.test('local trusted context has a stable identity and allows default capability', () => {
  const context = resolveCapabilityContext(new Request('http://localhost/api/v1/files/tree'), ['files']);
  assertEquals(context.userId, 'local-user');
  assertEquals(authorizeCapability(context, 'files').allowed, true);
});

Deno.test('remote shared profile rejects privileged requests without authentication', () => {
  const previous = Deno.env.get('CAPABILITY_POLICY_PROFILE');
  Deno.env.set('CAPABILITY_POLICY_PROFILE', 'remote-shared');
  try {
    const context = resolveCapabilityContext(new Request('http://localhost/api/v1/files/tree'), ['files']);
    const decision = authorizeCapability(context, 'files');
    assertEquals(currentPolicyProfile(), 'remote-shared');
    assertEquals(decision.code, 'UNAUTHENTICATED');
  } finally {
    if (previous === undefined) Deno.env.delete('CAPABILITY_POLICY_PROFILE');
    else Deno.env.set('CAPABILITY_POLICY_PROFILE', previous);
  }
});

Deno.test('capability allow-list rejects a capability outside the request context', () => {
  const previous = Deno.env.get('CAPABILITY_ALLOWLIST');
  Deno.env.set('CAPABILITY_ALLOWLIST', 'files');
  try {
    const request = new Request('http://localhost/api/v1/git/status');
    const context = resolveCapabilityContext(request, []);
    assertEquals(authorizeCapability(context, 'git').code, 'CAPABILITY_DENIED');
    assert(capabilityForPath('/api/v1/agent/read-file') === 'agent');
  } finally {
    if (previous === undefined) Deno.env.delete('CAPABILITY_ALLOWLIST');
    else Deno.env.set('CAPABILITY_ALLOWLIST', previous);
  }
});
