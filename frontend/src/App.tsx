import { Routes, Route } from 'react-router-dom';
import { GitProvider } from './context/GitContext';
import { LSPProvider } from './context/LSPContext';
import { ChatProvider } from './context/ChatContext';
import { AIProvider } from './context/AIContext';
import { SettingsPage } from './pages/SettingsPage';
import IDE from './components/IDE/IDE';

function App() {
  return (
    <GitProvider>
      <LSPProvider>
        <ChatProvider>
          <AIProvider>
            <Routes>
              <Route path="/" element={<IDE />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AIProvider>
        </ChatProvider>
      </LSPProvider>
    </GitProvider>
  );
}

export default App;