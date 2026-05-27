import React, { useState } from 'react';
import { useGit } from '../../context/GitContext';

const CommitForm: React.FC = () => {
  const { status, commit, stageFiles, refreshStatus } = useGit();
  const [message, setMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStageAll = async () => {
    if (!status) return;
    const allPaths = [...status.changes.map(c => c.path), ...status.untracked];
    await stageFiles(allPaths);
    refreshStatus();
  };

  const handleCommit = async () => {
    if (!message.trim()) return;
    
    setIsCommitting(true);
    await commit(message.trim());
    setIsCommitting(false);
    setMessage('');
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  if (!status) return null;

  const stagedCount = status.changes.filter(c => c.staged).length;

  return (
    <div className="commit-form">
      {showSuccess && (
        <div className="commit-success" data-testid="commit-success">
          ✅ Commit successful!
        </div>
      )}
      
      <div className="commit-actions">
        <button className="stage-all-btn" onClick={handleStageAll}>
          Stage All
        </button>
      </div>
      
      {stagedCount > 0 && (
        <div className="staged-indicator">
          {stagedCount} file(s) staged for commit
        </div>
      )}
      
      <div className="commit-input-wrapper">
        <input
          type="text"
          className="commit-message-input"
          data-testid="commit-message-input"
          placeholder="Commit message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && message.trim()) {
              handleCommit();
            }
          }}
        />
        <button
          className="commit-button"
          data-testid="commit-button"
          onClick={handleCommit}
          disabled={!message.trim() || isCommitting}
        >
          {isCommitting ? 'Committing...' : 'Commit'}
        </button>
      </div>
    </div>
  );
};

export default CommitForm;
