interface CloseTabModalProps {
  fileName: string;
  isSaving: boolean;
  onSaveAndClose: () => void;
  onDiscardAndClose: () => void;
  onCancel: () => void;
}

/**
 * 关闭标签页确认弹窗组件
 * 提取自 IDE.tsx，当用户尝试关闭已修改的文件时显示
 */
export function CloseTabModal({
  fileName,
  isSaving,
  onSaveAndClose,
  onDiscardAndClose,
  onCancel,
}: CloseTabModalProps) {
  return (
    <div className="modal-overlay" data-testid="close-confirm-modal">
      <div className="modal-content">
        <h3>文件已修改</h3>
        <p>文件 "{fileName}" 已被修改，是否保存更改？</p>
        <div className="modal-actions">
          <button
            className="modal-button modal-button-primary"
            onClick={onSaveAndClose}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存并关闭'}
          </button>
          <button
            className="modal-button modal-button-secondary"
            onClick={onDiscardAndClose}
          >
            不保存并关闭
          </button>
          <button
            className="modal-button modal-button-cancel"
            onClick={onCancel}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
