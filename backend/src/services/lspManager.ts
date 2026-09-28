export interface LspSession { key: string; workspaceId: string; sessionId: string; language: string; status: 'running' | 'stopped' | 'failed'; restartCount: number; }
export class LspManager {
  private sessions = new Map<string, LspSession>();
  start(workspaceId: string, sessionId: string, language: string): LspSession {
    const key = `${workspaceId}:${sessionId}:${language}`;
    const current = this.sessions.get(key);
    const next = { key, workspaceId, sessionId, language, status: 'running' as const, restartCount: current?.restartCount ?? 0 };
    this.sessions.set(key, next); return { ...next };
  }
  stop(key: string): boolean { const current = this.sessions.get(key); if (!current) return false; this.sessions.set(key, { ...current, status: 'stopped' }); return true; }
  restart(key: string): LspSession | undefined { const current = this.sessions.get(key); if (!current) return undefined; const next = { ...current, status: 'running' as const, restartCount: current.restartCount + 1 }; this.sessions.set(key, next); return { ...next }; }
  get(key: string): LspSession | undefined { const value = this.sessions.get(key); return value && { ...value }; }
}
