/**
 * GitPanel Component
 * Git version control visualization and operations
 */

import React, { useState, useEffect } from 'react';
import { GitBranch, GitCommit, GitPullRequest, GitMerge, FileModified, FileAdded, FileDeleted } from 'lucide-react';

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
}

interface GitPanelProps {
  repositoryPath?: string;
}

export const GitPanel: React.FC<GitPanelProps> = ({ repositoryPath }) => {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diff, setDiff] = useState<string>('');

  useEffect(() => {
    fetchStatus();
  }, [repositoryPath]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/v1/git/status');
      const data = await response.json();
      if (data.status === 'success') {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch git status:', error);
    }
  };

  const fetchDiff = async (file: string) => {
    try {
      const response = await fetch(`/api/v1/git/diff?file=${encodeURIComponent(file)}`);
      const data = await response.json();
      if (data.status === 'success') {
        setDiff(data.diff);
        setSelectedFile(file);
      }
    } catch (error) {
      console.error('Failed to fetch diff:', error);
    }
  };

  const stageFile = async (file: string) => {
    try {
      await fetch('/api/v1/git/stage', {
        method: 'POST',
        body: JSON.stringify({ file })
      });
      fetchStatus();
    } catch (error) {
      console.error('Failed to stage file:', error);
    }
  };

  const commit = async (message: string) => {
    try {
      await fetch('/api/v1/git/commit', {
        method: 'POST',
        body: JSON.stringify({ message })
      });
      fetchStatus();
    } catch (error) {
      console.error('Failed to commit:', error);
    }
  };

  return (
    <div className="h-full bg-gray-800 text-white flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-700 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-green-400" />
          <span className="font-semibold text-sm">{status?.branch || 'main'}</span>
          {status && (
            <span className="text-xs text-gray-400">
              {status.ahead > 0 && `↑${status.ahead}`}
              {status.behind > 0 && `↓${status.behind}`}
            </span>
          )}
        </div>
      </div>

      {/* Status Sections */}
      <div className="flex-1 overflow-auto p-2">
        {/* Staged Files */}
        {status?.staged.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <FileAdded size={12} />
              <span>Staged</span>
            </div>
            {status.staged.map(file => (
              <div
                key={file}
                className="text-sm px-2 py-1 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                onClick={() => fetchDiff(file)}
              >
                <span className="text-green-400">{file}</span>
              </div>
            ))}
          </div>
        )}

        {/* Modified Files */}
        {status?.modified.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <FileModified size={12} />
              <span>Modified</span>
            </div>
            {status.modified.map(file => (
              <div
                key={file}
                className="text-sm px-2 py-1 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                onClick={() => fetchDiff(file)}
              >
                <span className="text-yellow-400">{file}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); stageFile(file); }}
                  className="text-xs bg-green-600 hover:bg-green-500 px-2 py-0.5 rounded"
                >
                  Stage
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Untracked Files */}
        {status?.untracked.length > 0 && (
          <div>
            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <FileDeleted size={12} />
              <span>Untracked</span>
            </div>
            {status.untracked.map(file => (
              <div
                key={file}
                className="text-sm px-2 py-1 hover:bg-gray-700 cursor-pointer flex items-center justify-between"
                onClick={() => fetchDiff(file)}
              >
                <span className="text-red-400">{file}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); stageFile(file); }}
                  className="text-xs bg-green-600 hover:bg-green-500 px-2 py-0.5 rounded"
                >
                  Stage
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Diff View */}
        {selectedFile && diff && (
          <div className="mt-4 p-2 bg-gray-900 rounded">
            <div className="text-xs text-gray-400 mb-2">Diff: {selectedFile}</div>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-auto max-h-32">
              {diff}
            </pre>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 border-t border-gray-600">
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm">
            <GitCommit size={14} />
            <span>Commit</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-sm">
            <GitPullRequest size={14} />
            <span>Pull</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 bg-orange-600 hover:bg-orange-500 px-3 py-1.5 rounded text-sm">
            <GitMerge size={14} />
            <span>Push</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitPanel;