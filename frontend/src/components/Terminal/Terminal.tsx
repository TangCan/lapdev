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
  const [isConnected, setIsConnected] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatTimerRef = useRef<number | null>(null);
  const lastPongRef = useRef<number>(Date.now());
  const reconnectTimerRef = useRef<number | null>(null);

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
          connectWebSocket(result.sessionId);
        }
      } catch (error) {
        console.error('Failed to create terminal:', error);
        setOutput('Failed to connect to terminal');
        setIsLoading(false);
      }
    };

    const connectWebSocket = (sid: string) => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected for terminal');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Clear any existing heartbeat timer
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
        
        // Start heartbeat - send ping every 30 seconds
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            
            // Check if we received a pong recently (within 45 seconds)
            const timeSinceLastPong = Date.now() - lastPongRef.current;
            if (timeSinceLastPong > 45000) {
              console.log('Heartbeat timeout, reconnecting...');
              ws.close();
            }
          }
        }, 30000) as unknown as number;

        ws.send(JSON.stringify({
          type: 'terminalRegister',
          sessionId: sid,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'pong') {
            // Update last pong timestamp
            lastPongRef.current = Date.now();
          } else if (message.type === 'terminalOutput' && message.output) {
            setOutput(prev => prev + message.output);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Clear heartbeat timer
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
          
          reconnectTimerRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            if (sessionId) {
              connectWebSocket(sessionId);
            }
          }, delay) as unknown as number;
        } else {
          console.log('Max reconnection attempts reached');
          setOutput(prev => prev + '\nConnection lost. Please refresh the page to reconnect.');
        }
      };
    };

    initTerminal();

    return () => {
      // Clear heartbeat and reconnect timers
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
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
  }, [wsUrl]);

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
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '●' : '○'}
            </span>
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
