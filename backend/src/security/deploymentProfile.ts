export type DeploymentProfileName = 'local-trusted' | 'remote-shared';
export type DeploymentPermission = 'filesystem-read' | 'filesystem-write' | 'network' | 'environment' | 'subprocess';

export interface DeploymentPermissionProfile {
  name: DeploymentProfileName;
  filesystem: { read: string[]; write: string[] };
  network: { hosts: string[] };
  environment: { names: string[] };
  subprocess: { commands: string[]; interactive: boolean };
}

const PROFILES: Record<DeploymentProfileName, DeploymentPermissionProfile> = {
  'local-trusted': {
    name: 'local-trusted',
    filesystem: { read: ['workspace', 'app'], write: ['workspace', 'app'] },
    network: { hosts: ['*'] },
    environment: { names: ['*'] },
    subprocess: { commands: ['git', 'node', 'npx', 'deno', 'openssl', 'script'], interactive: true },
  },
  'remote-shared': {
    name: 'remote-shared',
    filesystem: { read: ['workspace', 'app'], write: ['workspace'] },
    network: { hosts: ['configured-provider', 'localhost'] },
    environment: { names: ['LAPDEV_AI_API_KEY', 'WORKSPACE_ID', 'CAPABILITY_POLICY_PROFILE'] },
    subprocess: { commands: ['git', 'configured-lsp'], interactive: false },
  },
};

export class DeploymentProfileError extends Error {
  constructor(message: string) {
    super(`Invalid deployment profile: ${message}`);
    this.name = 'DeploymentProfileError';
  }
}

export function resolveDeploymentProfile(rawName = Deno.env.get('DEPLOYMENT_PROFILE') || 'local-trusted'):
  DeploymentPermissionProfile {
  if (typeof rawName !== 'string' || !Object.hasOwn(PROFILES, rawName)) {
    throw new DeploymentProfileError('profile must be local-trusted or remote-shared');
  }
  const profile = PROFILES[rawName as DeploymentProfileName];
  if (!profile.name || profile.filesystem.write.length === 0 || profile.subprocess.interactive && rawName === 'remote-shared') {
    throw new DeploymentProfileError('profile contract is malformed');
  }
  return structuredClone(profile);
}

export function deploymentPermissionAllowed(
  profile: DeploymentPermissionProfile,
  permission: DeploymentPermission,
  value: string,
  options: { interactive?: boolean } = {},
): boolean {
  if (permission === 'filesystem-read') return profile.filesystem.read.includes(value);
  if (permission === 'filesystem-write') return profile.filesystem.write.includes(value);
  if (permission === 'network') return profile.network.hosts.includes('*') || profile.network.hosts.includes(value);
  if (permission === 'environment') return profile.environment.names.includes('*') || profile.environment.names.includes(value);
  return profile.subprocess.commands.includes(value) && (!options.interactive || profile.subprocess.interactive);
}

export function validateDeploymentProfile(rawName = Deno.env.get('DEPLOYMENT_PROFILE') || 'local-trusted'):
  DeploymentPermissionProfile {
  return resolveDeploymentProfile(rawName);
}
