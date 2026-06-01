import { Routes, Route } from 'react-router-dom';
import { GitProvider } from './context/GitContext';
import { LSPProvider } from './context/LSPContext';
import { ChatProvider } from './context/ChatContext';
import { SettingsPage } from './pages/SettingsPage';
import IDE from './components/IDE/IDE';

function App() {
  return (
    <GitProvider>
      <LSPProvider>
        <ChatProvider>
          <Routes>
            <Route path="/" element={<IDE />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </ChatProvider>
      </LSPProvider>
    </GitProvider>
  );
}

export default App;