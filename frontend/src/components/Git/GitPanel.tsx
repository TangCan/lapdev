import React from 'react';
import { useGit } from '../../context/GitContext';
import GitStatusList from './GitStatus';
import DiffView from './DiffView';
import BranchSelector from './BranchSelector';
import CommitForm from './CommitForm';

const GitPanel: React.FC = () => {
  const { status, currentBranch, isLoading, error, refreshStatus } = useGit();

  if (isLoading) {
    return (
      <div className="git-panel" data-testid="git-panel">
        <div className="git-panel-header">
          <h2>Git</h2>
          <BranchSelector />
        </div>
        <div className="git-panel-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="git-panel" data-testid="git-panel">
        <div className="git-panel-header">
          <h2>Git</h2>
          <BranchSelector />
        </div>
        <div className="git-panel-content">
          <div className="no-git-repo" data-testid="no-git-repo">
            <p>{error}</p>
            <button onClick={refreshStatus} className="refresh-btn">
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalChanges = status.changes.length + status.untracked.length;

  return (
    <div className="git-panel" data-testid="git-panel">
      <div className="git-panel-header">
        <div className="git-header-left">
          <h2>Git</h2>
          <span className="current-branch">{currentBranch}</span>
        </div>
        <div className="git-header-right">
          <BranchSelector />
          <button onClick={refreshStatus} className="refresh-btn">
            ↻
          </button>
        </div>
      </div>

      <div className="git-panel-content">
        <div className="git-tabs">
          <button className="git-tab active">Changes ({totalChanges})</button>
        </div>

        {status.changes.length === 0 && status.untracked.length === 0 ? (
          <div className="no-changes" data-testid="no-changes">
            <p>No changes to commit</p>
            <p>Your working directory is clean</p>
          </div>
        ) : (
          <>
            <GitStatusList />
            <CommitForm />
          </>
        )}
      </div>

      <DiffView />
    </div>
  );
};

export default GitPanel;
