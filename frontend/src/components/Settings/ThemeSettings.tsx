import { useTheme } from '../../theme/ThemeContext';
import type { ThemeName } from '../../theme/themeConfig';

export function ThemeSettings() {
  const { themeName, setTheme } = useTheme();

  const themes: { value: ThemeName; label: string; icon: string }[] = [
    { value: 'dark', label: '深色', icon: '🌙' },
    { value: 'light', label: '浅色', icon: '☀️' },
  ];

  return (
    <div className="mb-6 p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>主题</h3>
      <div className="flex items-center gap-3">
        <label className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>选择主题:</label>
        <select
          value={themeName}
          onChange={(e) => setTheme(e.target.value as ThemeName)}
          className="px-3 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
