import React from 'react';
import { GitProvider } from './GitContext';
import { ChatProvider } from './ChatContext';
import { AIProvider } from './AIContext';
import { AgentProvider } from './AgentContext';
import { InlineCompletionProvider } from './InlineCompletionContext';
import { SkillProvider } from './SkillContext';
import { LSPProvider } from './LSPContext';

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GitProvider>
    <AIProvider>
      <AgentProvider>
        <InlineCompletionProvider>
          <SkillProvider>
            <ChatProvider>
              <LSPProvider>
                {children}
              </LSPProvider>
            </ChatProvider>
          </SkillProvider>
        </InlineCompletionProvider>
      </AgentProvider>
    </AIProvider>
  </GitProvider>
);

export default Providers;