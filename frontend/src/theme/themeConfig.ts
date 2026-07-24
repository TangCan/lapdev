/**
 * 主题名称类型
 * 
 * 支持的主题：
 * - dark: 深色主题
 * - light: 浅色主题
 * - high-contrast: 高对比度主题
 * - solarized-dark: Solarized 深色主题
 * - solarized-light: Solarized 浅色主题
 */
export type ThemeName = 'dark' | 'light' | 'high-contrast' | 'solarized-dark' | 'solarized-light';

/**
 * 主题颜色配置
 */
export interface ThemeColors {
  /** 背景色 */
  background: string;
  /** 表面色（卡片、面板等） */
  surface: string;
  /** 表面悬停色 */
  surfaceHover: string;
  /** 边框色 */
  border: string;
  /** 主要文字颜色 */
  textPrimary: string;
  /** 次要文字颜色 */
  textSecondary: string;
  /** 弱化文字颜色 */
  textMuted: string;
  /** 强调色 */
  accent: string;
  /** 强调色悬停 */
  accentHover: string;
  /** 成功状态颜色 */
  success: string;
  /** 警告状态颜色 */
  warning: string;
  /** 危险状态颜色 */
  danger: string;
  /** 信息状态颜色 */
  info: string;
  /** 选中区域颜色 */
  selection: string;
  /** 滚动条颜色 */
  scrollbar: string;
  /** 滚动条悬停颜色 */
  scrollbarHover: string;
}

/**
 * 主题配置接口
 */
export interface ThemeConfig {
  /** 主题唯一标识 */
  name: ThemeName;
  /** 颜色配置 */
  colors: ThemeColors;
  /** 是否为深色主题 */
  isDark: boolean;
  /** 显示名称（用户可见） */
  displayName: string;
  /** 主题描述 */
  description: string;
}

/** 深色主题配置 */
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

/** 浅色主题配置 */
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

/** 高对比度主题配置 */
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

/** Solarized 深色主题配置 */
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

/** Solarized 浅色主题配置 */
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

/** 所有主题的映射表 */
export const themes: Record<ThemeName, ThemeConfig> = {
  dark: darkTheme,
  light: lightTheme,
  'high-contrast': highContrastTheme,
  'solarized-dark': solarizedDarkTheme,
  'solarized-light': solarizedLightTheme,
};

/**
 * 根据主题名称获取主题配置
 * 
 * @param name 主题名称
 * @returns 主题配置对象
 */
export function getThemeByName(name: ThemeName): ThemeConfig {
  return themes[name];
}

/**
 * 获取默认主题
 * 
 * 优先级：
 * 1. 从 localStorage 读取保存的主题
 * 2. 检测系统偏好（prefers-color-scheme）
 * 3. 默认使用深色主题
 * 
 * @returns 默认主题名称
 */
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

/**
 * 获取所有主题列表
 * 
 * @returns 主题配置数组
 */
export function getThemeList(): ThemeConfig[] {
  return Object.values(themes);
}