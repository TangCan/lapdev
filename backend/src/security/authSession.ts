export interface AuthenticatedSession {
  sessionId: string;
  principalId: string;
  workspaceId: string;
  capabilities: string[];
  expiresAt: number;
}

export interface AuthSessionStoreOptions {
  bootstrapToken: string;
  workspaceId: string;
  capabilities?: readonly string[];
  ttlMs?: number;
  now?: () => number;
  principalId?: string;
}

export interface SessionExchange {
  session: AuthenticatedSession;
  cookieHeader: string;
  setCookie: string;
}

const SESSION_COOKIE = '__Host-lapdev_session';
const DEFAULT_TTL_MS = 15 * 60 * 1_000;

function constantTimeEquals(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  return match?.[1] || null;
}

function cookieValue(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie') || '';
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name === SESSION_COOKIE) return part.slice(separator + 1).trim() || null;
  }
  return null;
}

export class AuthSessionStore {
  private readonly sessions = new Map<string, AuthenticatedSession>();
  private readonly bootstrapToken: string;
  private readonly workspaceId: string;
  private readonly capabilities: string[];
  private readonly ttlMs: number;
  private readonly now: () => number;
  private readonly principalId: string;

  constructor(options: AuthSessionStoreOptions) {
    this.bootstrapToken = options.bootstrapToken;
    this.workspaceId = options.workspaceId;
    this.capabilities = [...new Set(options.capabilities || [])];
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.now = options.now ?? Date.now;
    this.principalId = options.principalId ?? 'remote-operator';
  }

  get size(): number {
    this.pruneExpired();
    return this.sessions.size;
  }

  exchangeBootstrapToken(token: string): SessionExchange | null {
    if (!this.bootstrapToken || !constantTimeEquals(token, this.bootstrapToken)) return null;

    const session: AuthenticatedSession = {
      sessionId: crypto.randomUUID(),
      principalId: this.principalId,
      workspaceId: this.workspaceId,
      capabilities: [...this.capabilities],
      expiresAt: this.now() + this.ttlMs,
    };
    this.sessions.set(session.sessionId, session);
    const cookie = `${SESSION_COOKIE}=${session.sessionId}; Max-Age=${Math.floor(this.ttlMs / 1_000)}; Secure; HttpOnly; SameSite=Lax; Path=/`;
    return { session, cookieHeader: cookie.split(';', 1)[0], setCookie: cookie };
  }

  resolveRequest(request: Request): AuthenticatedSession | null {
    const credential = bearerToken(request) || cookieValue(request);
    if (!credential) return null;
    const session = this.sessions.get(credential);
    if (!session || session.expiresAt <= this.now()) {
      if (session) this.sessions.delete(credential);
      return null;
    }
    return { ...session, capabilities: [...session.capabilities] };
  }

  revoke(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private pruneExpired(): void {
    const now = this.now();
    for (const [sessionId, session] of this.sessions) {
      if (session.expiresAt <= now) this.sessions.delete(sessionId);
    }
  }
}

export function extractBootstrapToken(request: Request): string | null {
  return bearerToken(request);
}
