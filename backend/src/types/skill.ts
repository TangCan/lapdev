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
}

export interface SkillLoadResult {
  skills: Skill[];
  globalCount: number;
  projectCount: number;
}
