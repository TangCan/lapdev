export type SkillSourceLabel = 'codex-primary' | 'lapdev-legacy' | 'user';
export interface SkillSource { id: string; path: string; label: SkillSourceLabel; enabled: boolean; priority: number; refreshedAt?: string; status: 'available' | 'disabled' | 'failed'; error?: string; }

export class SkillSourceRegistry {
  private sources = new Map<string, SkillSource>();
  register(source: SkillSource): void { this.sources.set(source.id, { ...source }); }
  setStatus(id: string, status: SkillSource['status'], error?: string): void {
    const source = this.sources.get(id); if (!source) throw new Error(`Unknown skill source: ${id}`);
    this.sources.set(id, { ...source, status, error, refreshedAt: new Date().toISOString() });
  }
  list(): SkillSource[] { return [...this.sources.values()].sort((a, b) => b.priority - a.priority); }
}
