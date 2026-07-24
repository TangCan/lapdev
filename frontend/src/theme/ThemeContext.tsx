import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ThemeConfig, ThemeName, getThemeByName, getDefaultTheme } from './themeConfig';

interface ThemeContextType {
  theme: ThemeConfig;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
  followSystem: boolean;
  setFollowSystem: (follow: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const getInitialTheme = (): { themeName: ThemeName; theme: ThemeConfig; followSystem: boolean } => {
  const savedFollowSystem = localStorage.getItem('lapdev-theme-follow-system');
  const followSystem = savedFollowSystem === 'true';
  
  if (followSystem) {
    const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return { themeName: systemTheme, theme: getThemeByName(systemTheme), followSystem: true };
  }
  
  const savedTheme = localStorage.getItem('lapdev-theme') as ThemeName | null;
  if (savedTheme) {
    return { themeName: savedTheme, theme: getThemeByName(savedTheme), followSystem: false };
  }
  return { themeName: getDefaultTheme(), theme: getThemeByName(getDefaultTheme()), followSystem: false };
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [{ themeName, theme, followSystem }, setState] = useState<{ 
    themeName: ThemeName; 
    theme: ThemeConfig; 
    followSystem: boolean 
  }>(getInitialTheme);

  const setThemeNameState = useCallback((name: ThemeName) => {
    setState(prev => ({ ...prev, themeName: name, theme: getThemeByName(name) }));
  }, []);

  const setThemeState = useCallback((config: ThemeConfig) => {
    setState(prev => ({ ...prev, theme: config }));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('lapdev-theme', themeName);
    localStorage.setItem('lapdev-theme-follow-system', String(followSystem));
  }, [themeName, followSystem]);

  useEffect(() => {
    if (!followSystem) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme: ThemeName = e.matches ? 'dark' : 'light';
      setThemeNameState(newTheme);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [followSystem, setThemeNameState]);

  const setTheme = useCallback((name: ThemeName) => {
    setState(prev => ({ 
      ...prev, 
      themeName: name, 
      theme: getThemeByName(name),
      followSystem: false 
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState(prev => ({
      ...prev,
      themeName: prev.themeName === 'dark' ? 'light' : 'dark',
      theme: getThemeByName(prev.themeName === 'dark' ? 'light' : 'dark'),
      followSystem: false
    }));
  }, []);

  const setFollowSystem = useCallback((follow: boolean) => {
    if (follow) {
      const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setState({ themeName: systemTheme, theme: getThemeByName(systemTheme), followSystem: true });
    } else {
      setState(prev => ({ ...prev, followSystem: false }));
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, toggleTheme, followSystem, setFollowSystem }}>
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