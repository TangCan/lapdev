import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Skill, AIRequest } from '../types/skill';
import { SkillMatchService } from '../services/skillMatchService';

declare global {
  interface Window {
    __test_getActiveSkills?: () => Skill[];
    __test_getAllSkills?: () => Skill[];
    __test_loadSkills?: (skills: Skill[]) => void;
    __test_activateSkill?: (id: string) => void;
    __test_clearActiveSkills?: () => void;
  }
}

// Action 类型
type SkillAction =
  | { type: 'LOAD_SKILLS'; payload: Skill[] }
  | { type: 'ACTIVATE_SKILL'; payload: string }
  | { type: 'DEACTIVATE_SKILL'; payload: string }
  | { type: 'CLEAR_ACTIVE_SKILLS' }
  | { type: 'FIND_MATCHING_SKILLS'; payload: AIRequest };

// State 类型
interface SkillState {
  skills: Skill[];
  activeSkills: string[];
  matchingSkills: Skill[];
}

// 初始状态
const initialState: SkillState = {
  skills: [],
  activeSkills: [],
  matchingSkills: [],
};

// Reducer
function skillReducer(state: SkillState, action: SkillAction): SkillState {
  switch (action.type) {
    case 'LOAD_SKILLS':
      return {
        ...state,
        skills: action.payload,
      };
    
    case 'ACTIVATE_SKILL':
      if (state.activeSkills.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        activeSkills: [...state.activeSkills, action.payload],
      };
    
    case 'DEACTIVATE_SKILL':
      return {
        ...state,
        activeSkills: state.activeSkills.filter(id => id !== action.payload),
      };
    
    case 'CLEAR_ACTIVE_SKILLS':
      return {
        ...state,
        activeSkills: [],
      };
    
    case 'FIND_MATCHING_SKILLS': {
      const service = new SkillMatchService();
      const matching = service.findMatchingSkills(state.skills, action.payload);
      
      // 自动激活匹配的 Skill
      const newActiveSkills = [...state.activeSkills];
      matching.forEach(skill => {
        if (skill.id && !newActiveSkills.includes(skill.id)) {
          newActiveSkills.push(skill.id);
        }
      });
      
      return {
        ...state,
        matchingSkills: matching,
        activeSkills: newActiveSkills,
      };
    }
    
    default:
      return state;
  }
}

// Context 类型
interface SkillContextValue {
  skills: Skill[];
  activeSkills: string[];
  matchingSkills: Skill[];
  loadSkills: (skills: Skill[]) => void;
  activateSkill: (id: string) => void;
  deactivateSkill: (id: string) => void;
  clearActiveSkills: () => void;
  findMatchingSkills: (request: AIRequest) => void;
  getActiveSkills: () => Skill[];
}

// 创建 Context
const SkillContext = createContext<SkillContextValue | undefined>(undefined);

// 从 sessionStorage 加载技能数据
function loadSkillsFromStorage(): Skill[] {
  try {
    const stored = sessionStorage.getItem('lapdev-skills');
    console.log('loadSkillsFromStorage: stored value:', stored);
    if (stored) {
      const skills = JSON.parse(stored);
      console.log('loadSkillsFromStorage: skills loaded:', skills.length);
      return skills;
    }
  } catch (error) {
    console.warn('Failed to load skills from sessionStorage:', error);
  }
  return [];
}

// Provider 组件
export function SkillProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(skillReducer, initialState);

  // 使用 useEffect 在组件挂载时加载技能数据
  useEffect(() => {
    const skills = loadSkillsFromStorage();
    if (skills.length > 0) {
      dispatch({ type: 'LOAD_SKILLS', payload: skills });
    }
  }, []);

  const loadSkills = useCallback((skills: Skill[]) => {
    dispatch({ type: 'LOAD_SKILLS', payload: skills });
  }, []);

  const activateSkill = useCallback((id: string) => {
    dispatch({ type: 'ACTIVATE_SKILL', payload: id });
  }, []);

  const deactivateSkill = useCallback((id: string) => {
    dispatch({ type: 'DEACTIVATE_SKILL', payload: id });
  }, []);

  const clearActiveSkills = useCallback(() => {
    dispatch({ type: 'CLEAR_ACTIVE_SKILLS' });
  }, []);

  const findMatchingSkills = useCallback((request: AIRequest) => {
    dispatch({ type: 'FIND_MATCHING_SKILLS', payload: request });
  }, []);

  const getActiveSkills = useCallback((): Skill[] => {
    return state.skills.filter(skill => skill.id && state.activeSkills.includes(skill.id));
  }, [state.skills, state.activeSkills]);

  // 注册全局测试函数
  useEffect(() => {
    console.log('Registering test functions');
    window.__test_getActiveSkills = getActiveSkills;
    window.__test_getAllSkills = () => state.skills;
    window.__test_loadSkills = (skills: Skill[]) => {
      console.log('__test_loadSkills called with', skills.length, 'skills');
      loadSkills(skills);
    };
    window.__test_activateSkill = activateSkill;
    window.__test_clearActiveSkills = clearActiveSkills;
    
    return () => {
      delete window.__test_getActiveSkills;
      delete window.__test_getAllSkills;
      delete window.__test_loadSkills;
      delete window.__test_activateSkill;
      delete window.__test_clearActiveSkills;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getActiveSkills, loadSkills, activateSkill, clearActiveSkills]);

  return (
    <SkillContext.Provider
      value={{
        skills: state.skills,
        activeSkills: state.activeSkills,
        matchingSkills: state.matchingSkills,
        loadSkills,
        activateSkill,
        deactivateSkill,
        clearActiveSkills,
        findMatchingSkills,
        getActiveSkills,
      }}
    >
      {children}
    </SkillContext.Provider>
  );
}

// Hook
export function useSkill() {
  const context = useContext(SkillContext);
  if (context === undefined) {
    throw new Error('useSkill must be used within a SkillProvider');
  }
  return context;
}

// 扩展 Window 接口
declare global {
  interface Window {
    __test_getActiveSkills?: () => Skill[];
  }
}