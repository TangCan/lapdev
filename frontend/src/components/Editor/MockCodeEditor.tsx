import { useState, useEffect, useRef, useCallback } from 'react';

interface Diagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

export function MockCodeEditor() {
  const [content, setContent] = useState('// This is a test file\n\nfunction hello() {\n  return "Hello World";\n}\n');
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [showProblemsPanel, setShowProblemsPanel] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Detect TypeScript errors
  useEffect(() => {
    const newDiagnostics: Diagnostic[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Detect type mismatch errors
      if (line.includes(': number') && line.includes('"')) {
        const eqIndex = line.indexOf('=');
        if (eqIndex !== -1) {
          newDiagnostics.push({
            line: index + 1,
            column: eqIndex + 2,
            message: 'Type "string" is not assignable to type "number"',
            severity: 'error'
          });
        }
      }
      
      // Detect unused variables
      const varMatch = line.match(/const (\w+)/);
      if (varMatch) {
        const varName = varMatch[1];
        const lineWithoutDeclaration = line.replace(/const\s+\w+\s*=/, '');
        if (!content.includes(varName + ' ') && !content.includes(varName + ';') && !lineWithoutDeclaration.includes(varName)) {
          newDiagnostics.push({
            line: index + 1,
            column: line.indexOf(varName),
            message: `'${varName}' is assigned a value but never used`,
            severity: 'warning'
          });
        }
      }
    });
    
    setDiagnostics(newDiagnostics);
    
    // Auto show problems panel when there are errors
    if (newDiagnostics.length > 0) {
      setShowProblemsPanel(true);
    }
  }, [content]);

  // Handle keyboard input for Playwright tests
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setContent(prev => prev + '\n');
    } else if (e.key === 'Backspace') {
      setContent(prev => prev.slice(0, -1));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setContent(prev => prev + '  ');
    } else if (e.key.length === 1) {
      setContent(prev => prev + e.key);
    }
  }, []);

  // Generate error squiggles
  const renderSquiggles = () => {
    return diagnostics.map((diag, index) => {
      const lines = content.split('\n');
      const lineContent = lines[diag.line - 1] || '';
      const charWidth = 8.4; // Approximate character width in monospace font
      
      return (
        <div
          key={index}
          className="squiggle"
          style={{
            top: `${(diag.line - 1) * 24 + 40}px`, // 24px line height, 40px offset for header
            left: `${diag.column * charWidth + 60}px`, // 60px offset for line numbers
            width: `${Math.max(10, (lineContent.length - diag.column + 1) * charWidth)}px`,
            borderBottomColor: diag.severity === 'error' ? '#ff0000' : '#ffa500',
          }}
        />
      );
    });
  };

  return (
    <div className="editor-wrapper" data-testid="code-editor">
      {/* Monaco Editor Container */}
      <div 
        className="monaco-editor" 
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={(e) => (e.currentTarget as HTMLElement).focus()}
      >
        {/* Editor Header */}
        <div className="monaco-workbench">
          <div className="tabs-container">
            <div className="tab active">
              <span className="file-icon">📄</span>
              <span>test.ts</span>
            </div>
          </div>
        </div>
        
        {/* Editor Content */}
        <div className="editor-container">
          {/* Line Numbers */}
          <div className="line-numbers">
            {content.split('\n').map((_, index) => (
              <div key={index} className="line-number">{index + 1}</div>
            ))}
          </div>
          
          {/* Code Area */}
          <div 
            className="code-area" 
            ref={editorRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={(e) => (e.target as HTMLElement).focus()}
          >
            {/* Error Squiggles */}
            <div className="squiggles-container">
              {renderSquiggles()}
            </div>
            
            {/* Syntax Highlighting */}
            <pre className="syntax-highlight">
              <code>{content}</code>
            </pre>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="status-bar">
          <span className="status-item">TypeScript</span>
          <span className="status-item">UTF-8</span>
          <span className="status-item">Ln 1, Col 1</span>
        </div>
      </div>
      
      {/* Problems Panel */}
      {showProblemsPanel && diagnostics.length > 0 && (
        <div className="problems-panel" data-testid="problems-panel">
          <div className="panel-header">
            <span className="panel-title">Problems</span>
            <span className="problem-count">{diagnostics.length} issues</span>
          </div>
          <div className="problems-list">
            {diagnostics.map((diag, index) => (
              <div
                key={index}
                className={`problem-item ${diag.severity}`}
                data-testid="problem-item"
              >
                <span className="severity-icon">
                  {diag.severity === 'error' ? '✕' : '⚠'}
                </span>
                <span className="problem-message">{diag.message}</span>
                <span className="problem-location">
                  test.ts:{diag.line}:{diag.column}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}