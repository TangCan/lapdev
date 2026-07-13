export interface SkillTrigger {
  keywords?: string[];
  patterns?: RegExp[];
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
  fileName?: string;
  matchScore?: number;
}

export interface AIRequest {
  text: string;
  position?: number;
  language?: string;
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

export interface SkillLoadResult {
  skills: Skill[];
  globalCount: number;
  projectCount: number;
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