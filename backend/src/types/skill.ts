export interface SkillTrigger {
  keywords?: string[];
  patterns?: string[];
}

export interface Skill {
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
}

export interface SkillLoadResult {
  skills: Skill[];
  globalCount: number;
  projectCount: number;
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
