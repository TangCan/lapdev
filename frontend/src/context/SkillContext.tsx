import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { skillService, SkillService } from '../services/skillService';
import type { Skill, SkillLoadResult } from '../types/skill';

interface SkillContextType {
  skills: Skill[];
  loading: boolean;
  error: string | null;
  loadSkills: () => Promise<void>;
  getSkillByName: (name: string) => Skill | undefined;
  matchSkills: (query: string) => Skill[];
  buildSystemPrompt: (skills: Skill[]) => string;
  reloadSkills: () => Promise<void>;
}

const SkillContext = createContext<SkillContextType | undefined>(undefined);

export const SkillProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result: SkillLoadResult = skillService.loadSkills();
      setSkills(result.skills);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
      console.error('Failed to load skills:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const getSkillByName = useCallback((name: string): Skill | undefined => {
    return skills.find(s => s.name === name);
  }, [skills]);

  const matchSkills = useCallback((query: string): Skill[] => {
    return skillService.matchSkills(query, skills);
  }, [skills]);

  const buildSystemPrompt = useCallback((matchedSkills: Skill[]): string => {
    return skillService.buildSystemPrompt(matchedSkills);
  }, []);

  const reloadSkills = useCallback(async () => {
    await loadSkills();
  }, [loadSkills]);

  return (
    <SkillContext.Provider
      value={{
        skills,
        loading,
        error,
        loadSkills,
        getSkillByName,
        matchSkills,
        buildSystemPrompt,
        reloadSkills,
      }}
    >
      {children}
    </SkillContext.Provider>
  );
};

export const useSkill = (): SkillContextType => {
  const context = useContext(SkillContext);
  if (context === undefined) {
    throw new Error('useSkill must be used within a SkillProvider');
  }
  return context;
};

export { SkillService };
