export type ThemeName = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export interface ThemeConfig {
  name: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
}

export const darkTheme: ThemeConfig = {
  name: 'dark',
  isDark: true,
  colors: {
    background: '#1e1e1e',
    surface: '#252526',
    surfaceHover: '#2d2d2d',
    border: '#3c3c3c',
    textPrimary: '#d4d4d4',
    textSecondary: '#c6c6c6',
    textMuted: '#858585',
    accent: '#007acc',
    accentHover: '#005a9e',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f14c4c',
    info: '#58a6ff',
  },
};

export const lightTheme: ThemeConfig = {
  name: 'light',
  isDark: false,
  colors: {
    background: '#ffffff',
    surface: '#f5f5f5',
    surfaceHover: '#e8e8e8',
    border: '#d4d4d4',
    textPrimary: '#1e1e1e',
    textSecondary: '#3c3c3c',
    textMuted: '#6e6e6e',
    accent: '#007acc',
    accentHover: '#005a9e',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f14c4c',
    info: '#58a6ff',
  },
};

export const themes: Record<ThemeName, ThemeConfig> = {
  dark: darkTheme,
  light: lightTheme,
};

export function getThemeByName(name: ThemeName): ThemeConfig {
  return themes[name];
}

export function getDefaultTheme(): ThemeName {
  const saved = localStorage.getItem('lapdev-theme');
  if (saved && (saved === 'dark' || saved === 'light')) {
    return saved as ThemeName;
  }
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'dark';
}
