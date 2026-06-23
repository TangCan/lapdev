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

  const isNonEmptyDirectory = file.type === 'directory' && 
    file.children && 
    file.children.length > 0;

  const handleCreateFile = async () => {
    const baseName = 'new-file';
    const ext = '.txt';
    const parentPath = file.type === 'directory' 
      ? file.path
      : file.path.substring(0, file.path.lastIndexOf('/'));
    
    let newFileName = `${baseName}${ext}`;
    let newFilePath = `${parentPath}/${newFileName}`;
    
    const result = await createFile({ path: newFilePath, type: 'file' });
    
    if (result.status === 'error' && result.message.includes('already exists')) {
      let counter = 2;
      while (counter <= 100) {
        newFileName = `${baseName} (${counter})${ext}`;
        newFilePath = `${parentPath}/${newFileName}`;
        const retryResult = await createFile({ path: newFilePath, type: 'file' });
        if (retryResult.status === 'success') {
          break;
        }
        counter++;
      }
    }
    
    onRefresh();
    onClose();
  };

  const handleCreateFolder = async () => {
    const baseName = 'new-folder';
    const parentPath = file.type === 'directory' 
      ? file.path
      : file.path.substring(0, file.path.lastIndexOf('/'));
    
    let newFolderName = baseName;
    let newFolderPath = `${parentPath}/${newFolderName}`;
    
    const result = await createFile({ path: newFolderPath, type: 'directory' });
    
    if (result.status === 'error' && result.message.includes('already exists')) {
      let counter = 2;
      while (counter <= 100) {
        newFolderName = `${baseName} (${counter})`;
        newFolderPath = `${parentPath}/${newFolderName}`;
        const retryResult = await createFile({ path: newFolderPath, type: 'directory' });
        if (retryResult.status === 'success') {
          break;
        }
        counter++;
      }
    }
    
    onRefresh();
    onClose();
  };

  const handleRename = async () => {
    const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
    const newPath = `${parentPath}/${renameInput}`;
    
    const result = await renameFile({ oldPath: file.path, newPath });
    
    if (result.status === 'success') {
      setIsRenaming(false);
      onRefresh();
      onClose();
    } else {
      console.error('重命名失败:', result.message);
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
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              autoFocus
              className="rename-input"
              data-testid="rename-input"
            />
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