import { useState } from 'react';

export function MockGitPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [showBranchList, setShowBranchList] = useState(false);

  const branches = [
    { name: 'main', isCurrent: true },
    { name: 'feature/test', isCurrent: false },
    { name: 'feature/editor', isCurrent: false },
    { name: 'bugfix/git-panel', isCurrent: false },
  ];

  const changes = [
    { name: 'src/main.ts', status: 'modified' },
    { name: 'src/utils.ts', status: 'added' },
    { name: 'tests/app.test.ts', status: 'deleted' },
  ];

  return (
    <>
      {/* Git Panel Button */}
      <button
        data-testid="git-panel-button"
        className="git-panel-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        📦 Git ({changes.length})
      </button>

      {/* Git Panel */}
      {isOpen && (
        <div className="git-panel" data-testid="git-panel">
          {/* Branch Selector */}
          <div className="git-panel-header">
            <button
              data-testid="branch-selector"
              className="branch-selector"
              onClick={() => setShowBranchList(!showBranchList)}
            >
              <span className="branch-icon">🌿</span>
              <span className="branch-name">{selectedBranch}</span>
              <span className="branch-arrow">▼</span>
            </button>
            
            {/* Branch List */}
            {showBranchList && (
              <div className="branch-list" data-testid="branch-list">
                {branches.map((branch) => (
                  <div
                    key={branch.name}
                    className={`branch-item ${branch.isCurrent ? 'current-branch' : ''}`}
                    data-testid={branch.isCurrent ? 'current-branch' : undefined}
                    onClick={() => {
                      setSelectedBranch(branch.name);
                      setShowBranchList(false);
                    }}
                  >
                    {branch.isCurrent && <span className="check-icon">✓</span>}
                    {branch.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Changes List */}
          <div className="git-panel-content">
            <h3>Changes ({changes.length})</h3>
            <div className="changes-list" data-testid="git-changes-list">
              {changes.map((change, index) => (
                <div
                  key={index}
                  className={`change-item ${change.status}`}
                  data-testid="change-item"
                >
                  <span className="change-icon">
                    {change.status === 'modified' && '✏️'}
                    {change.status === 'added' && '➕'}
                    {change.status === 'deleted' && '➖'}
                  </span>
                  <span className="change-name">{change.name}</span>
                  <span className="change-status">{change.status}</span>
                </div>
              ))}
            </div>

            {/* Commit Section */}
            <div className="commit-section">
              <textarea
                className="commit-message"
                placeholder="Commit message..."
                data-testid="commit-message"
              />
              <button className="commit-button" data-testid="commit-button">
                Commit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="status-bar" data-testid="status-bar">
        <span className="status-left">
          <span data-testid="branch-info" className="branch-info">
            🌿 {selectedBranch}
          </span>
          <span data-testid="changes-count" className="changes-count">
            {changes.length} changes
          </span>
        </span>
        <span className="status-right">
          <span>TypeScript</span>
          <span>UTF-8</span>
        </span>
      </div>
    </>
  );
}