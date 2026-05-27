import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createTerminal, closeTerminal, sendCommand } from '../../services/terminalService';

interface TerminalProps {
  onClose: () => void;
  onResize: (height: number) => void;
}

export function Terminal({ onClose, onResize }: TerminalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const scrollToBottom = useCallback(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, []);

  const wsUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  }, []);

  useEffect(() => {
    const initTerminal = async () => {
      try {
        const result = await createTerminal();
        if (result.status === 'success' && result.sessionId) {
          setSessionId(result.sessionId);
          setOutput('');
          setIsLoading(false);
          
          // Initialize WebSocket connection for real-time output
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          ws.onopen = () => {
            console.log('WebSocket connected for terminal');
            ws.send(JSON.stringify({
              type: 'terminalRegister',
              sessionId: result.sessionId,
            }));
          };

          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              if (message.type === 'terminalOutput' && message.output) {
                setOutput(prev => prev + message.output);
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          };

          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
          };

          ws.onclose = () => {
            console.log('WebSocket disconnected');
            wsRef.current = null;
          };

          setTimeout(() => inputRef.current?.focus(), 100);
        }
      } catch (error) {
        console.error('Failed to create terminal:', error);
        setOutput('Failed to connect to terminal');
        setIsLoading(false);
      }
    };

    initTerminal();

    return () => {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'terminalUnregister',
          sessionId,
        }));
        wsRef.current.close();
      }
      if (sessionId) {
        closeTerminal(sessionId);
      }
    };
  }, [sessionId, wsUrl]);

  useEffect(() => {
    scrollToBottom();
  }, [output, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId) return;

    const command = input;
    setInput('');
    setOutput(prev => prev + `\n$ ${command}`);

    try {
      await sendCommand(sessionId, command);
    } catch (error) {
      setOutput(prev => prev + `\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="terminal" data-testid="terminal-panel">
      <div className="terminal-header">
        <div className="terminal-tabs">
          <div className="terminal-tab active" data-testid="terminal-tab">
            <span>Terminal</span>
          </div>
        </div>
        <div className="terminal-controls">
          <button 
            className="terminal-control-btn"
            onClick={() => onResize && onResize(200)}
          >
            ▲
          </button>
          <button 
            className="terminal-control-btn"
            onClick={() => onResize && onResize(400)}
          >
            ▼
          </button>
          <button 
            className="terminal-control-btn close-btn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="terminal-body">
        <div className="terminal-output" ref={outputRef} data-testid="terminal-output">
          {isLoading ? (
            <span className="loading">Connecting to terminal...</span>
          ) : output || (
            <span className="prompt">$ </span>
          )}
          {!isLoading && !output && (
            <span className="prompt">$ </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="terminal-input-form">
          <span className="input-prompt">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !sessionId}
            className="terminal-input"
            data-testid="terminal-input"
            placeholder="Type a command..."
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
}
