import { useState, useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { createTerminal, closeTerminal } from '../../services/terminalService';
import { WS_URL } from '../../config';
import '@xterm/xterm/css/xterm.css';

const terminalLogs: string[] = [];
if (typeof window !== 'undefined') {
  (window as any).terminalLogs = terminalLogs;
}

function logTerminal(message: string) {
  console.log(`[Terminal] ${message}`);
  terminalLogs.push(message);
  if (terminalLogs.length > 100) {
    terminalLogs.shift();
  }
}

let wsRefGlobal: WebSocket | null = null;
let sessionIdRefGlobal: string | null = null;

if (typeof window !== 'undefined') {
  (window as any).__terminalInput = (data: string) => {
    if (wsRefGlobal && wsRefGlobal.readyState === WebSocket.OPEN && sessionIdRefGlobal) {
      console.log(`[Terminal] Direct input: ${data} (sessionId: ${sessionIdRefGlobal})`);
      wsRefGlobal.send(JSON.stringify({
        type: 'terminalInput',
        sessionId: sessionIdRefGlobal,
        input: data,
      }));
    } else {
      console.log(`[Terminal] Direct input skipped: ws=${!!wsRefGlobal}, readyState=${wsRefGlobal?.readyState}, sessionId=${sessionIdRefGlobal}`);
    }
  };
}

interface TerminalProps {
  onClose: () => void;
  onResize: (height: number) => void;
}

export function Terminal({ onClose, onResize }: TerminalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessExited, setIsProcessExited] = useState(false);
  
  const terminalContainer = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const heartbeatTimerRef = useRef<number | null>(null);
  const lastPongRef = useRef<number>(Date.now());
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionIdRef.current = sessionId;
    sessionIdRefGlobal = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const initXTerm = () => {
      if (!terminalContainer.current) return;
      
      terminalContainer.current.innerHTML = '';
      
      try {
      fitAddon.current = new FitAddon();
      
      terminalRef.current = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
        allowProposedApi: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#aeafad',
          black: '#000000',
          red: '#f14c4c',
          green: '#6a9955',
          yellow: '#dcdcaa',
          blue: '#569cd6',
          magenta: '#c586c0',
          cyan: '#4ec9b0',
          white: '#d4d4d4',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#6a9955',
          brightYellow: '#dcdcaa',
          brightBlue: '#569cd6',
          brightMagenta: '#c586c0',
          brightCyan: '#4ec9b0',
          brightWhite: '#ffffff'
        }
      });

      terminalRef.current.loadAddon(fitAddon.current);
      terminalRef.current.loadAddon(new WebLinksAddon());
      terminalRef.current.open(terminalContainer.current);
      
      console.log('[Terminal] XTerm opened, container size:', {
        clientWidth: terminalContainer.current.clientWidth,
        clientHeight: terminalContainer.current.clientHeight,
        offsetWidth: terminalContainer.current.offsetWidth,
        offsetHeight: terminalContainer.current.offsetHeight
      });
      
      fitAddon.current.fit();
      
      console.log('[Terminal] After fit, terminal size:', {
        cols: terminalRef.current.cols,
        rows: terminalRef.current.rows
      });
      
      terminalRef.current.write('Welcome to LapDev Terminal\r\n');
      
      const handleData = (data: string) => {
        console.log('[Terminal] onData fired:', JSON.stringify(data));
        const currentSessionId = sessionIdRef.current;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !currentSessionId) {
          console.log('[Terminal] handleData skipped: ws=' + !!wsRef.current + ', readyState=' + wsRef.current?.readyState + ', sessionId=' + currentSessionId);
          return;
        }

        console.log('[Terminal] Sending input:', data, 'sessionId:', currentSessionId);
        wsRef.current.send(JSON.stringify({
          type: 'terminalInput',
          sessionId: currentSessionId,
          input: data,
        }));
      };
      
      terminalRef.current.onData(handleData);
      
      console.log('[Terminal] onData handler bound');
      
      setTimeout(() => {
        if (terminalRef.current) {
          console.log('[Terminal] Focusing terminal');
          terminalRef.current.focus();
          console.log('[Terminal] Terminal focus requested');
        }
      }, 200);
    } catch (error) {
      console.error('[Terminal] XTerm initialization error:', error);
    }
    };

    requestAnimationFrame(() => {
      setTimeout(() => {
        initXTerm();
      }, 100);
    });

    const handleResize = () => {
      fitAddon.current.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminalRef.current?.dispose();
      terminalRef.current = null;
      fitAddon.current = null;
      if (terminalContainer.current) {
        terminalContainer.current.innerHTML = '';
      }
    };
  }, []);

  const initTerminalSession = useCallback(async (ws: WebSocket) => {
    try {
      const currentSession = sessionIdRef.current;
      
      if (currentSession) {
        ws.send(JSON.stringify({
          type: 'terminalRegister',
          sessionId: currentSession,
        }));
        setIsLoading(false);
        setIsProcessExited(false);
        return;
      }
      
      const result = await createTerminal();
      if (result.status === 'success' && result.sessionId) {
        const newSessionId = result.sessionId;
        sessionIdRef.current = newSessionId;
        setSessionId(newSessionId);
        setIsLoading(false);
        setIsProcessExited(false);
        
        ws.send(JSON.stringify({
          type: 'terminalRegister',
          sessionId: newSessionId,
        }));
      }
    } catch (error) {
      console.error('Failed to create terminal:', error);
      terminalRef.current?.write('Failed to connect to terminal.\r\n');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const connectWebSocket = async () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      logTerminal(`Connecting to WebSocket: ${WS_URL}`);
      const ws = new WebSocket(`${WS_URL}`);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;
      wsRefGlobal = ws;

      ws.onopen = async () => {
        logTerminal('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
        
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            const timeSinceLastPong = Date.now() - lastPongRef.current;
            if (timeSinceLastPong > 45000) {
              ws.close();
            }
          }
        }, 30000) as unknown as number;

        await initTerminalSession(ws);
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          const decoder = new TextDecoder('utf-8');
          const output = decoder.decode(event.data);
          
          console.log(`[Terminal] Received output: ${output.length} bytes`);
          
          if (output.includes('[Process exited with code')) {
            setIsProcessExited(true);
          }
          
          terminalRef.current?.write(output);
        } else if (typeof event.data === 'string') {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'pong') {
              lastPongRef.current = Date.now();
            } else if (message.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            } else if (message.type === 'terminalRegistered') {
              console.log(`[Terminal] Terminal registered with session: ${message.sessionId}`);
            }
          } catch {
            terminalRef.current?.write(event.data);
          }
        }
      };

      ws.onerror = (error) => {
        logTerminal(`WebSocket error: ${error}`);
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        logTerminal(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
        setIsConnected(false);
        wsRef.current = null;
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
          heartbeatTimerRef.current = null;
        }
        
        if (reconnectAttemptRef.current < 10) {
          reconnectAttemptRef.current++;
          const delay = Math.min(1000 * reconnectAttemptRef.current, 10000);
          logTerminal(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`);
          reconnectTimerRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay) as unknown as number;
        }
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        const currentSessionId = sessionIdRef.current;
        if (currentSessionId) {
          wsRef.current.send(JSON.stringify({
            type: 'terminalUnregister',
            sessionId: currentSessionId,
          }));
        }
        wsRef.current.close();
        wsRef.current = null;
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      const currentSessionId = sessionIdRef.current;
      if (currentSessionId) {
        closeTerminal(currentSessionId);
      }
      reconnectAttemptRef.current = 0;
    };
  }, [initTerminalSession]);

  const handleRestart = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      initTerminalSession(wsRef.current);
    }
  }, [initTerminalSession]);

  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (terminalRef.current) {
        terminalRef.current.focus();
      }
    }, 500);

    return () => {
      clearInterval(focusInterval);
    };
  }, []);

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
        <div ref={terminalContainer} className="terminal-xterm" data-testid="terminal-output" />
        
        {isProcessExited && (
          <div className="terminal-restart-overlay">
            <div className="terminal-restart-message">
              <p>Terminal session has ended</p>
              <button className="terminal-restart-btn" onClick={handleRestart}>
                Restart Terminal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}