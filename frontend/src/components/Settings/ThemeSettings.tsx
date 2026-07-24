import { useTheme } from '../../theme/ThemeContext';
import { getThemeList, type ThemeConfig } from '../../theme/themeConfig';

export function ThemeSettings() {
  const { themeName, setTheme, followSystem, setFollowSystem } = useTheme();
  const themes = getThemeList();

  return (
    <div className="rounded-lg p-3 border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>主题</h3>
      
      <div className="mb-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={followSystem}
            onChange={(e) => setFollowSystem(e.target.checked)}
            className="rounded border"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>跟随系统主题</span>
        </label>
      </div>

      {!followSystem && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {themes.map((theme: ThemeConfig) => (
            <button
              key={theme.name}
              onClick={() => setTheme(theme.name)}
              className={`p-3 rounded-md border text-left transition-all ${
                themeName === theme.name 
                  ? 'ring-2 ring-offset-1' 
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: theme.colors.surface,
                borderColor: themeName === theme.name ? theme.colors.accent : theme.colors.border,
                ringColor: theme.colors.accent,
                ringOffsetColor: theme.colors.background,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ 
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.border,
                  }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: theme.colors.textPrimary }}
                >
                  {theme.displayName}
                </span>
              </div>
              <p 
                className="text-xs"
                style={{ color: theme.colors.textMuted }}
              >
                {theme.description}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}