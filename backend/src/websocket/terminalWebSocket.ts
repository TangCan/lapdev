type WebSocket = any;

export class TerminalWebSocketHandler {
  private terminalClients = new Map<string, WebSocket>();

  register(sessionId: string): boolean {
    const mockWs: WebSocket = {
      readyState: 1,
      send: async () => {},
    };
    this.terminalClients.set(sessionId, mockWs);
    return true;
  }

  unregister(sessionId: string): boolean {
    return this.terminalClients.delete(sessionId);
  }

  getClient(sessionId: string): WebSocket | undefined {
    return this.terminalClients.get(sessionId);
  }

  async broadcast(sessionId: string, _output: string): Promise<boolean> {
    const ws = this.terminalClients.get(sessionId);
    return !!ws;
  }

  listSessions(): string[] {
    return Array.from(this.terminalClients.keys());
  }
}