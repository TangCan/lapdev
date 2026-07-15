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
import { ThemeProvider } from './theme/ThemeContext';

window.addEventListener('error', (e) => {
  console.error('[Global Error]', e.error, e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[Global Unhandled Rejection]', e.reason);
});

console.log('[App] Starting...');

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider>
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
    </ThemeProvider>
  </BrowserRouter>
);