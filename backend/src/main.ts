import {
  handleFileTree,
  handleReadFile,
  handleWriteFile,
  handleCreateFile,
  handleRenameFile,
  handleDeleteFile
} from './handlers/fileHandler.ts';
import { handleWebSocket } from './websocket/fileWatcher.ts';

const PORT = parseInt(Deno.env.get('PORT') || '3000');
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000').split(',');

// Helper to build CORS headers based on origin
function getCorsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  
  // In production, validate origin strictly
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else if (Deno.env.get('DEV_MODE') === 'true') {
    // Allow any origin in dev mode
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  return headers;
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const origin = req.headers.get('Origin');
  
  // WebSocket upgrade
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);
    handleWebSocket(socket as unknown as WebSocket);
    return response;
  }

  // Build CORS headers
  const headers = getCorsHeaders(origin);

  // Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // API routes
  switch (url.pathname) {
    case '/api/v1/files/tree':
      if (req.method === 'GET') {
        return await handleFileTree(req);
      }
      break;
    case '/api/v1/files/read':
      if (req.method === 'GET') {
        return await handleReadFile(req);
      }
      break;
    case '/api/v1/files/write':
      if (req.method === 'POST') {
        return await handleWriteFile(req);
      }
      break;
    case '/api/v1/files/create':
      if (req.method === 'POST') {
        return await handleCreateFile(req);
      }
      break;
    case '/api/v1/files/rename':
      if (req.method === 'POST') {
        return await handleRenameFile(req);
      }
      break;
    case '/api/v1/files/delete':
      if (req.method === 'DELETE') {
        return await handleDeleteFile(req);
      }
      break;
    default:
      return new Response('Not Found', { status: 404, headers });
  }

  return new Response('Method Not Allowed', { status: 405, headers });
}

console.log(`Server running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, handleRequest);