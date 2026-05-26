// Deno WebSocket API is built-in, no external import needed

const WORKSPACE_DIR = Deno.env.get('WORKSPACE_DIR') || '/workspace';

// Use Deno's WebSocket type which is returned by Deno.upgradeWebSocket
// deno-lint-ignore no-explicit-any
type WebSocket = any;

const clients = new Set<WebSocket>();
let watcher: Deno.FsWatcher | null = null;

export function handleWebSocket(ws: WebSocket): void {
  clients.add(ws);

  ws.onopen = () => {
    console.log('WebSocket connection opened');
  };

  ws.onmessage = async (event: { data: string }) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'subscribe':
          await handleSubscribe(ws, message);
          break;
        case 'unsubscribe':
          await handleUnsubscribe(ws, message);
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
    clients.delete(ws);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
    clients.delete(ws);
  };
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