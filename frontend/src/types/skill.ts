import type { Skill as BaseSkill } from '../shared/types/skill.ts';

export type {
  SkillTrigger,
  SkillLoadResult,
  SkillMarketEntry,
  SkillMetadata,
  SkillMatchResult,
  SkillLoadPriority,
} from '../shared/types/skill.ts';

export type Skill = BaseSkill;

export interface AIRequest {
  text: string;
  position?: number;
  language?: string;
}
