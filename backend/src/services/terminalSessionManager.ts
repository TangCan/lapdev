export interface TerminalSession {
  sessionId: string;
  status: 'active' | 'closed';
}

export class TerminalSessionManager {
  private sessions = new Map<string, TerminalSession>();

  create(): TerminalSession {
    const sessionId = crypto.randomUUID();
    const session: TerminalSession = {
      sessionId,
      status: 'active',
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  close(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    this.sessions.delete(sessionId);
    return true;
  }

  get(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  list(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  resize(sessionId: string, _cols: number, _rows: number): boolean {
    const session = this.sessions.get(sessionId);
    return !!session;
  }

  clear(): void {
    this.sessions.clear();
  }
}