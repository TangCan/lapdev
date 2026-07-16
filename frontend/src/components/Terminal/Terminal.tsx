import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { createTerminal, closeTerminal, resizeTerminal } from '../../services/terminalService';
import { WS_URL } from '../../config';
import '@xterm/xterm/css/xterm.css';

interface TabInfo {
  id: string;
  sessionId: string | null;
  title: string;
  isProcessExited: boolean;
  terminalRef: XTerm | null;
  fitAddon: FitAddon | null;
  containerRef: HTMLDivElement | null;
  isRenaming: boolean;
  renameValue: string;
}

type TerminalAction =
  | { type: 'ADD_TAB'; tabId: string; title: string }
  | { type: 'SELECT_TAB'; tabId: string }
  | { type: 'CLOSE_TAB'; tabId: string }
  | { type: 'SET_SESSION_ID'; tabId: string; sessionId: string }
  | { type: 'SET_PROCESS_EXITED'; tabId: string; exited: boolean }
  | { type: 'RENAME_TAB'; tabId: string; newTitle: string }
  | { type: 'START_RENAME'; tabId: string }
  | { type: 'UPDATE_RENAME_VALUE'; tabId: string; value: string }
  | { type: 'CANCEL_RENAME'; tabId: string };

interface TerminalState {
  tabs: TabInfo[];
  activeTabId: string | null;
  nextTabNumber: number;
}

function terminalReducer(state: TerminalState, action: TerminalAction): TerminalState {
  switch (action.type) {
    case 'ADD_TAB':
      return {
        ...state,
        tabs: [...state.tabs, {
          id: action.tabId,
          sessionId: null,
          title: action.title,
          isProcessExited: false,
          terminalRef: null,
          fitAddon: null,
          containerRef: null,
          isRenaming: false,
          renameValue: '',
        }],
        activeTabId: action.tabId,
        nextTabNumber: state.nextTabNumber + 1,
      };

    case 'SELECT_TAB':
      return {
        ...state,
        activeTabId: action.tabId,
      };

    case 'CLOSE_TAB': {
      const newTabs = state.tabs.filter(tab => tab.id !== action.tabId);
      let newActiveTabId = state.activeTabId;
      if (state.activeTabId === action.tabId) {
        newActiveTabId = newTabs.length > 0 ? newTabs[0].id : null;
      }
      return {
        ...state,
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    }

    case 'SET_SESSION_ID':
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.tabId ? { ...tab, sessionId: action.sessionId } : tab
        ),
      };

    case 'SET_PROCESS_EXITED':
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.tabId ? { ...tab, isProcessExited: action.exited } : tab
        ),
      };

    case 'RENAME_TAB':
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.tabId ? { ...tab, title: action.newTitle, isRenaming: false, renameValue: '' } : tab
        ),
      };

    case 'START_RENAME':
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.tabId ? { ...tab, isRenaming: true, renameValue: tab.title } : tab
        ),
      };

    case 'UPDATE_RENAME_VALUE':
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.tabId ? { ...tab, renameValue: action.value } : tab
        ),
      };

    case 'CANCEL_RENAME':
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.tabId ? { ...tab, isRenaming: false, renameValue: '' } : tab
        ),
      };

    default:
      return state;
  }
}

interface TerminalProps {
  onClose: () => void;
  onResize: (height: number) => void;
  autoInit?: boolean;
}

