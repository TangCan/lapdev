export function resolveProviderSecret(clientSecret?: string): string | null {
  if (Deno.env.get('CAPABILITY_POLICY_PROFILE') === 'remote-shared') {
    return Deno.env.get('LAPDEV_AI_API_KEY') || null;
  }
  return clientSecret || null;
}

export function maskSecretMetadata(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 6) return '***';
  return `${secret.slice(0, 2)}***${secret.slice(-2)}`;
}
