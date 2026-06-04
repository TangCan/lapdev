import { useState } from 'react';
import { MockFileTree } from '../FileTree/MockFileTree';
import { MockAIPanel } from '../AI/MockAIPanel';
import { MockTerminal } from '../Terminal/MockTerminal';
import { MockCodeEditor } from '../Editor/MockCodeEditor';
import { MockGitPanel } from '../Git/MockGitPanel';
import { SkillProvider } from '../../context/SkillContext';

function SimpleIDE() {
  const [openFile, setOpenFile] = useState<string | null>(null);

  const handleFileOpen = (file: any) => {
    console.log('File opened:', file);
    setOpenFile(file.name);
  };

  return (
    <SkillProvider>
      <div className="app">
        <header className="header">
          <h1>📝 Lapdev IDE</h1>
          <MockTerminal />
          <MockGitPanel />
        </header>
        <div className="main-content">
          <aside className="sidebar">
            <MockFileTree onFileOpen={handleFileOpen} />
          </aside>
          <main className="editor-area">
            {openFile ? (
              <MockCodeEditor />
            ) : (
              <div className="welcome-screen">
                <h2>欢迎使用 Lapdev</h2>
                <p>点击左侧文件树中的文件开始编辑</p>
              </div>
            )}
          </main>
          <MockAIPanel />
        </div>
      </div>
    </SkillProvider>
  );
}

export default SimpleIDE;
