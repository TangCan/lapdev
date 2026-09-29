export interface RemotePolicyContext {
  principalId: string;
  workspaceId: string;
  sessionId: string;
}

export interface CapabilityRule {
  capability: string;
  principalId?: string;
  workspaceId?: string;
  sessionId?: string;
}

/** A deny-by-default policy for capabilities exposed by remote-shared. */
export class CapabilityPolicy {
  constructor(private readonly rules: readonly CapabilityRule[]) {}

  evaluate(context: RemotePolicyContext, capability: string): boolean {
    return this.rules.some((rule) =>
      rule.capability === capability &&
      (!rule.principalId || rule.principalId === context.principalId) &&
      (!rule.workspaceId || rule.workspaceId === context.workspaceId) &&
      (!rule.sessionId || rule.sessionId === context.sessionId)
    );
  }
}
