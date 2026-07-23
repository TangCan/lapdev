import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4" style={{ color: 'var(--color-text-primary)' }} />
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '13px',
          cursor: 'pointer',
          outline: 'none',
          minWidth: '80px',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
        }}
      >
        <option 
          value="en" 
          style={{ 
            backgroundColor: 'var(--color-surface)', 
            color: 'var(--color-text-primary)' 
          }}
        >
          English
        </option>
        <option 
          value="zh" 
          style={{ 
            backgroundColor: 'var(--color-surface)', 
            color: 'var(--color-text-primary)' 
          }}
        >
          中文
        </option>
      </select>
    </div>
  );
}