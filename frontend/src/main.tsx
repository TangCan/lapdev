import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App';
import { SettingsPage } from './pages/SettingsPage';
import IDE from './components/IDE/IDE';
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

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider>
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
  </ThemeProvider>
);

const router = createBrowserRouter(
  [
    {
      element: <Providers><App /></Providers>,
      children: [
        { path: '/', element: <IDE /> },
        { path: '/settings', element: <SettingsPage /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
);