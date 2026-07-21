import type { Skill } from './skill';

declare global {
  interface Window {
    __test_triggerCompletion?: () => void;
    __test_setEditorValue?: (value: string) => void;
    __terminalInput?: (input: string) => void;
    __getTerminalOutput?: (tabId?: string) => string;
    __test_getAllSkills?: () => Skill[];
    __test_loadSkills?: () => void;
    __test_activateSkill?: (skillId: string) => void;
    __test_clearActiveSkills?: () => void;
  }
}

export {};