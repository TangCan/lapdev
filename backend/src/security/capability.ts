export type PolicyProfile = 'local-trusted' | 'remote-shared';
export type Capability = 'files' | 'terminal' | 'git' | 'lsp' | 'ai' | 'agent' | 'bmad' | 'skills';

export interface CapabilityContext {
  requestId: string;
  userId: string;
  workspaceId: string;
  sessionId: string;
  capabilities: Capability[];
  profile: PolicyProfile;
  authenticated: boolean;
}

export interface PolicyDecision {
  allowed: boolean;
  code: 'ALLOWED' | 'UNAUTHENTICATED' | 'CAPABILITY_DENIED';
  message: string;
}

const PRIVILEGED = new Set<Capability>(['files', 'terminal', 'git', 'lsp', 'ai', 'agent', 'bmad', 'skills']);

function header(req: Request, name: string, fallback: string): string {
  return req.headers.get(name) || fallback;
}

export function currentPolicyProfile(): PolicyProfile {
  return Deno.env.get('CAPABILITY_POLICY_PROFILE') === 'remote-shared' ? 'remote-shared' : 'local-trusted';
}

export function resolveCapabilityContext(req: Request, capabilities: Capability[] = []): CapabilityContext {
  const authorization = req.headers.get('Authorization');
  const profile = currentPolicyProfile();
  const requestId = header(req, 'X-Request-Id', crypto.randomUUID());
  const authenticated = typeof authorization === 'string' && authorization.trim().length > 0;
  const configured = (Deno.env.get('CAPABILITY_ALLOWLIST') || '').split(',').map((value) => value.trim()).filter(Boolean) as Capability[];
  return {
    requestId,
    userId: header(req, 'X-User-Id', profile === 'local-trusted' ? 'local-user' : ''),
    workspaceId: header(req, 'X-Workspace-Id', Deno.env.get('WORKSPACE_ID') || 'default-workspace'),
    sessionId: header(req, 'X-Session-Id', 'http-request'),
    capabilities: [...new Set([...capabilities, ...configured])],
    profile,
    authenticated,
  };
}

export function authorizeCapability(context: CapabilityContext, capability: Capability): PolicyDecision {
  if (!PRIVILEGED.has(capability)) return { allowed: false, code: 'CAPABILITY_DENIED', message: `Unknown capability: ${capability}` };
  if (context.profile === 'remote-shared' && (!context.authenticated || !context.userId)) {
    return { allowed: false, code: 'UNAUTHENTICATED', message: 'Authentication is required for privileged operations' };
  }
  if (context.profile === 'remote-shared' && context.capabilities.length === 0) {
    return { allowed: false, code: 'CAPABILITY_DENIED', message: 'No privileged capabilities are enabled by policy' };
  }
  if (context.capabilities.length > 0 && !context.capabilities.includes(capability)) {
    return { allowed: false, code: 'CAPABILITY_DENIED', message: `Capability denied: ${capability}` };
  }
  return { allowed: true, code: 'ALLOWED', message: 'Allowed' };
}

export function capabilityError(context: CapabilityContext, decision: PolicyDecision): Response {
  return new Response(JSON.stringify({ error: { code: decision.code, message: decision.message, requestId: context.requestId } }), {
    status: decision.code === 'UNAUTHENTICATED' ? 401 : 403,
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': context.requestId },
  });
}

export function auditCapabilityDecision(context: CapabilityContext, capability: Capability, decision: PolicyDecision): void {
  console.info(JSON.stringify({ type: 'capability_decision', requestId: context.requestId, userId: context.userId || 'anonymous', workspaceId: context.workspaceId, sessionId: context.sessionId, capability, profile: context.profile, allowed: decision.allowed, code: decision.code }));
}

export function capabilityForPath(pathname: string): Capability | null {
  if (pathname.startsWith('/api/v1/files')) return 'files';
  if (pathname.startsWith('/api/v1/terminal')) return 'terminal';
  if (pathname.startsWith('/api/v1/git')) return 'git';
  if (pathname.startsWith('/api/v1/lsp')) return 'lsp';
  if (pathname.startsWith('/api/v1/ai')) return 'ai';
  if (pathname.startsWith('/api/v1/agent')) return 'agent';
  if (pathname.startsWith('/api/bmad')) return 'bmad';
  if (pathname.startsWith('/api/v1/skills')) return 'skills';
  return null;
}
