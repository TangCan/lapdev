import React from 'react';
import { Link } from 'react-router-dom';
import { AIConfigPanel } from '../components/AI/AIConfigPanel';
import { ThemeSettings } from '../components/Settings/ThemeSettings';
import { AIProvider } from '../context/AIContext';
import { InlineCompletionProvider } from '../context/InlineCompletionContext';

export const SettingsPage: React.FC = () => {
  return (
    <AIProvider>
      <InlineCompletionProvider>
        <div className="settings-page min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div style={{ width: '100%', maxWidth: '448px', padding: '24px' }}>
            <div className="flex items-center gap-4 mb-6">
              <Link 
                to="/" 
                style={{ 
                  color: 'var(--color-text-secondary)',
                  fontSize: '13px',
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ← 返回 IDE
              </Link>
              <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-border)', opacity: '0.6' }}></div>
              <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>设置</h1>
            </div>
            
            <div className="space-y-3">
              <ThemeSettings />
              <AIConfigPanel />
            </div>
          </div>
        </div>
      </InlineCompletionProvider>
    </AIProvider>
  );
};
