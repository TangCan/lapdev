import { useState, useCallback } from 'react';
import { FileTree } from '../FileTree';
import AIChatPanel from '../AI/AIChatPanel';
import { useEditorTabs } from '../../hooks/useEditorTabs';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useGitStore } from '../../stores/gitStore';
import { useChatStore } from '../../stores/chatStore';
import { writeFile } from '../../services/fileService';
import { Header } from './Header';
import { EditorArea } from './EditorArea';
import { TerminalArea } from './TerminalArea';
import { PanelManager } from './PanelManager';
import { StatusBar } from './StatusBar';
import { CloseTabModal } from './CloseTabModal';

function IDE() {
  // ─── Zustand Stores (replaces React Context) ──────────────────────
  const { status, currentBranch, refreshStatus } = useGitStore();
  const { isPanelOpen, togglePanel } = useChatStore();

  // ─── Editor Tabs (extracted hook) ─────────────────────────────────
  const {
    tabs,
    activeTabId,
    loadingFiles,
    diffLines,
    activeTab,
    openFile,
    closeTab,
    switchTab,
    updateContent,
    markSaved,
    updateTabContent,
  } = useEditorTabs();

  // ─── File Operations (extracted hook) ─────────────────────────────
  const {
    isSaving,
    isFormatting,
    errorMessage,
    handleSave,
    handleFormat,
  } = useFileOperations({
    tabs,
    activeTabId,
    markSaved,
    updateTabContent,
    refreshGitStatus: refreshStatus,
  });

  // ─── Keyboard Shortcuts (extracted hook) ──────────────────────────
  useKeyboardShortcuts({ onSave: handleSave, onFormat: handleFormat });

  // ─── UI State (kept inline — specific to layout) ─────────────────
  const [showGitPanel, setShowGitPanel] = useState(false);
  const [showProblemsPanel, setShowProblemsPanel] = useState(false);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [closeConfirm, setCloseConfirm] = useState<{
    tabId: string;
    fileName: string;
  } | null>(null);

  // ─── Derived ──────────────────────────────────────────────────────
  const changesCount = status
    ? status.changes.length + status.untracked.length
    : 0;

  // ─── Tab Close Handlers (with modified-file check) ────────────────
  const handleCloseTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.isModified) {
      setCloseConfirm({ tabId, fileName: tab.file.name });
      return;
    }
    closeTab(tabId);
  };

  const handleDiscardClose = () => {
    if (!closeConfirm) return;
    closeTab(closeConfirm.tabId);
    setCloseConfirm(null);
  };

  const handleSaveAndClose = useCallback(async () => {
    if (!closeConfirm) return;
    const tab = tabs.find(t => t.id === closeConfirm.tabId);
    if (!tab) {
      setCloseConfirm(null);
      return;
    }

    try {
      const result = await writeFile(tab.file.path, tab.content);
      if (result.status === 'success') {
        markSaved(closeConfirm.tabId);
        closeTab(closeConfirm.tabId);
        refreshStatus();
      }
    } catch {
      // Error already surfaced through the save flow
    } finally {
      setCloseConfirm(null);
    }
  }, [closeConfirm, tabs, markSaved, closeTab, refreshStatus]);

  const handleCancelClose = () => {
    setCloseConfirm(null);
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="app">
      <Header
        activeTab={activeTab}
        isSaving={isSaving}
        isFormatting={isFormatting}
        showGitPanel={showGitPanel}
        showProblemsPanel={showProblemsPanel}
        showTerminal={showTerminal}
        showPerformancePanel={showPerformancePanel}
        isAIPanelOpen={isPanelOpen}
        changesCount={changesCount}
        onSave={handleSave}
        onFormat={handleFormat}
        onToggleGitPanel={() => setShowGitPanel(!showGitPanel)}
        onToggleProblemsPanel={() => setShowProblemsPanel(!showProblemsPanel)}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        onToggleAIPanel={togglePanel}
        onTogglePerformancePanel={() => setShowPerformancePanel(!showPerformancePanel)}
      />

      <StatusBar currentBranch={currentBranch} changesCount={changesCount} />

      {errorMessage && (
        <div className="error-message" data-testid="error-message">
          ❌ {errorMessage}
        </div>
      )}

      <div className="main-content">
        <aside className="sidebar">
          <FileTree onFileOpen={openFile} />
        </aside>

        <main className="editor-area">
          <EditorArea
            tabs={tabs}
            activeTabId={activeTabId}
            loadingFiles={loadingFiles}
            diffLines={diffLines}
            onSwitchTab={switchTab}
            onCloseTab={handleCloseTab}
            onContentChange={updateContent}
          />

          <TerminalArea
            showTerminal={showTerminal}
            terminalHeight={terminalHeight}
            onClose={() => setShowTerminal(false)}
            onResize={setTerminalHeight}
          />
        </main>

        <PanelManager
          showGitPanel={showGitPanel}
          showProblemsPanel={showProblemsPanel}
          showPerformancePanel={showPerformancePanel}
          onSelectProblem={(line, column) => {
            console.log('Jump to problem:', line, column);
          }}
        />
      </div>

      <AIChatPanel />

      {closeConfirm && (
        <CloseTabModal
          fileName={closeConfirm.fileName}
          isSaving={isSaving}
          onSaveAndClose={handleSaveAndClose}
          onDiscardAndClose={handleDiscardClose}
          onCancel={handleCancelClose}
        />
      )}
    </div>
  );
}

export default IDE;
