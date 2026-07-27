import { create } from 'zustand';
import { ThemeConfig, ThemeName, getThemeByName, getDefaultTheme } from '../theme/themeConfig';

interface ThemeState {
  theme: ThemeConfig;
  themeName: ThemeName;
  followSystem: boolean;
  setTheme: (name: ThemeName) => void;
  toggleTheme: () => void;
  setFollowSystem: (follow: boolean) => void;
  initTheme: () => void;
}

/**
 * 获取初始主题状态
 */
function getInitialTheme(): { themeName: ThemeName; theme: ThemeConfig; followSystem: boolean } {
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
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialState = getInitialTheme();

  return {
    theme: initialState.theme,
    themeName: initialState.themeName,
    followSystem: initialState.followSystem,

    initTheme: () => {
      const state = getInitialTheme();
      document.documentElement.setAttribute('data-theme', state.themeName);
      set(state);
    },

    setTheme: (name: ThemeName) => {
      document.documentElement.setAttribute('data-theme', name);
      localStorage.setItem('lapdev-theme', name);
      localStorage.setItem('lapdev-theme-follow-system', 'false');
      set({ themeName: name, theme: getThemeByName(name), followSystem: false });
    },

    toggleTheme: () => {
      const { themeName } = get();
      const newTheme = themeName === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('lapdev-theme', newTheme);
      localStorage.setItem('lapdev-theme-follow-system', 'false');
      set({ themeName: newTheme, theme: getThemeByName(newTheme), followSystem: false });
    },

    setFollowSystem: (follow: boolean) => {
      if (follow) {
        const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        localStorage.setItem('lapdev-theme', systemTheme);
        localStorage.setItem('lapdev-theme-follow-system', 'true');
        set({ themeName: systemTheme, theme: getThemeByName(systemTheme), followSystem: true });
      } else {
        localStorage.setItem('lapdev-theme-follow-system', 'false');
        set({ followSystem: false });
      }
    },
  };
});

/**
 * 初始化系统主题监听器
 * 应在应用启动时调用一次
 */
export function initThemeWatcher() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = (e: MediaQueryListEvent) => {
    const { followSystem } = useThemeStore.getState();
    if (!followSystem) return;

    const newTheme: ThemeName = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('lapdev-theme', newTheme);
    useThemeStore.setState({ themeName: newTheme, theme: getThemeByName(newTheme) });
  };

  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}
