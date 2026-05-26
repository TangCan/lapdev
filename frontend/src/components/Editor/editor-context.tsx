import { createContext, useContext, type ReactNode } from 'react';
import type { FileInfo } from '../../types/file';

export interface EditorState {
  currentFile: FileInfo | null;
  content: string;
  isModified: boolean;
  language: string;
}

export interface EditorContextType {
  state: EditorState;
  openFile: (file: FileInfo, content: string) => void;
  updateContent: (content: string) => void;
  saveFile: () => Promise<void>;
  closeFile: () => void;
  formatCode: () => Promise<void>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: ReactNode }) {
  // This will be implemented with proper state management
  const state: EditorState = {
    currentFile: null,
    content: '',
    isModified: false,
    language: 'plaintext'
  };

  const value: EditorContextType = {
    state,
    openFile: () => {},
    updateContent: () => {},
    saveFile: async () => {},
    closeFile: () => {},
    formatCode: async () => {}
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}