export interface SkillTrigger {
  keywords?: string[];
  patterns?: (string | RegExp)[];
}

export interface Skill {
  id?: string;
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  trigger: SkillTrigger;
  content: string;
  fileName: string;
  publishedAt?: string;
  publishedBy?: string;
  downloadUrl?: string;
  matchScore?: number;
  source?: 'codex-primary' | 'lapdev-legacy' | 'lapdev-global';
}

export interface SkillDiscoveryDiagnostic {
  code: 'duplicate' | 'missing-skill-file' | 'parse-failure' | 'source-unavailable';
  source: string;
  path: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface SkillLoadResult {
  skills: Skill[];
  globalCount: number;
  projectCount: number;
  diagnostics?: SkillDiscoveryDiagnostic[];
  sources?: Array<{ path: string; label: 'codex-primary' | 'lapdev-legacy' | 'lapdev-global'; available: boolean }>;
}

export interface SkillPublishRequest {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  trigger: SkillTrigger;
  content: string;
}

export interface SkillPublishResponse {
  success: boolean;
  message: string;
  skill?: Skill;
  error?: string;
  suggestion?: string;
}

export interface SkillMarketEntry {
  name: string;
  version: string;
  latestVersion: string;
  description: string;
  author: string;
  tags: string[];
  rating: number;
  downloads: number;
  updatedAt: string;
  downloadUrl: string;
}

export interface SkillSearchResult {
  skills: SkillMarketEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SkillDetailResult {
  success: boolean;
  skill?: SkillMarketEntry;
  error?: string;
  message?: string;
}

export interface SkillInstallResult {
  success: boolean;
  message: string;
  error?: string;
  suggestion?: string;
}

export interface SkillMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  trigger: SkillTrigger;
}

export interface SkillMatchResult {
  skill: Skill;
  matchScore: number;
}

export type SkillLoadPriority = 'global' | 'project';
