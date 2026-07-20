import { useState, useCallback } from 'react';
import { FileTree } from '../FileTree/FileTree';
import { CodeEditor } from '../Editor/CodeEditor';
import { Terminal } from '../Terminal/Terminal';
import GitPanel from '../Git/GitPanel';
import AIChatPanel from '../AI/AIChatPanel';
import { SkillProvider } from '../../context/SkillContext';
import { useGit } from '../../context/GitContext';
import { useChat } from '../../context/ChatContext';
import type { FileInfo } from '../../types/file';
import { readFile } from '../../services/fileService';

function SimpleIDE() {
  const [openFile, setOpenFile] = useState<FileInfo | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);

  const { refreshStatus } = useGit();
  const { isPanelOpen, togglePanel } = useChat();

  const handleFileOpen = useCallback(async (file: FileInfo) => {
    setLoading(true);
    setOpenFile(file);
    
    try {
      const result = await readFile(file.path);
      if (result.status === 'success' && result.data) {
        setFileContent(result.data.content);
      } else {
        setFileContent('');
      }
    } catch (error) {
      console.error('Failed to read file:', error);
      setFileContent('');
    } finally {
      setLoading(false);
      refreshStatus();
    }
  }, [refreshStatus]);

  const handleContentChange = useCallback((content: string) => {
    setFileContent(content);
  }, []);

  return (
    <SkillProvider>
      <div className="app">
        <header className="header">
          <h1>📝 Lapdev IDE</h1>
          <Terminal onClose={() => {}} onResize={() => {}} />
          <GitPanel />
          <button
            className={`ai-panel-button ${isPanelOpen ? 'active' : ''}`}
            onClick={togglePanel}
            data-testid="ai-panel-button"
            title="Toggle AI Panel"
          >
            🤖
          </button>
        </header>
        <div className="main-content">
          <aside className="sidebar">
            <FileTree onFileOpen={handleFileOpen} />
          </aside>
          <main className="editor-area">
            {openFile ? (
              loading ? (
                <div className="loading">Loading...</div>
              ) : (
                <CodeEditor
                  value={fileContent}
                  language={openFile.name.split('.').pop() || 'plaintext'}
                  onChange={handleContentChange}
                />
              )
            ) : (
              <div className="welcome-screen">
                <h2>欢迎使用 Lapdev</h2>
                <p>点击左侧文件树中的文件开始编辑</p>
              </div>
            )}
          </main>
          <AIChatPanel />
        </div>
      </div>
    </SkillProvider>
  );
}

export default SimpleIDE;
