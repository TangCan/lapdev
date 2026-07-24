import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ThemeConfig, ThemeName, getThemeByName, getDefaultTheme } from './themeConfig';

/**
 * 主题上下文类型
 */
interface ThemeContextType {
  /** 当前主题配置 */
  theme: ThemeConfig;
  /** 当前主题名称 */
  themeName: ThemeName;
  /** 设置主题 */
  setTheme: (name: ThemeName) => void;
  /** 切换深色/浅色主题 */
  toggleTheme: () => void;
  /** 是否跟随系统主题 */
  followSystem: boolean;
  /** 设置是否跟随系统主题 */
  setFollowSystem: (follow: boolean) => void;
}

/** 主题上下文 */
const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * 获取初始主题状态
 * 
 * 从 localStorage 读取保存的主题设置，或检测系统偏好。
 * 
 * @returns 包含主题名称、主题配置和是否跟随系统的对象
 */
const getInitialTheme = (): { themeName: ThemeName; theme: ThemeConfig; followSystem: boolean } => {
  const savedFollowSystem = localStorage.getItem('lapdev-theme-follow-system');
  const followSystem = savedFollowSystem === 'true';
  
  // 如果跟随系统，检测系统主题偏好
  if (followSystem) {
    const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    return { themeName: systemTheme, theme: getThemeByName(systemTheme), followSystem: true };
  }
  
  // 否则从 localStorage 读取保存的主题
  const savedTheme = localStorage.getItem('lapdev-theme') as ThemeName | null;
  if (savedTheme) {
    return { themeName: savedTheme, theme: getThemeByName(savedTheme), followSystem: false };
  }
  
  // 默认使用 getDefaultTheme 确定的主题
  return { themeName: getDefaultTheme(), theme: getThemeByName(getDefaultTheme()), followSystem: false };
};

/**
 * 主题提供器组件
 * 
 * 为应用提供主题状态管理，支持：
 * - 主题切换
 * - 跟随系统主题
 * - localStorage 持久化
 * - CSS 变量注入
 * 
 * 使用示例：
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 * 
 * @param children 子组件
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  /** 主题状态 */
  const [{ themeName, theme, followSystem }, setState] = useState<{ 
    themeName: ThemeName; 
    theme: ThemeConfig; 
    followSystem: boolean 
  }>(getInitialTheme);

  /** 设置主题名称状态 */
  const setThemeNameState = useCallback((name: ThemeName) => {
    setState(prev => ({ ...prev, themeName: name, theme: getThemeByName(name) }));
  }, []);

  /** 设置主题配置状态 */
  const setThemeState = useCallback((config: ThemeConfig) => {
    setState(prev => ({ ...prev, theme: config }));
  }, []);

  /**
   * 同步主题到 DOM 和 localStorage
   * 
   * - 设置 data-theme 属性
   * - 保存主题名称和跟随系统设置到 localStorage
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('lapdev-theme', themeName);
    localStorage.setItem('lapdev-theme-follow-system', String(followSystem));
  }, [themeName, followSystem]);

  /**
   * 监听系统主题变化（当跟随系统时）
   * 
   * 使用 MediaQueryList 监听 prefers-color-scheme 变化，
   * 自动更新主题。
   */
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

  /**
   * 设置主题
   * 
   * 设置指定的主题，并关闭跟随系统模式。
   * 
   * @param name 主题名称
   */
  const setTheme = useCallback((name: ThemeName) => {
    setState(prev => ({ 
      ...prev, 
      themeName: name, 
      theme: getThemeByName(name),
      followSystem: false 
    }));
  }, []);

  /**
   * 切换主题
   * 
   * 在深色和浅色主题之间切换，并关闭跟随系统模式。
   */
  const toggleTheme = useCallback(() => {
    setState(prev => ({
      ...prev,
      themeName: prev.themeName === 'dark' ? 'light' : 'dark',
      theme: getThemeByName(prev.themeName === 'dark' ? 'light' : 'dark'),
      followSystem: false
    }));
  }, []);

  /**
   * 设置是否跟随系统主题
   * 
   * @param follow 是否跟随系统主题
   */
  const setFollowSystem = useCallback((follow: boolean) => {
    if (follow) {
      // 切换到系统主题
      const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setState({ themeName: systemTheme, theme: getThemeByName(systemTheme), followSystem: true });
    } else {
      // 保持当前主题，关闭跟随系统
      setState(prev => ({ ...prev, followSystem: false }));
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme, toggleTheme, followSystem, setFollowSystem }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * React Hook: 获取主题上下文
 * 
 * 在组件中获取当前主题状态和操作方法。
 * 
 * 使用示例：
 * ```tsx
 * const { theme, themeName, setTheme } = useTheme();
 * ```
 * 
 * @returns 主题上下文对象
 * @throws 当在 ThemeProvider 外部调用时抛出错误
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}