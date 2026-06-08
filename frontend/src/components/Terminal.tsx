/**
 * Terminal Component
 * xterm.js based terminal with full shell support
 */

import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface TerminalProps {
  sessionId?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ sessionId }) => {
  const terminalContainer = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddon = useRef<FitAddon>(new FitAddon());

  useEffect(() => {
    if (!terminalContainer.current) return;

    // Initialize xterm
    terminalRef.current = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        selection: '#264f78',
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

    // Load addons
    terminalRef.current.loadAddon(fitAddon.current);
    terminalRef.current.loadAddon(new WebLinksAddon());

    // Attach to DOM
    terminalRef.current.open(terminalContainer.current);
    fitAddon.current.fit();

    // Connect to WebSocket for terminal I/O
    connectTerminal();

    // Handle resize
    const handleResize = () => {
      fitAddon.current.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminalRef.current?.dispose();
    };
  }, []);

  const connectTerminal = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/terminal/${sessionId || 'default'}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Terminal connected');
    };
    
    ws.onmessage = (event) => {
      terminalRef.current?.write(event.data);
    };
    
    ws.onerror = (error) => {
      console.error('Terminal error:', error);
    };
    
    ws.onclose = () => {
      console.log('Terminal disconnected');
    };
    
    // Send input to terminal
    terminalRef.current?.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  };

  return (
    <div className="h-full w-full bg-gray-900">
      <div className="h-8 bg-gray-800 flex items-center px-3 border-b border-gray-700">
        <span className="text-gray-400 text-xs">Terminal</span>
      </div>
      <div ref={terminalContainer} className="h-[calc(100%-32px)]" />
    </div>
  );
};

export default Terminal;