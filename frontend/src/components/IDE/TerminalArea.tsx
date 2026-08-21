import { Terminal } from '../Terminal/Terminal';

interface TerminalAreaProps {
  showTerminal: boolean;
  terminalHeight: number;
  onClose: () => void;
  onResize: (height: number) => void;
}

/**
 * 终端面板组件
 * 提取自 IDE.tsx，负责终端面板的显示和高度调整
 */
export function TerminalArea({
  showTerminal,
  terminalHeight,
  onClose,
  onResize,
}: TerminalAreaProps) {
  if (!showTerminal) return null;

  return (
    <div
      className="terminal-container"
      style={{ height: `${terminalHeight}px` }}
      data-testid="terminal-container"
    >
      <Terminal onClose={onClose} onResize={onResize} />
    </div>
  );
}
