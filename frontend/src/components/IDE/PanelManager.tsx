import GitPanel from '../Git/GitPanel';
import ProblemsPanel from '../Problems/ProblemsPanel';
import { PerformancePanel } from '../Performance/PerformancePanel';

interface PanelManagerProps {
  showGitPanel: boolean;
  showProblemsPanel: boolean;
  showPerformancePanel: boolean;
  onSelectProblem?: (line: number, column: number) => void;
}

/**
 * 面板管理器组件
 * 提取自 IDE.tsx，负责管理 Git、Problems、Performance 等侧边面板的显示
 */
export function PanelManager({
  showGitPanel,
  showProblemsPanel,
  showPerformancePanel,
  onSelectProblem,
}: PanelManagerProps) {
  return (
    <>
      {showGitPanel && (
        <aside className="git-sidebar">
          <GitPanel />
        </aside>
      )}

      {showProblemsPanel && (
        <aside className="problems-sidebar">
          <ProblemsPanel onSelectProblem={onSelectProblem} />
        </aside>
      )}

      {showPerformancePanel && (
        <aside className="performance-sidebar">
          <PerformancePanel />
        </aside>
      )}
    </>
  );
}
