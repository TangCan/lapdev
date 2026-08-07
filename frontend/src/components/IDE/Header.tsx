import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Tab } from '../../hooks/useEditorTabs';

interface HeaderProps {
  activeTab: Tab | null;
  isSaving: boolean;
  isFormatting: boolean;
  showGitPanel: boolean;
  showProblemsPanel: boolean;
  showTerminal: boolean;
  showPerformancePanel: boolean;
  isAIPanelOpen: boolean;
  changesCount: number;
  onSave: () => void;
  onFormat: () => void;
  onToggleGitPanel: () => void;
  onToggleProblemsPanel: () => void;
  onToggleTerminal: () => void;
  onToggleAIPanel: () => void;
  onTogglePerformancePanel: () => void;
}

/**
 * IDE 顶部工具栏组件
 * 提取自 IDE.tsx，包含保存、格式化、Git、终端等操作按钮
 */
export function Header({
  activeTab,
  isSaving,
  isFormatting,
  showGitPanel,
  showProblemsPanel,
  showTerminal,
  showPerformancePanel,
  isAIPanelOpen,
  changesCount,
  onSave,
  onFormat,
  onToggleGitPanel,
  onToggleProblemsPanel,
  onToggleTerminal,
  onToggleAIPanel,
  onTogglePerformancePanel,
}: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="header">
      <h1>📝 Lapdev IDE</h1>
      <div className="header-actions">
        <button
          className="action-button"
          onClick={onSave}
          disabled={!activeTab || !activeTab.isModified || isSaving}
          data-testid="save-button"
        >
          {isSaving ? '⏳ ' + t('ide.fileSaved') : '💾 ' + t('common.save')}
        </button>
        <button
          className="action-button"
          onClick={onFormat}
          disabled={!activeTab || isFormatting}
          data-testid="format-button"
        >
          {isFormatting ? '⏳ ' + t('ide.formatting') : '🎨 ' + t('editor.format')}
        </button>
        <button
          className={`action-button ${showGitPanel ? 'active' : ''}`}
          onClick={onToggleGitPanel}
          data-testid="git-panel-button"
        >
          🗂️ {t('git.title')} {changesCount > 0 && `(${changesCount})`}
        </button>
        <button
          className={`action-button ${showProblemsPanel ? 'active' : ''}`}
          onClick={onToggleProblemsPanel}
          data-testid="problems-panel-button"
        >
          ⚠️ {t('ide.problems')}
        </button>
        <button
          className={`action-button ${showTerminal ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleTerminal();
          }}
          data-testid="header-terminal-button"
        >
          🖥️ {t('ide.terminal')}
        </button>
        <Link to="/settings" className="action-button" data-testid="header-settings-button">
          ⚙️ {t('common.settings')}
        </Link>
        <button
          className={`action-button ${isAIPanelOpen ? 'active' : ''}`}
          onClick={onToggleAIPanel}
          data-testid="header-ai-panel-button"
        >
          🤖 {t('ai.title')}
        </button>
        <button
          className={`action-button ${showPerformancePanel ? 'active' : ''}`}
          onClick={onTogglePerformancePanel}
          data-testid="performance-panel-button"
        >
          ⚡ {t('performance.title')}
        </button>
      </div>
    </header>
  );
}
