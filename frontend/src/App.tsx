import { Routes, Route } from 'react-router-dom';
import { SettingsPage } from './pages/SettingsPage';
import SimpleIDE from './components/IDE/SimpleIDE';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SimpleIDE />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default App;
