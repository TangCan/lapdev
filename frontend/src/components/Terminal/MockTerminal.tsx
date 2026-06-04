import { useState, useRef, useEffect } from 'react';

interface TerminalLine {
  id: number;
  type: 'command' | 'output' | 'error';
  content: string;
}

export function MockTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 1, type: 'output', content: 'Welcome to Lapdev Terminal v1.0' },
    { id: 2, type: 'output', content: 'Type "help" for available commands' },
    { id: 3, type: 'output', content: '$' },
  ]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [height, setHeight] = useState(300);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when lines change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleExecute = async (command: string) => {
    if (!command.trim()) {
      // Add empty prompt for empty commands
      const emptyPrompt: TerminalLine = {
        id: Date.now(),
        type: 'output',
        content: '$'
      };
      setLines(prev => [...prev, emptyPrompt]);
      return;
    }

    // Add command to history with prompt
    const commandLine: TerminalLine = {
      id: Date.now(),
      type: 'command',
      content: `$ ${command}`
    };
    setLines(prev => [...prev, commandLine]);
    setInputValue('');
    setIsExecuting(true);

    // Simulate command execution delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Process command
    let output: string;
    let outputType: 'output' | 'error' = 'output';

    if (command === 'help') {
      output = 'Available commands: help, echo, clear, date, pwd, ls';
    } else if (command.startsWith('echo ')) {
      output = command.substring(5);
    } else if (command === 'clear') {
      setLines([]);
      setIsExecuting(false);
      return;
    } else if (command === 'date') {
      output = new Date().toString();
    } else if (command === 'pwd') {
      output = '/home/user/lapdev';
    } else if (command === 'ls') {
      output = 'src/  tests/  package.json  tsconfig.json';
    } else {
      output = `Command not found: ${command}`;
      outputType = 'error';
    }

    // Add output to history
    const outputLine: TerminalLine = {
      id: Date.now() + 1,
      type: outputType,
      content: output
    };
    setLines(prev => [...prev, outputLine]);
    
    // Add new prompt after output
    const newPrompt: TerminalLine = {
      id: Date.now() + 2,
      type: 'output',
      content: '$'
    };
    setLines(prev => [...prev, newPrompt]);
    
    setIsExecuting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute(inputValue);
    }
  };

  return (
    <>
      {/* Terminal Button */}
      <button
        data-testid="terminal-button"
        className="terminal-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        💻 Terminal
      </button>

      {/* Terminal Panel */}
      {isOpen && (
        <div 
          className="terminal-container" 
          data-testid="terminal-container"
          style={{ height: `${height}px` }}
        >
          <div className="terminal-panel" data-testid="terminal-panel">
            {/* Terminal Header */}
            <div className="terminal-header">
              <div className="terminal-tabs">
                <span className="terminal-tab active" data-testid="terminal-tab">Terminal</span>
              </div>
              <button
                data-testid="terminal-close"
                className="terminal-close-button"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Terminal Content */}
            <div className="terminal-content">
              {/* Terminal Output */}
              <div 
                className="terminal-output" 
                data-testid="terminal-output"
                ref={terminalRef}
              >
                {lines.map(line => (
                  <div
                    key={line.id}
                    className={`terminal-line ${line.type}`}
                  >
                    {line.content}
                  </div>
                ))}
                {isExecuting && (
                  <div className="terminal-line output">
                    <span className="terminal-spinner">⏳</span> Executing...
                  </div>
                )}
              </div>

              {/* Terminal Input */}
              <div className="terminal-input-container">
                <span className="terminal-prompt" data-testid="terminal-prompt">$</span>
                <input
                  type="text"
                  data-testid="terminal-input"
                  className="terminal-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter command..."
                  disabled={isExecuting}
                  autoFocus
                />
              </div>
            </div>

            {/* Resize Buttons */}
            <div className="terminal-resize-buttons">
              <button
                data-testid="resize-small"
                className="resize-button terminal-control-btn"
                onClick={() => setHeight(200)}
              >
                Small
              </button>
              <button
                data-testid="resize-medium"
                className="resize-button terminal-control-btn"
                onClick={() => setHeight(300)}
              >
                Medium
              </button>
              <button
                data-testid="resize-large"
                className="resize-button terminal-control-btn"
                onClick={() => setHeight(500)}
              >
                Large
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}