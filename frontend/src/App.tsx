import { Routes, Route } from 'react-router-dom';
import { GitProvider } from './context/GitContext';
import { LSPProvider } from './context/LSPContext';
import { ChatProvider } from './context/ChatContext';
import { AIProvider } from './context/AIContext';
import { InlineCompletionProvider } from './context/InlineCompletionContext';
import { SettingsPage } from './pages/SettingsPage';
import IDE from './components/IDE/IDE';

function App() {
  return (
    <GitProvider>
      <LSPProvider>
        <ChatProvider>
          <AIProvider>
            <InlineCompletionProvider>
              <Routes>
                <Route path="/" element={<IDE />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </InlineCompletionProvider>
          </AIProvider>
        </ChatProvider>
      </LSPProvider>
    </GitProvider>
  );
}

export default App;