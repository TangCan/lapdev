import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { GitProvider } from './context/GitContext';
import { ChatProvider } from './context/ChatContext';
import { AIProvider } from './context/AIContext';
import { AgentProvider } from './context/AgentContext';
import { InlineCompletionProvider } from './context/InlineCompletionContext';
import { SkillProvider } from './context/SkillContext';
import { LSPProvider } from './context/LSPContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GitProvider>
        <AIProvider>
          <AgentProvider>
            <InlineCompletionProvider>
              <SkillProvider>
                <ChatProvider>
                  <LSPProvider>
                    <App />
                  </LSPProvider>
                </ChatProvider>
              </SkillProvider>
            </InlineCompletionProvider>
          </AgentProvider>
        </AIProvider>
      </GitProvider>
    </BrowserRouter>
  </StrictMode>
);