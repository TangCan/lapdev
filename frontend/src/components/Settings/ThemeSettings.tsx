import { useTheme } from '../../theme/ThemeContext';
import type { ThemeName } from '../../theme/themeConfig';

export function ThemeSettings() {
  const { themeName, setTheme } = useTheme();

  const themes: { value: ThemeName; label: string; icon: string }[] = [
    { value: 'dark', label: '深色', icon: '🌙' },
    { value: 'light', label: '浅色', icon: '☀️' },
  ];

  return (
    <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>主题</h3>
      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>选择主题:</label>
        <select
          value={themeName}
          onChange={(e) => setTheme(e.target.value as ThemeName)}
          className="px-2 py-1.5 rounded-md border text-xs focus:outline-none focus:ring-1"
          style={{ 
            borderColor: 'var(--color-border)', 
            backgroundColor: 'var(--color-bg)', 
            color: 'var(--color-text-primary)' 
          }}
        >
          {themes.map((theme) => (
            <option key={theme.value} value={theme.value}>
              {theme.icon} {theme.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
