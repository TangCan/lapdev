import type { Tab } from '../../hooks/useEditorTabs';
import type { DiffLine } from '../../types/diff';
import { LazyCodeEditor } from '../Editor/LazyCodeEditor';

interface EditorAreaProps {
  tabs: Tab[];
  activeTabId: string | null;
  loadingFiles: Set<string>;
  diffLines: Record<string, DiffLine[]>;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onContentChange: (tabId: string, content: string) => void;
}

/**
 * 编辑器区域组件
 * 提取自 IDE.tsx，负责标签页栏和代码编辑器渲染
 */
export function EditorArea({
  tabs,
  activeTabId,
  loadingFiles,
  diffLines,
  onSwitchTab,
  onCloseTab,
  onContentChange,
}: EditorAreaProps) {
  const activeTab = tabs.find(tab => tab.id === activeTabId) || null;

  return (
    <>
      <div className="tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => onSwitchTab(tab.id)}
            data-testid="editor-tab"
          >
            <span className="tab-icon">{tab.file.type === 'directory' ? '📁' : '📄'}</span>
            <span className="tab-name">{tab.file.name}</span>
            {tab.isModified && (
              <span className="modified-indicator" data-testid="modified-indicator">
                ●
              </span>
            )}
            <button
              className="close-tab"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="editor-container" data-testid="editor-content">
        {activeTab ? (
          <div className="editor-wrapper">
            {loadingFiles.has(activeTab.file.path) ? (
              <div className="loading-editor">Loading...</div>
            ) : (
              <LazyCodeEditor
                value={activeTab.content}
                language={activeTab.language}
                onChange={(value) => onContentChange(activeTab.id, value)}
                diffLines={diffLines[activeTab.file.path] || []}
                uri={`file://${activeTab.file.path}`}
              />
            )}
          </div>
        ) : (
          <div className="welcome-screen">
            <h2>欢迎使用 Lapdev</h2>
            <p>点击左侧文件树中的文件开始编辑</p>
            <div className="shortcuts">
              <p>
                <kbd>Ctrl+S</kbd> 保存文件
              </p>
              <p>
                <kbd>Ctrl+Shift+F</kbd> 格式化代码
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
