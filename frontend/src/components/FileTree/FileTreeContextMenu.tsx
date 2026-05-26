import { useState } from 'react';
import type { FileInfo } from '../../types/file';
import { createFile, renameFile, deleteFile } from '../../services/fileService';

interface FileTreeContextMenuProps {
  file: FileInfo;
  position: { x: number; y: number };
  onClose: () => void;
  onRefresh: () => void;
}

export function FileTreeContextMenu({ file, position, onClose, onRefresh }: FileTreeContextMenuProps) {
  const [renameInput, setRenameInput] = useState(file.name);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleCreateFile = async () => {
    const newFileName = 'new-file.txt';
    const newFilePath = file.type === 'directory' 
      ? `${file.path}/${newFileName}`
      : `${file.path}/../${newFileName}`;
    
    await createFile({ path: newFilePath, type: 'file' });
    onRefresh();
    onClose();
  };

  const handleCreateFolder = async () => {
    const newFolderName = 'new-folder';
    const newFolderPath = file.type === 'directory' 
      ? `${file.path}/${newFolderName}`
      : `${file.path}/../${newFolderName}`;
    
    await createFile({ path: newFolderPath, type: 'directory' });
    onRefresh();
    onClose();
  };

  const handleRename = async () => {
    const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
    const newPath = `${parentPath}/${renameInput}`;
    
    await renameFile({ oldPath: file.path, newPath });
    setIsRenaming(false);
    onRefresh();
    onClose();
  };

  const handleDelete = async () => {
    if (confirm(`确定要删除 "${file.name}" 吗？`)) {
      await deleteFile({ path: file.path });
      onRefresh();
      onClose();
    }
  };

  return (
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
  );
}