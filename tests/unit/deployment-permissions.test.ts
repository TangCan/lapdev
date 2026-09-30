import { assert, assertStringIncludes } from 'jsr:@std/assert@1';

Deno.test('legacy Docker workflow is manual-only and image publishing stays disabled', async () => {
  const workflow = await Deno.readTextFile(new URL('../../.github/workflows/build-and-push.yml', import.meta.url));
  const triggers = workflow.split('\non:\n')[1]?.split('\nenv:\n')[0];
  assert(triggers);
  assertStringIncludes(triggers, 'workflow_dispatch:');
  assert(!/^\s+(push|pull_request|schedule):/m.test(triggers));
  assertStringIncludes(workflow, "PUBLISH_IMAGE: 'false'");
});

Deno.test('release entrypoint uses explicit profile permissions', async () => {
  const source = await Deno.readTextFile(new URL('../../scripts/entrypoint.sh', import.meta.url));
  assert(!source.includes(' deno run --no-lock -A '));
  assert(!source.includes('--allow-all'));
  assertStringIncludes(source, 'local-trusted)');
  assertStringIncludes(source, 'remote-shared)');
  assertStringIncludes(source, '--allow-read=/app/backend,/app/frontend/dist,/app/_bmad,/workspace,/tmp');
  assertStringIncludes(source, '--allow-write=/workspace');
  assertStringIncludes(source, '--allow-run=git');
  assertStringIncludes(source, '--allow-env=HOME,USERPROFILE,PORT');
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
