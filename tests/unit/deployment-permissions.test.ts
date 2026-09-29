import { assert, assertStringIncludes } from 'jsr:@std/assert@1';

Deno.test('release entrypoint uses explicit profile permissions', async () => {
  const source = await Deno.readTextFile(new URL('../../scripts/entrypoint.sh', import.meta.url));
  assert(!source.includes(' deno run --no-lock -A '));
  assert(!source.includes('--allow-all'));
  assertStringIncludes(source, 'local-trusted)');
  assertStringIncludes(source, 'remote-shared)');
  assertStringIncludes(source, '--allow-read=/app/backend,/app/frontend/dist,/app/_bmad,/workspace,/tmp');
  assertStringIncludes(source, '--allow-write=/workspace');
  assertStringIncludes(source, '--allow-run=git');
});

Deno.test('remote entrypoint requires explicit profile and bounded optional grants', async () => {
  const source = await Deno.readTextFile(new URL('../../scripts/entrypoint.sh', import.meta.url));
  assertStringIncludes(source, 'DENO_NET_ALLOWLIST');
  assertStringIncludes(source, 'DENO_RUN_ALLOWLIST');
  assert(source.includes('Invalid deployment profile'));

  const workflow = await Deno.readTextFile(new URL('../../.github/workflows/build-and-push.yml', import.meta.url));
  assertStringIncludes(workflow, 'DENO_BIN=./deno ./scripts/release-permission-gate.sh');
  assertStringIncludes(workflow, 'DEPLOYMENT_PROFILE=remote-shared');
});
