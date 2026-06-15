import { Routes, Route } from 'react-router-dom';
import { SettingsPage } from './pages/SettingsPage';
import IDE from './components/IDE/IDE';

function App() {
  return (
    <Routes>
      <Route path="/" element={<IDE />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default App;
