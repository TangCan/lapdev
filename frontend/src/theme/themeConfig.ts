export type ThemeName = 'dark' | 'light' | 'high-contrast' | 'solarized-dark' | 'solarized-light';

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
  selection: string;
  scrollbar: string;
  scrollbarHover: string;
}

export interface ThemeConfig {
  name: ThemeName;
  colors: ThemeColors;
  isDark: boolean;
  displayName: string;
  description: string;
}

export const darkTheme: ThemeConfig = {
  name: 'dark',
  isDark: true,
  displayName: '深色',
  description: '适合夜间工作的深色主题',
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
    selection: '#007acc',
    scrollbar: '#3c3c3c',
    scrollbarHover: '#4a4a4a',
  },
};

export const lightTheme: ThemeConfig = {
  name: 'light',
  isDark: false,
  displayName: '浅色',
  description: '明亮清新的浅色主题',
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
    selection: '#cce5ff',
    scrollbar: '#d4d4d4',
    scrollbarHover: '#a0a0a0',
  },
};

export const highContrastTheme: ThemeConfig = {
  name: 'high-contrast',
  isDark: true,
  displayName: '高对比度',
  description: '适合视力障碍用户的高对比度主题',
  colors: {
    background: '#000000',
    surface: '#1a1a1a',
    surfaceHover: '#2a2a2a',
    border: '#ffffff',
    textPrimary: '#ffffff',
    textSecondary: '#cccccc',
    textMuted: '#999999',
    accent: '#ffff00',
    accentHover: '#e6e600',
    success: '#00ff00',
    warning: '#ff8800',
    danger: '#ff0000',
    info: '#00ffff',
    selection: '#ffff00',
    scrollbar: '#ffffff',
    scrollbarHover: '#cccccc',
  },
};

export const solarizedDarkTheme: ThemeConfig = {
  name: 'solarized-dark',
  isDark: true,
  displayName: 'Solarized Dark',
  description: '经典的 Solarized 深色主题',
  colors: {
    background: '#002b36',
    surface: '#073642',
    surfaceHover: '#0a4453',
    border: '#586e75',
    textPrimary: '#839496',
    textSecondary: '#657b83',
    textMuted: '#586e75',
    accent: '#268bd2',
    accentHover: '#1f71a9',
    success: '#859900',
    warning: '#b58900',
    danger: '#dc322f',
    info: '#268bd2',
    selection: '#073642',
    scrollbar: '#586e75',
    scrollbarHover: '#657b83',
  },
};

export const solarizedLightTheme: ThemeConfig = {
  name: 'solarized-light',
  isDark: false,
  displayName: 'Solarized Light',
  description: '经典的 Solarized 浅色主题',
  colors: {
    background: '#fdf6e3',
    surface: '#eee8d5',
    surfaceHover: '#e3dac9',
    border: '#93a1a1',
    textPrimary: '#586e75',
    textSecondary: '#657b83',
    textMuted: '#93a1a1',
    accent: '#268bd2',
    accentHover: '#1f71a9',
    success: '#859900',
    warning: '#b58900',
    danger: '#dc322f',
    info: '#268bd2',
    selection: '#eee8d5',
    scrollbar: '#93a1a1',
    scrollbarHover: '#657b83',
  },
};

export const themes: Record<ThemeName, ThemeConfig> = {
  dark: darkTheme,
  light: lightTheme,
  'high-contrast': highContrastTheme,
  'solarized-dark': solarizedDarkTheme,
  'solarized-light': solarizedLightTheme,
};

export function getThemeByName(name: ThemeName): ThemeConfig {
  return themes[name];
}

export function getDefaultTheme(): ThemeName {
  const saved = localStorage.getItem('lapdev-theme');
  if (saved && saved in themes) {
    return saved as ThemeName;
  }
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'dark';
}

export function getThemeList(): ThemeConfig[] {
  return Object.values(themes);
}