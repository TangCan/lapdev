import React, { useEffect, useState, useCallback } from 'react';
import { Monaco } from '../../services/monacoLoader';
import { useLSP } from '../../context/LSPContext';

interface ProblemsPanelProps {
  onSelectProblem: (line: number, column: number) => void;
}

const ProblemsPanel: React.FC<ProblemsPanelProps> = ({ onSelectProblem }) => {
  const { getDiagnostics, subscribeToDiagnostics } = useLSP();
  const [problems, setProblems] = useState<Array<{
    line: number;
    column: number;
    severity: string;
    message: string;
    source: string;
  }>>([]);

  const updateProblems = useCallback(() => {
    const allProblems: typeof problems = [];
    
    const model = Monaco.editor.getModels()[0];
    if (model) {
      const uri = model.uri.toString();
      const diagnostics = getDiagnostics(uri);
      
      diagnostics.forEach((d) => {
        allProblems.push({
          line: d.range.startLineNumber,
          column: d.range.startColumn,
          severity: d.severity === Monaco.MarkerSeverity.Error ? 'error' :
                    d.severity === Monaco.MarkerSeverity.Warning ? 'warning' : 'info',
          message: d.message,
          source: d.source,
        });
      });
    }
    
    setProblems(allProblems);
  }, [getDiagnostics]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateProblems();

    const unsubscribe = subscribeToDiagnostics(updateProblems);
    return () => unsubscribe();
  }, [updateProblems, subscribeToDiagnostics]);

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  const getSeverityClass = (severity: string): string => {
    switch (severity) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const errorCount = problems.filter((p) => p.severity === 'error').length;
  const warningCount = problems.filter((p) => p.severity === 'warning').length;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <span>⚠</span>
          Problems
        </span>
        <span className="text-xs text-gray-500">
          {errorCount > 0 && <span className="text-red-500 mr-2">{errorCount} errors</span>}
          {warningCount > 0 && <span className="text-yellow-500">{warningCount} warnings</span>}
          {errorCount === 0 && warningCount === 0 && <span>No problems</span>}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {problems.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No problems detected
          </div>
        ) : (
          <ul className="space-y-1">
            {problems.map((problem, index) => (
              <li
                key={index}
                className="flex items-start gap-2 p-2 rounded hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => onSelectProblem(problem.line, problem.column)}
              >
                <span className={`mt-0.5 ${getSeverityClass(problem.severity)}`}>
                  {getSeverityIcon(problem.severity)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{problem.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Line {problem.line}, Column {problem.column}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProblemsPanel;
