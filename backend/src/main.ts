import {
  handleFileTree,
  handleReadFile,
  handleWriteFile,
  handleCreateFile,
  handleRenameFile,
  handleDeleteFile
} from './handlers/fileHandler.ts';
import { handleWebSocket, startFileWatcher } from './websocket/fileWatcher.ts';

const PORT = parseInt(Deno.env.get('PORT') || '3000');
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000').split(',');

// Helper to build CORS headers based on origin
function getCorsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  });
  
  // Only allow specified origins
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  return headers;
}

// Helper to add CORS headers to response
function addCorsHeaders(response: Response, corsHeaders: Headers): Response {
  const newHeaders = new Headers(response.headers);
  corsHeaders.forEach((value, key) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
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
  const corsHeaders = getCorsHeaders(origin);

  // Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // API routes
  let response: Response;
  switch (url.pathname) {
    case '/api/v1/files/tree':
      if (req.method === 'GET') {
        response = await handleFileTree(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/files/read':
      if (req.method === 'GET') {
        response = await handleReadFile(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/files/write':
      if (req.method === 'POST') {
        response = await handleWriteFile(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/files/create':
      if (req.method === 'POST') {
        response = await handleCreateFile(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/files/rename':
      if (req.method === 'POST') {
        response = await handleRenameFile(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/files/delete':
      if (req.method === 'DELETE') {
        response = await handleDeleteFile(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    default:
      response = new Response('Not Found', { status: 404 });
  }

  return addCorsHeaders(response, corsHeaders);
}

// Start file watcher
startFileWatcher();

console.log(`Server running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, handleRequest);
