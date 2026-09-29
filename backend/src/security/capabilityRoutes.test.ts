import { assertEquals } from 'jsr:@std/assert@1';
import { capabilityForPath } from './capability.ts';

Deno.test('all workspace adapter route families share a capability gate', () => {
  const routes: Record<string, string> = {
    '/api/v1/files/tree': 'files',
    '/api/v1/files/format': 'files',
    '/api/v1/agent/read-file': 'agent',
    '/api/v1/agent/write-file': 'agent',
    '/api/v1/git/status': 'git',
    '/api/v1/git/commit': 'git',
    '/api/v1/lsp/completion': 'lsp',
    '/api/v1/lsp/rename': 'lsp',
  };
  for (const [route, capability] of Object.entries(routes)) {
    assertEquals(capabilityForPath(route), capability, route);
  }
});

Deno.test('unrelated routes do not accidentally inherit a workspace capability', () => {
  assertEquals(capabilityForPath('/health'), null);
  assertEquals(capabilityForPath('/api/v1/unknown'), null);
});
