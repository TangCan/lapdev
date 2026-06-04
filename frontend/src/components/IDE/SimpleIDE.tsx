import { useState } from 'react';
import { MockFileTree } from '../FileTree/MockFileTree';
import { MockAIPanel } from '../AI/MockAIPanel';
import { MockTerminal } from '../Terminal/MockTerminal';
import { MockCodeEditor } from '../Editor/MockCodeEditor';

function SimpleIDE() {
  const [openFile, setOpenFile] = useState<string | null>(null);

  const handleFileOpen = (file: any) => {
    console.log('File opened:', file);
    setOpenFile(file.name);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📝 Lapdev IDE</h1>
        <MockTerminal />
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
              <p>从左侧文件树选择一个文件开始编辑</p>
            </div>
          )}
        </main>
        <MockAIPanel />
      </div>
    </div>
  );
}

export default SimpleIDE;
