import React from 'react';
import { useGit } from '../../context/GitContext';

const GitStatusList: React.FC = () => {
  const { status, getFileDiff, stageFile } = useGit();

  if (!status) return null;

  const renderChangeIcon = (status: string) => {
    switch (status) {
      case 'modified':
        return <span className="change-icon modified">M</span>;
      case 'added':
        return <span className="change-icon added">A</span>;
      case 'deleted':
        return <span className="change-icon deleted">D</span>;
      case 'renamed':
        return <span className="change-icon renamed">R</span>;
      default:
        return <span className="change-icon unknown">?</span>;
    }
  };

  const handleFileClick = (path: string) => {
    getFileDiff(path);
  };

  const handleStageClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    stageFile(path);
  };

  return (
    <div className="git-changes-list" data-testid="git-changes-list">
      {status.changes.map((change, index) => (
        <div
          key={`${change.path}-${index}`}
          className={`git-change-item ${change.staged ? 'staged' : ''}`}
          data-testid="git-change-item"
          onClick={() => handleFileClick(change.path)}
        >
          {renderChangeIcon(change.status)}
          <span className="file-path">{change.path}</span>
          {!change.staged && (
            <button
              className="stage-btn"
              onClick={(e) => handleStageClick(e, change.path)}
              title="Stage file"
            >
              +
            </button>
          )}
        </div>
      ))}

      {status.untracked.map((file, index) => (
        <div
          key={`untracked-${file}-${index}`}
          className="git-change-item untracked"
          data-testid="git-change-item"
          onClick={() => handleFileClick(file)}
        >
          <span className="change-icon untracked">?</span>
          <span className="file-path">{file}</span>
          <button
            className="stage-btn"
            onClick={(e) => handleStageClick(e, file)}
            title="Stage file"
          >
            +
          </button>
        </div>
      ))}
    </div>
  );
};

export default GitStatusList;
