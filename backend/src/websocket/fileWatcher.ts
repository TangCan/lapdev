// Deno WebSocket API is built-in, no external import needed

const WORKSPACE_DIR = Deno.env.get('WORKSPACE_DIR') || '/workspace';

// Use Deno's WebSocket type which is returned by Deno.upgradeWebSocket
// deno-lint-ignore no-explicit-any
type WebSocket = any;

const clients = new Set<WebSocket>();

export async function handleWebSocket(ws: WebSocket): Promise<void> {
  clients.add(ws);

  try {
    for await (const event of ws) {
      if (typeof event === 'string') {
        const message = JSON.parse(event);
        
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
      } else if (event.type === 'close') {
        break;
      }
    }
  } finally {
    clients.delete(ws);
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
  const message = JSON.stringify({
    type: 'fileChange',
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