export function Terminal({ onClose, onResize, autoInit = true }: TerminalProps) {
  const [{ tabs, activeTabId, nextTabNumber }, dispatch] = useReducer(terminalReducer, {
    tabs: [],
    activeTabId: null,
    nextTabNumber: 1,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    tabId: string;
  } | null>(null);
  const [lastTabWarning, setLastTabWarning] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const lastPongRef = useRef<number>(Date.now());
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const tabsRef = useRef<TabInfo[]>(tabs);
  
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const terminalRefs = useRef<Record<string, XTerm | null>>({});
  const fitAddonRefs = useRef<Record<string, FitAddon | null>>({});
  const terminalOutputCache = useRef<Record<string, string>>({});

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (autoInit && !initializedRef.current && tabs.length === 0) {
      initializedRef.current = true;
      setTimeout(() => {
        const initialTabId = `tab-${Date.now()}`;
        dispatch({ type: 'ADD_TAB', tabId: initialTabId, title: 'Terminal 1' });
      }, 100);
    }
  }, [autoInit]);

  useEffect(() => {
    (window as any).__terminalInput = (input: string) => {
      const currentTab = tabsRef.current.find(t => t.id === activeTabId);
      if (currentTab) {
        const terminal = terminalRefs.current[currentTab.id];
        if (terminal) {
          terminal.write(input);
          terminalOutputCache.current[currentTab.id] = (terminalOutputCache.current[currentTab.id] || '') + input;
        }
      }
    };
    
    (window as any).__getTerminalOutput = (tabId?: string) => {
      const targetTabId = tabId || activeTabId;
      return terminalOutputCache.current[targetTabId] || '';
    };

    return () => {
      delete (window as any).__terminalInput;
    };
  }, [activeTabId]);

  const registerTerminalRef = useCallback((tabId: string, terminal: XTerm | null) => {
    terminalRefs.current[tabId] = terminal;
  }, []);

  const registerFitAddon = useCallback((tabId: string, fitAddon: FitAddon | null) => {
    fitAddonRefs.current[tabId] = fitAddon;
  }, []);

  const registerContainerRef = useCallback((tabId: string, container: HTMLDivElement | null) => {
    containerRefs.current[tabId] = container;
  }, []);

  const initTerminalSession = useCallback(async (tabId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const tab = tabsRef.current.find(t => t.id === tabId);
    if (!tab) return;

    if (tab.sessionId) {
      wsRef.current.send(JSON.stringify({
        type: 'terminalRegister',
        sessionId: tab.sessionId,
      }));
      dispatch({ type: 'SET_PROCESS_EXITED', tabId, exited: false });
      return;
    }

    try {
      const result = await createTerminal();
      if (result.status === 'success' && result.sessionId) {
        const newSessionId = result.sessionId;
        dispatch({ type: 'SET_SESSION_ID', tabId, sessionId: newSessionId });
        dispatch({ type: 'SET_PROCESS_EXITED', tabId, exited: false });

        wsRef.current.send(JSON.stringify({
          type: 'terminalRegister',
          sessionId: newSessionId,
        }));
      }
    } catch (error) {
      console.error('Failed to create terminal:', error);
    }
  }, []);

  const connectWebSocket = useCallback(async () => {
    if (wsRef.current) {
      return;
    }

    const ws = new WebSocket(`${WS_URL}`);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = async () => {
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

      for (const tab of tabsRef.current) {
        if (!tab.sessionId) {
          await initTerminalSession(tab.id);
        } else {
          ws.send(JSON.stringify({
            type: 'terminalRegister',
            sessionId: tab.sessionId,
          }));
        }
      }
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'pong') {
            lastPongRef.current = Date.now();
          } else if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          } else if (message.type === 'terminalRegistered') {
            setTimeout(() => {
              const tab = tabsRef.current.find(t => t.sessionId === message.sessionId);
              if (tab) {
                const fitAddon = fitAddonRefs.current[tab.id];
                fitAddon?.fit();
                
                const terminal = terminalRefs.current[tab.id];
                if (terminal) {
                  const cols = terminal.cols;
                  const rows = terminal.rows;
                  resizeTerminal(message.sessionId, cols, rows);
                  terminal.write('\x1b[32mWelcome to LapDev Terminal\x1b[0m\r\n');
                  terminalOutputCache.current[tab.id] = (terminalOutputCache.current[tab.id] || '') + '\x1b[32mWelcome to LapDev Terminal\x1b[0m\r\n';
                }
                
                ws.send(JSON.stringify({
                  type: 'terminalInput',
                  sessionId: message.sessionId,
                  input: '\r\n',
                }));
              }
            }, 300);
          } else if (message.type === 'terminalOutput') {
            const tab = tabsRef.current.find(t => t.sessionId === message.sessionId);
            if (tab) {
              const terminal = terminalRefs.current[tab.id];
              if (terminal) {
                terminal.write(message.output);
                terminalOutputCache.current[tab.id] = (terminalOutputCache.current[tab.id] || '') + message.output;
                if (message.output.includes('[Process exited with code')) {
                  dispatch({ type: 'SET_PROCESS_EXITED', tabId: tab.id, exited: true });
                }
              }
            }
          }
        } catch {
          const activeTab = tabsRef.current.find(t => t.id === activeTabId);
          if (activeTab) {
            const terminal = terminalRefs.current[activeTab.id];
            terminal?.write(event.data);
            terminalOutputCache.current[activeTab.id] = (terminalOutputCache.current[activeTab.id] || '') + event.data;
          }
        }
      } else if (event.data instanceof ArrayBuffer) {
        const decoder = new TextDecoder('utf-8');
        const output = decoder.decode(event.data);
        console.warn('[Terminal] Received binary output without sessionId, routing to active tab');
        
        let targetTab = tabsRef.current.find(t => t.id === activeTabId);
        if (!targetTab && tabsRef.current.length > 0) {
          targetTab = tabsRef.current[0];
        }
        
        if (targetTab) {
          const terminal = terminalRefs.current[targetTab.id];
          if (terminal) {
            terminal.write(output);
            terminalOutputCache.current[targetTab.id] = (terminalOutputCache.current[targetTab.id] || '') + output;
            if (output.includes('[Process exited with code')) {
              dispatch({ type: 'SET_PROCESS_EXITED', tabId: targetTab.id, exited: true });
            }
          }
        }
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }

      if (reconnectAttemptRef.current < 10) {
        reconnectAttemptRef.current++;
        const delay = Math.min(1000 * reconnectAttemptRef.current, 10000);
        reconnectTimerRef.current = setTimeout(() => {
          connectWebSocket();
        }, delay) as unknown as number;
      }
    };
  }, [initTerminalSession]);

  useEffect(() => {
    if (tabs.length > 0 && !wsRef.current) {
      connectWebSocket();
    }
  }, [tabs.length]);

  const initXTerm = useCallback((tabId: string) => {
    const container = containerRefs.current[tabId];
    if (!container) return;

    container.innerHTML = '';

    try {
      const fitAddon = new FitAddon();
      const terminal = new XTerm({
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

      terminal.loadAddon(fitAddon);
      terminal.loadAddon(new WebLinksAddon());
      terminal.open(container);

      registerTerminalRef(tabId, terminal);
      registerFitAddon(tabId, fitAddon);

      setTimeout(() => {
        fitAddon.fit();
        terminal.focus();
      }, 300);

      terminal.onData((data: string) => {
        const currentTab = tabsRef.current.find(t => t.id === tabId);
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !currentTab?.sessionId) {
          return;
        }

        wsRef.current.send(JSON.stringify({
          type: 'terminalInput',
          sessionId: currentTab.sessionId,
          input: data,
        }));
      });

    } catch (error) {
      console.error('[Terminal] XTerm initialization error:', error);
    }
  }, [registerTerminalRef, registerFitAddon]);

  useEffect(() => {
    if (activeTabId) {
      const terminal = terminalRefs.current[activeTabId];
      const container = containerRefs.current[activeTabId];
      const tab = tabsRef.current.find(t => t.id === activeTabId);
      
      if (!terminal && container) {
        initXTerm(activeTabId);
        
        setTimeout(() => {
          initTerminalSession(activeTabId);
        }, 300);
      } else if (tab && !tab.sessionId) {
        initTerminalSession(activeTabId);
      }
    }
  }, [activeTabId, initXTerm, initTerminalSession]);

  useEffect(() => {
    const handleResize = () => {
      tabsRef.current.forEach(tab => {
        const fitAddon = fitAddonRefs.current[tab.id];
        fitAddon?.fit();
      });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      for (const tab of tabsRef.current) {
        const terminal = terminalRefs.current[tab.id];
        terminal?.dispose();
        if (tab.sessionId) {
          closeTerminal(tab.sessionId);
        }
      }
    };
  }, []);

  const handleAddTab = useCallback(() => {
    const newTabId = `tab-${Date.now()}`;
    const newTitle = `Terminal ${nextTabNumber}`;
    dispatch({ type: 'ADD_TAB', tabId: newTabId, title: newTitle });
  }, [nextTabNumber]);

  const handleSelectTab = useCallback((tabId: string) => {
    dispatch({ type: 'SELECT_TAB', tabId });
    setTimeout(() => {
      const terminal = terminalRefs.current[tabId];
      terminal?.focus();
    }, 100);
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    if (tabsRef.current.length <= 1) {
      setLastTabWarning(true);
      setTimeout(() => setLastTabWarning(false), 2000);
      return;
    }

    const terminal = terminalRefs.current[tabId];
    terminal?.dispose();

    const tab = tabsRef.current.find(t => t.id === tabId);
    if (tab?.sessionId) {
      closeTerminal(tab.sessionId);
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'terminalUnregister',
          sessionId: tab.sessionId,
        }));
      }
    }
    
    delete terminalRefs.current[tabId];
    delete fitAddonRefs.current[tabId];
    delete containerRefs.current[tabId];
    
    dispatch({ type: 'CLOSE_TAB', tabId });
  }, []);

  const handleRestart = useCallback((tabId: string) => {
    const terminal = terminalRefs.current[tabId];
    terminal?.dispose();

    const tab = tabsRef.current.find(t => t.id === tabId);
    if (tab?.sessionId) {
      closeTerminal(tab.sessionId);
    }

    delete terminalRefs.current[tabId];
    delete fitAddonRefs.current[tabId];
    
    dispatch({ type: 'SET_SESSION_ID', tabId, sessionId: null });
    dispatch({ type: 'SET_PROCESS_EXITED', tabId, exited: false });

    setTimeout(() => {
      const container = containerRefs.current[tabId];
      if (container) {
        initXTerm(tabId);
        
        setTimeout(() => {
          initTerminalSession(tabId);
        }, 300);
      }
    }, 50);
  }, [initXTerm, initTerminalSession]);

  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleRename = useCallback((tabId: string) => {
    dispatch({ type: 'START_RENAME', tabId });
    setContextMenu(null);
  }, []);

  const handleRenameSubmit = useCallback((tabId: string) => {
    const tab = tabsRef.current.find(t => t.id === tabId);
    if (tab && tab.renameValue.trim()) {
      dispatch({ type: 'RENAME_TAB', tabId, newTitle: tab.renameValue.trim() });
    } else {
      dispatch({ type: 'CANCEL_RENAME', tabId });
    }
  }, []);

  const handleRenameCancel = useCallback((tabId: string) => {
    dispatch({ type: 'CANCEL_RENAME', tabId });
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="terminal" data-testid="terminal-panel">
      <div className="terminal-header">
        <div className="terminal-tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`terminal-tab ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => handleSelectTab(tab.id)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              data-testid={`terminal-tab-item-${tab.id}`}
            >
              {tab.isRenaming ? (
                <input
                  type="text"
                  className="terminal-rename-input"
                  value={tab.renameValue}
                  onChange={(e) => dispatch({ type: 'UPDATE_RENAME_VALUE', tabId: tab.id, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameSubmit(tab.id);
                    } else if (e.key === 'Escape') {
                      handleRenameCancel(tab.id);
                    }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span>{tab.title}</span>
              )}
              <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '●' : '○'}
              </span>
              {tabs.length > 1 && (
                <button
                  className="terminal-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                  data-testid={`terminal-tab-close-${tab.id}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            className="terminal-tab-add"
            onClick={handleAddTab}
            data-testid="terminal-tab-add"
          >
            +
          </button>
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
        
        {lastTabWarning && (
          <div className="last-tab-warning">
            ⚠️ Cannot close the last terminal tab
          </div>
        )}
      </div>

      <div className="terminal-body">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`terminal-tab-content ${activeTabId === tab.id ? 'active' : ''}`}
          >
            <div
              ref={(el) => registerContainerRef(tab.id, el)}
              className="terminal-xterm"
              data-testid={`terminal-output-${tab.id}`}
            />

            {tab.isProcessExited && (
              <div className="terminal-restart-overlay">
                <div className="terminal-restart-message">
                  <p>Terminal session has ended</p>
                  <button className="terminal-restart-btn" onClick={() => handleRestart(tab.id)}>
                    Restart Terminal
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {contextMenu?.visible && (
        <div
          className="terminal-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="terminal-context-menu-item"
            onClick={() => handleRename(contextMenu.tabId)}
          >
            Rename
          </div>
          <div className="terminal-context-menu-divider" />
          <div
            className={`terminal-context-menu-item ${tabs.length <= 1 ? 'disabled' : ''}`}
            onClick={() => {
              handleCloseTab(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Close Tab
          </div>
        </div>
      )}
    </div>
  );
}