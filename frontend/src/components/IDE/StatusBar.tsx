import { LanguageSelector } from '../Language/LanguageSelector';

interface StatusBarProps {
  currentBranch: string;
  changesCount: number;
}

/**
 * IDE 底部状态栏组件
 * 提取自 IDE.tsx，显示分支信息和变更数量
 */
export function StatusBar({ currentBranch, changesCount }: StatusBarProps) {
  return (
    <footer className="status-bar" data-testid="status-bar">
      <div className="status-left">
        {currentBranch && (
          <span className="branch-info" data-testid="branch-info">
            🌿 {currentBranch}
          </span>
        )}
        {changesCount > 0 && (
          <span className="changes-count" data-testid="changes-count">
            {changesCount} changes
          </span>
        )}
      </div>
      <div className="status-right">
        <LanguageSelector className="mr-4" />
        <span>Lapdev v1.0</span>
      </div>
    </footer>
  );
}
