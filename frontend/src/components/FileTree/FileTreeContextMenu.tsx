import { useState } from 'react';
import type { FileInfo } from '../../types/file';
import { createFile, renameFile, deleteFile } from '../../services/fileService';
import { ConfirmDialog } from './ConfirmDialog';

interface FileTreeContextMenuProps {
  file: FileInfo;
  position: { x: number; y: number };
  onClose: () => void;
  onRefresh: () => void;
}

export function FileTreeContextMenu({ file, position, onClose, onRefresh }: FileTreeContextMenuProps) {
  const [renameInput, setRenameInput] = useState(file.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const isNonEmptyDirectory = file.type === 'directory' && 
    file.children && 
    file.children.length > 0;

  const handleCreateFile = async () => {
    console.log('[FileTreeContextMenu] handleCreateFile called');
    console.log('[FileTreeContextMenu] file:', JSON.stringify(file));
    
    const baseName = 'new-file';
    const ext = '.txt';
    const parentPath = file.type === 'directory' 
      ? file.path
      : file.path.substring(0, file.path.lastIndexOf('/'));
    
    console.log('[FileTreeContextMenu] parentPath:', parentPath);
    
    let newFileName = `${baseName}${ext}`;
    let newFilePath = `${parentPath}/${newFileName}`;
    
    console.log('[FileTreeContextMenu] Creating file:', newFilePath);
    
    const result = await createFile({ path: newFilePath, type: 'file' });
    console.log('[FileTreeContextMenu] createFile result:', JSON.stringify(result));
    
    if (result.status === 'error' && result.message.includes('already exists')) {
      let counter = 2;
      while (counter <= 100) {
        newFileName = `${baseName} (${counter})${ext}`;
        newFilePath = `${parentPath}/${newFileName}`;
        const retryResult = await createFile({ path: newFilePath, type: 'file' });
        if (retryResult.status === 'success') {
          console.log('[FileTreeContextMenu] Retry succeeded with:', newFilePath);
          break;
        }
        counter++;
      }
    }
    
    console.log('[FileTreeContextMenu] Calling onClose first to reset isPaused...');
    onClose();
    console.log('[FileTreeContextMenu] Calling onRefresh after isPaused reset...');
    onRefresh();
  };

  const handleCreateFolder = async () => {
    console.log('[FileTreeContextMenu] handleCreateFolder called');
    console.log('[FileTreeContextMenu] file:', JSON.stringify(file));
    
    const baseName = 'new-folder';
    const parentPath = file.type === 'directory' 
      ? file.path
      : file.path.substring(0, file.path.lastIndexOf('/'));
    
    console.log('[FileTreeContextMenu] parentPath:', parentPath);
    
    let newFolderName = baseName;
    let newFolderPath = `${parentPath}/${newFolderName}`;
    
    console.log('[FileTreeContextMenu] Creating folder:', newFolderPath);
    
    const result = await createFile({ path: newFolderPath, type: 'directory' });
    console.log('[FileTreeContextMenu] createFolder result:', JSON.stringify(result));
    
    if (result.status === 'error' && result.message.includes('already exists')) {
      let counter = 2;
      while (counter <= 100) {
        newFolderName = `${baseName} (${counter})`;
        newFolderPath = `${parentPath}/${newFolderName}`;
        const retryResult = await createFile({ path: newFolderPath, type: 'directory' });
        if (retryResult.status === 'success') {
          console.log('[FileTreeContextMenu] Retry succeeded with:', newFolderPath);
          break;
        }
        counter++;
      }
    }
    
    console.log('[FileTreeContextMenu] Calling onClose first to reset isPaused...');
    onClose();
    console.log('[FileTreeContextMenu] Calling onRefresh after isPaused reset...');
    onRefresh();
  };

  const handleRename = async () => {
    setRenameError(null);
    const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
    const newPath = `${parentPath}/${renameInput}`;
    
    const result = await renameFile({ oldPath: file.path, newPath });
    
    if (result.status === 'success') {
      setIsRenaming(false);
      onRefresh();
      onClose();
    } else {
      setRenameError(result.message || '重命名失败');
    }
  };

  const handleDelete = async () => {
    if (isNonEmptyDirectory) {
      setShowDeleteConfirm(true);
      return;
    }
    
    const result = await deleteFile({ path: file.path });
    
    if (result.status === 'success') {
      onRefresh();
      onClose();
    } else {
      console.error('删除失败:', result.message);
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    const result = await deleteFile({ path: file.path });
    
    if (result.status === 'success') {
      onRefresh();
      onClose();
    } else {
      console.error('删除失败:', result.message);
    }
  };

  return (
    <>
      <div
        className="context-menu"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 1000
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="context-menu"
      >
        {isRenaming ? (
          <div className="rename-input-container">
            <input
              type="text"
              value={renameInput}
              onChange={(e) => {
                setRenameInput(e.target.value);
                setRenameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              autoFocus
              className="rename-input"
              data-testid="rename-input"
            />
            {renameError && (
              <div className="rename-error">
                {renameError}
              </div>
            )}
            <button onClick={handleRename} className="context-menu-item">
              确认
            </button>
            <button onClick={() => setIsRenaming(false)} className="context-menu-item">
              取消
            </button>
          </div>
        ) : (
          <>
            <button 
              className="context-menu-item" 
              onClick={handleCreateFile}
              data-testid="context-menu-item"
            >
              📄 新建文件
            </button>
            <button 
              className="context-menu-item" 
              onClick={handleCreateFolder}
              data-testid="context-menu-item"
            >
              📁 新建文件夹
            </button>
            <hr className="context-menu-divider" />
            <button 
              className="context-menu-item" 
              onClick={() => setIsRenaming(true)}
              data-testid="context-menu-item"
            >
              ✏️ 重命名
            </button>
            <button 
              className="context-menu-item danger" 
              onClick={handleDelete}
              data-testid="context-menu-item"
            >
              🗑️ 删除
            </button>
          </>
        )}
      </div>
      
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="确认删除"
        message={`确定要删除文件夹 "${file.name}" 及其所有内容吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
