import { useState } from 'react';
import { FileTree } from './components/FileTree';
import type { FileInfo } from './types/file';

interface Tab {
  id: string;
  file: FileInfo;
}

function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const handleFileOpen = (file: FileInfo) => {
    const existingTab = tabs.find(tab => tab.file.path === file.path);
    
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const newTab: Tab = {
        id: `tab-${Date.now()}`,
        file
      };
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
    }
  };

  const handleCloseTab = (tabId: string) => {
    setTabs(tabs.filter(tab => tab.id !== tabId));
    
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[remainingTabs.length - 1].id : null);
    }
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className="app">
      <header className="header">
        <h1>📝 Lapdev IDE</h1>
      </header>
      
      <div className="main-content">
        <aside className="sidebar">
          <FileTree onFileOpen={handleFileOpen} />
        </aside>
        
        <main className="editor-area">
          <div className="tabs">
            {tabs.map(tab => (
              <div
                key={tab.id}
                className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
                data-testid="editor-tab"
              >
                <span className="tab-icon">{tab.file.type === 'directory' ? '📁' : '📄'}</span>
                <span className="tab-name">{tab.file.name}</span>
                <button 
                  className="close-tab" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <div className="editor-container" data-testid="editor-content">
            {activeTab ? (
              <div className="editor">
                <div className="editor-header">
                  <span className="file-path">{activeTab.file.path}</span>
                </div>
                <pre className="file-content">{/* File content will be loaded here */}</pre>
              </div>
            ) : (
              <div className="welcome-screen">
                <h2>欢迎使用 Lapdev</h2>
                <p>点击左侧文件树中的文件开始编辑</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;