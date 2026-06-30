import { API_URL } from '../config';

interface CreateTerminalResponse {
  status: 'success' | 'error';
  sessionId?: string;
  message?: string;
}

interface CommandResponse {
  status: 'success' | 'error';
  message?: string;
  output?: string;
}

export async function createTerminal(): Promise<CreateTerminalResponse> {
  const url = `${API_URL}/api/v1/terminal/create`;
  console.log('[terminalService] createTerminal URL:', url);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

export async function sendCommand(sessionId: string, command: string): Promise<CommandResponse> {
  const response = await fetch(`${API_URL}/api/v1/terminal/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, command }),
  });
  return await response.json();
}

export async function resizeTerminal(sessionId: string, cols: number, rows: number): Promise<CommandResponse> {
  const response = await fetch(`${API_URL}/api/v1/terminal/resize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, cols, rows }),
  });
  return await response.json();
}

export async function closeTerminal(sessionId: string): Promise<CommandResponse> {
  const response = await fetch(`${API_URL}/api/v1/terminal/close`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  });
  return await response.json();
}
