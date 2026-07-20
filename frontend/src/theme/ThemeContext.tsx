import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ThemeConfig, ThemeName, getThemeByName, getDefaultTheme } from './themeConfig';

interface ThemeContextType {
  theme: ThemeConfig;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>(getDefaultTheme());
  const [theme, setThemeState] = useState<ThemeConfig>(getThemeByName(getDefaultTheme()));

  useEffect(() => {
    const savedTheme = localStorage.getItem('lapdev-theme') as ThemeName | null;
    if (savedTheme) {
      setThemeNameState(savedTheme);
      setThemeState(getThemeByName(savedTheme));
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('lapdev-theme', themeName);
  }, [themeName]);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    setThemeState(getThemeByName(name));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeNameState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

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
