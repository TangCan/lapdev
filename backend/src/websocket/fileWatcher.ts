// Deno WebSocket API is built-in, no external import needed

const WORKSPACE_DIR = Deno.env.get('WORKSPACE_DIR') || '/workspace';

// Heartbeat configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 45000; // 45 seconds (1.5x interval)
const CLEANUP_INTERVAL = 60000; // 60 seconds

// Use Deno's WebSocket type which is returned by Deno.upgradeWebSocket
// deno-lint-ignore no-explicit-any
type WebSocket = any;

const clients = new Set<WebSocket>();
let watcher: Deno.FsWatcher | null = null;

// Terminal sessions mapped by session ID
const terminalClients = new Map<string, WebSocket>();

// Track client last activity time for heartbeat
interface ClientState {
  ws: WebSocket;
  lastActivity: number;
  isAlive: boolean;
  heartbeatTimer?: number;
}
const clientStates = new Map<WebSocket, ClientState>();

// Cleanup stale connections periodically
let cleanupTimer: number | undefined;

export function registerTerminalClient(sessionId: string, ws: WebSocket): void {
  terminalClients.set(sessionId, ws);
}

export function unregisterTerminalClient(sessionId: string): void {
  terminalClients.delete(sessionId);
}

export async function sendTerminalOutput(sessionId: string, output: string): Promise<void> {
  const ws = terminalClients.get(sessionId);
  if (ws) {
    try {
      await ws.send(JSON.stringify({
        type: 'terminalOutput',
        sessionId,
        output,
      }));
    } catch {
      terminalClients.delete(sessionId);
    }
  }
}

export function getTerminalClient(sessionId: string): WebSocket | undefined {
  return terminalClients.get(sessionId);
}

export function handleWebSocket(ws: WebSocket): void {
  clients.add(ws);
  
  // Initialize client state for heartbeat tracking
  const clientState: ClientState = {
    ws,
    lastActivity: Date.now(),
    isAlive: true,
  };
  clientStates.set(ws, clientState);
  
  // Start heartbeat timer for this client
  startHeartbeat(ws, clientState);

  ws.onopen = () => {
    console.log('WebSocket connection opened');
    clientState.lastActivity = Date.now();
  };

  ws.onmessage = async (event: { data: string }) => {
    try {
      const message = JSON.parse(event.data);
      clientState.lastActivity = Date.now();
      
      switch (message.type) {
        case 'ping':
          // Respond to heartbeat ping
          await ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        case 'subscribe':
          await handleSubscribe(ws, message);
          break;
        case 'unsubscribe':
          await handleUnsubscribe(ws, message);
          break;
        case 'terminalRegister':
          // Register WebSocket connection for terminal output
          if (message.sessionId) {
            registerTerminalClient(message.sessionId, ws);
            await ws.send(JSON.stringify({
              type: 'terminalRegistered',
              sessionId: message.sessionId,
            }));
          }
          break;
        case 'terminalUnregister':
          // Unregister WebSocket connection
          if (message.sessionId) {
            unregisterTerminalClient(message.sessionId);
          }
          break;
        default:
          await ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  };

  ws.onerror = (error: unknown) => {
    console.error('WebSocket error:', error);
    cleanupClient(ws);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
    cleanupClient(ws);
  };
}

/**
 * Start heartbeat timer for a WebSocket client
 */
function startHeartbeat(ws: WebSocket, state: ClientState): void {
  state.heartbeatTimer = setInterval(async () => {
    if (!state.isAlive) {
      // Client didn't respond to last ping, close connection
      console.log('Heartbeat timeout, closing connection');
      cleanupClient(ws);
      return;
    }
    
    // Mark as not alive until we receive pong
    state.isAlive = false;
    
    // Send ping
    try {
      await ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    } catch {
      console.log('Failed to send ping, closing connection');
      cleanupClient(ws);
    }
  }, HEARTBEAT_INTERVAL) as unknown as number;
}

/**
 * Clean up a client and all associated resources
 */
function cleanupClient(ws: WebSocket): void {
  const state = clientStates.get(ws);
  if (state?.heartbeatTimer) {
    clearInterval(state.heartbeatTimer);
  }
  clientStates.delete(ws);
  clients.delete(ws);
  
  // Clean up terminal client mappings when WebSocket closes
  for (const [sessionId, client] of terminalClients) {
    if (client === ws) {
      terminalClients.delete(sessionId);
      console.log(`Unregistered terminal client: ${sessionId}`);
    }
  }
}

/**
 * Start periodic cleanup of stale connections
 */
export function startCleanupTimer(): void {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [ws, state] of clientStates) {
      if (now - state.lastActivity > HEARTBEAT_TIMEOUT) {
        console.log(`Cleaning up stale connection (inactive for ${Math.round((now - state.lastActivity) / 1000)}s)`);
        cleanupClient(ws);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} stale connection(s)`);
    }
  }, CLEANUP_INTERVAL) as unknown as number;
  
  console.log('Connection cleanup timer started');
}

/**
 * Stop the cleanup timer
 */
export function stopCleanupTimer(): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = undefined;
    console.log('Connection cleanup timer stopped');
  }
}

async function handleSubscribe(ws: WebSocket, _message: unknown): Promise<void> {
  await ws.send(JSON.stringify({
    type: 'subscribed',
    message: 'File watcher subscribed'
  }));
}

async function handleUnsubscribe(_ws: WebSocket, _message: unknown): Promise<void> {
  // No specific action needed for unsubscribe
}

export async function broadcastFileChange(eventType: string, path: string): Promise<void> {
  let messageType = 'fileChange';
  if (eventType === 'create') {
    messageType = 'fileCreated';
  } else if (eventType === 'modify') {
    messageType = 'fileModified';
  } else if (eventType === 'remove') {
    messageType = 'fileDeleted';
  }
  
  const message = JSON.stringify({
    type: messageType,
    eventType,
    path,
    timestamp: new Date().toISOString()
  });

  for (const client of clients) {
    try {
      await client.send(message);
    } catch {
      clients.delete(client);
    }
  }
}

/**
 * Starts the file system watcher to monitor workspace changes
 * Runs in the background without blocking
 */
export function startFileWatcher(): void {
  if (watcher) {
    return;
  }

  (async () => {
    try {
      watcher = Deno.watchFs(WORKSPACE_DIR, { recursive: true });
      console.log('File watcher started successfully');
      
      for await (const event of watcher) {
        for (const path of event.paths) {
          // Convert absolute path to workspace-relative path
          let relativePath = path;
          if (path.startsWith(WORKSPACE_DIR)) {
            relativePath = '/workspace' + path.substring(WORKSPACE_DIR.length);
          }
          
          // Broadcast file change event
          await broadcastFileChange(event.kind, relativePath);
        }
      }
    } catch (error) {
      console.error('Error in file watcher:', error);
      watcher = null;
    }
  })();
}

/**
 * Stops the file system watcher
 */
export function stopFileWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}