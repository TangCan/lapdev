import { useEffect } from 'react';

interface UseKeyboardShortcutsParams {
  onSave?: () => void;
  onFormat?: () => void;
}

/**
 * 键盘快捷键 Hook
 * 提取自 IDE.tsx，负责全局键盘快捷键的注册和清理
 */
export function useKeyboardShortcuts({ onSave, onFormat }: UseKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: 保存文件
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
      // Ctrl+Shift+F: 格式化代码
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        onFormat?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onFormat]);
}
