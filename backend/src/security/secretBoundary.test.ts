import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { resolveProviderSecret, maskSecretMetadata } from './secretBoundary.ts';

Deno.test('remote provider secrets come only from deployment environment', () => {
  const previousProfile = Deno.env.get('CAPABILITY_POLICY_PROFILE');
  const previousKey = Deno.env.get('LAPDEV_AI_API_KEY');
  Deno.env.set('CAPABILITY_POLICY_PROFILE', 'remote-shared');
  Deno.env.set('LAPDEV_AI_API_KEY', 'deployment-secret');
  try {
    assertEquals(resolveProviderSecret('browser-secret'), 'deployment-secret');
  } finally {
    if (previousProfile === undefined) Deno.env.delete('CAPABILITY_POLICY_PROFILE'); else Deno.env.set('CAPABILITY_POLICY_PROFILE', previousProfile);
    if (previousKey === undefined) Deno.env.delete('LAPDEV_AI_API_KEY'); else Deno.env.set('LAPDEV_AI_API_KEY', previousKey);
  }
});

Deno.test('secret metadata is masked and never contains the original value', () => {
  const metadata = maskSecretMetadata('deployment-secret');
  assertStringIncludes(metadata, '***');
  assertEquals(metadata.includes('deployment-secret'), false);
});
