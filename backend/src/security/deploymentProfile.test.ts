import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { DeploymentProfileError, deploymentPermissionAllowed, resolveDeploymentProfile } from './deploymentProfile.ts';

Deno.test('named deployment profiles resolve explicit permission contracts', () => {
  const profile = resolveDeploymentProfile('remote-shared');
  assertEquals(profile.name, 'remote-shared');
  assertEquals(profile.subprocess.interactive, false);
  assert(deploymentPermissionAllowed(profile, 'filesystem-write', 'workspace'));
  assert(!deploymentPermissionAllowed(profile, 'filesystem-write', 'app'));
  assert(!deploymentPermissionAllowed(profile, 'subprocess', 'git', { interactive: true }));
  assert(!deploymentPermissionAllowed(profile, 'environment', 'HOME'));
});

Deno.test('unknown deployment profiles fail with a safe diagnostic', async () => {
  await assertRejects(
    async () => {
      resolveDeploymentProfile('unsafe-profile');
    },
    DeploymentProfileError,
    'profile must be local-trusted or remote-shared',
  );
});
