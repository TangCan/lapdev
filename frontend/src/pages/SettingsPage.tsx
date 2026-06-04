import React from 'react';
import { Link } from 'react-router-dom';
import { AIConfigPanel } from '../components/AI/AIConfigPanel';
import { AIProvider } from '../context/AIContext';
import { InlineCompletionProvider } from '../context/InlineCompletionContext';

export const SettingsPage: React.FC = () => {
  return (
    <AIProvider>
      <InlineCompletionProvider>
        <div className="min-h-screen bg-gray-100">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link to="/" className="text-gray-600 hover:text-gray-900">
                  ← 返回 IDE
                </Link>
                <h1 className="text-xl font-semibold text-gray-800">设置</h1>
              </div>
            </div>
          </header>
          
          <main className="max-w-4xl mx-auto px-4 py-6">
            <AIConfigPanel />
          </main>
        </div>
      </InlineCompletionProvider>
    </AIProvider>
  );
};