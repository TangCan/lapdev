import React from 'react';
import { useGit } from '../../context/GitContext';

const DiffView: React.FC = () => {
  const { selectedFileDiff, selectedFilePath } = useGit();

  if (!selectedFileDiff) return null;

  const parseDiff = (diff: string) => {
    const lines = diff.split('\n');
    const parsedLines: { type: string; content: string }[] = [];

    lines.forEach((line) => {
      if (line.startsWith('@@')) {
        parsedLines.push({ type: 'header', content: line });
      } else if (line.startsWith('+')) {
        parsedLines.push({ type: 'addition', content: line.slice(1) });
      } else if (line.startsWith('-')) {
        parsedLines.push({ type: 'deletion', content: line.slice(1) });
      } else if (line.startsWith(' ')) {
        parsedLines.push({ type: 'context', content: line.slice(1) });
      } else {
        parsedLines.push({ type: 'other', content: line });
      }
    });

    return parsedLines;
  };

  const parsedDiff = parseDiff(selectedFileDiff);

  return (
    <div className="diff-view" data-testid="diff-view">
      <div className="diff-header">
        <span className="file-name">{selectedFilePath}</span>
      </div>
      <div className="diff-content">
        {parsedDiff.map((line, index) => (
          <div
            key={index}
            className={`diff-line ${line.type}`}
          >
            {line.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiffView;
