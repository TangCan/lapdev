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
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
          <header className="shadow-sm border-b" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to="/" style={{ color: 'var(--color-text-secondary)' }}>
                  ← 返回 IDE
                </Link>
                <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>设置</h1>
              </div>
            </div>
          </header>
          
          <main className="max-w-4xl mx-auto px-4 py-6">
            <ThemeSettings />
            <AIConfigPanel />
          </main>
        </div>
      </InlineCompletionProvider>
    </AIProvider>
  );
};
