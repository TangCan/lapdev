import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ThemeConfig, ThemeName, getThemeByName, getDefaultTheme } from './themeConfig';

interface ThemeContextType {
  theme: ThemeConfig;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const getInitialTheme = (): { themeName: ThemeName; theme: ThemeConfig } => {
  const savedTheme = localStorage.getItem('lapdev-theme') as ThemeName | null;
  if (savedTheme) {
    return { themeName: savedTheme, theme: getThemeByName(savedTheme) };
  }
  return { themeName: getDefaultTheme(), theme: getThemeByName(getDefaultTheme()) };
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [{ themeName, theme }, setState] = useState<{ themeName: ThemeName; theme: ThemeConfig }>(getInitialTheme);

  const setThemeNameState = useCallback((name: ThemeName) => {
    setState({ themeName: name, theme: getThemeByName(name) });
  }, []);

  const setThemeState = useCallback((config: ThemeConfig) => {
    setState(prev => ({ ...prev, theme: config }));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('lapdev-theme', themeName);
  }, [themeName]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    setThemeState(getThemeByName(name));
  }, [setThemeNameState, setThemeState]);

  const toggleTheme = useCallback(() => {
    setThemeNameState(themeName === 'dark' ? 'light' : 'dark');
  }, [setThemeNameState, themeName]);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
