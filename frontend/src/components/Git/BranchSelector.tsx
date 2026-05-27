import React, { useState } from 'react';
import { useGit } from '../../context/GitContext';

const BranchSelector: React.FC = () => {
  const { branches, currentBranch, checkout } = useGit();
  const [isOpen, setIsOpen] = useState(false);

  const handleBranchSelect = (branchName: string) => {
    if (branchName !== currentBranch) {
      checkout(branchName);
    }
    setIsOpen(false);
  };

  return (
    <div className="branch-selector-container">
      <button
        className="branch-selector"
        data-testid="branch-selector"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="branch-icon">🌿</span>
        <span className="branch-name">{currentBranch}</span>
        <span className="arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="branch-list" data-testid="branch-list">
          {branches.map((branch) => (
            <button
              key={branch.name}
              className={`branch-item ${branch.isCurrent ? 'current' : ''} ${branch.isRemote ? 'remote' : ''}`}
              data-testid={branch.isCurrent ? 'current-branch' : undefined}
              onClick={() => handleBranchSelect(branch.name)}
            >
              {branch.isCurrent && <span className="current-indicator">✓</span>}
              {branch.name}
              {branch.isRemote && <span className="remote-badge">remote</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchSelector;
