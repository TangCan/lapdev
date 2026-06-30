import {
  handleFileTree,
  handleReadFile,
  handleWriteFile,
  handleCreateFile,
  handleRenameFile,
  handleDeleteFile,
  handleFormat,
  handleGetLanguages
} from './handlers/fileHandler.ts';
import { handleWebSocket, startFileWatcher, startCleanupTimer } from './websocket/fileWatcher.ts';
import {
  handleCreateTerminal,
  handleTerminalCommand,
  handleTerminalResize,
  handleCloseTerminal,
  handleTerminalOutput
} from './handlers/terminalHandler.ts';
import {
  handleGitStatus,
  handleGitDiff,
  handleGitBranches,
  handleGitStage,
  handleGitCommit,
  handleGitCheckout
} from './handlers/gitHandler.ts';
import {
  handleLspCompletion,
  handleLspSignature,
  handleLspDefinition,
  handleLspReferences,
  handleLspTypeDefinition,
  handleLspRename,
  handleLspFormat,
  handleLspCodeActions,
  handleLspDiagnostics,
  handleLspStart,
  handleLspStop,
  handleLspStatus
} from './handlers/lspHandler.ts';
import {
  handleAiConfigGet,
  handleAiConfigPost,
  handleAiConfigPut,
  handleAiConfigDelete,
  handleAiActiveModel,
  handleAiTest,
  handleAiChat,
  handleAiModels,
  handleAiChatStream,
  handleAiCompletion
} from './handlers/aiHandler.ts';
import { handleBMADInstall, handleBMADStatus, handleBMADUpgrade } from './handlers/bmadHandler.ts';
import { handleSkillLoad, handleSkillMatch, handleSkillRegister, handleSkillList } from './handlers/skillHandler.ts';
import { join, extname } from 'https://deno.land/std@0.224.0/path/mod.ts';
import { PORT, ALLOWED_ORIGINS } from './config/index.ts';

function parseAllowedOrigins(): string[] {
  const envValue = Deno.env.get('ALLOWED_ORIGINS');
  if (!envValue) {
    return ALLOWED_ORIGINS;
  }
  
  const origins = envValue.split(',').map(o => o.trim()).filter(o => o.length > 0);
  
  const validOrigins: string[] = [];
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        validOrigins.push(origin);
      }
    } catch {
      console.warn(`Invalid ALLOWED_ORIGINS value: ${origin} - skipping`);
    }
  }
  
  return validOrigins.length > 0 ? validOrigins : ALLOWED_ORIGINS;
}

const allowedOrigins = parseAllowedOrigins();

// Helper to build CORS headers based on origin
function getCorsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  
  // Only allow specified origins
  if (origin && allowedOrigins.includes(origin)) {
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
  if (req.headers.get('upgrade') === 'websocket' && url.pathname === '/ws') {
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
    case '/health':
      if (req.method === 'GET') {
        response = new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
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
    case '/api/v1/files/format':
      if (req.method === 'POST') {
        response = await handleFormat(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/languages':
      if (req.method === 'GET') {
        response = await handleGetLanguages(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/terminal/create':
      if (req.method === 'POST') {
        response = await handleCreateTerminal(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/terminal/command':
      if (req.method === 'POST') {
        response = await handleTerminalCommand(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/terminal/resize':
      if (req.method === 'POST') {
        response = await handleTerminalResize(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/terminal/close':
      if (req.method === 'POST') {
        response = await handleCloseTerminal(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/terminal/output':
      if (req.method === 'GET') {
        response = await handleTerminalOutput(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/git/status':
      if (req.method === 'GET') {
        response = await handleGitStatus(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/git/diff':
      if (req.method === 'GET') {
        response = await handleGitDiff(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/git/branches':
      if (req.method === 'GET') {
        response = await handleGitBranches(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/git/stage':
      if (req.method === 'POST') {
        response = await handleGitStage(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/git/commit':
      if (req.method === 'POST') {
        response = await handleGitCommit(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/git/checkout':
      if (req.method === 'POST') {
        response = await handleGitCheckout(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/completion':
      if (req.method === 'POST') {
        response = await handleLspCompletion(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/signature':
      if (req.method === 'POST') {
        response = await handleLspSignature(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/definition':
      if (req.method === 'POST') {
        response = await handleLspDefinition(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/references':
      if (req.method === 'POST') {
        response = await handleLspReferences(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/typeDefinition':
      if (req.method === 'POST') {
        response = await handleLspTypeDefinition(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/rename':
      if (req.method === 'POST') {
        response = await handleLspRename(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/format':
      if (req.method === 'POST') {
        response = await handleLspFormat(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/codeActions':
      if (req.method === 'POST') {
        response = await handleLspCodeActions(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/diagnostics':
      if (req.method === 'POST') {
        response = await handleLspDiagnostics(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/start':
      if (req.method === 'POST') {
        response = await handleLspStart(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/stop':
      if (req.method === 'POST') {
        response = await handleLspStop(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/lsp/status':
      if (req.method === 'GET') {
        response = await handleLspStatus(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/ai/config':
      if (req.method === 'GET') {
        response = await handleAiConfigGet(req);
      } else if (req.method === 'POST') {
        response = await handleAiConfigPost(req);
      } else if (req.method === 'PUT') {
        response = await handleAiConfigPut(req);
      } else if (req.method === 'DELETE') {
        response = await handleAiConfigDelete(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/ai/active':
      if (req.method === 'POST') {
        response = await handleAiActiveModel(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/ai/test':
      if (req.method === 'POST') {
        response = await handleAiTest(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/ai/chat':
      if (req.method === 'POST') {
        response = await handleAiChat(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/ai/models':
      if (req.method === 'GET') {
        response = await handleAiModels(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/ai/chat/stream':
      if (req.method === 'POST') {
        response = await handleAiChatStream(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/ai/completion':
      if (req.method === 'POST') {
        response = await handleAiCompletion(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/bmad/install':
      if (req.method === 'POST') {
        response = await handleBMADInstall(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/bmad/status':
      if (req.method === 'GET') {
        response = await handleBMADStatus(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/bmad/upgrade':
      if (req.method === 'POST') {
        response = await handleBMADUpgrade(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/skills/load':
      if (req.method === 'GET') {
        response = await handleSkillLoad(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/skills/list':
      if (req.method === 'GET') {
        response = await handleSkillList(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/skills/match':
      if (req.method === 'POST') {
        response = await handleSkillMatch(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    case '/api/v1/skills/register':
      if (req.method === 'POST') {
        response = await handleSkillRegister(req);
      } else {
        response = new Response('Method Not Allowed', { status: 405 });
      }
      break;
    default:
      // Serve static frontend files
      response = await serveStaticFiles(url.pathname);
  }

  return addCorsHeaders(response, corsHeaders);
}

// Static file serving for frontend
// Use absolute path based on current file location to work from any directory
const __dirname = new URL('.', import.meta.url).pathname;
const FRONTEND_DIST = join(__dirname, '../../frontend/dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

async function serveStaticFiles(pathname: string): Promise<Response> {
  // Default to index.html for client-side routing
  let filePath = pathname === '/' ? '/index.html' : pathname;
  
  // Remove leading slash and resolve path
  const cleanPath = filePath.replace(/^\//, '');
  const fullPath = join(FRONTEND_DIST, cleanPath);
  
  try {
    const fileInfo = await Deno.stat(fullPath);
    
    if (fileInfo.isDirectory) {
      // Try index.html in directory
      const indexPath = join(fullPath, 'index.html');
      try {
        const content = await Deno.readFile(indexPath);
        const ext = extname(indexPath);
        const contentType = MIME_TYPES[ext] || 'text/html';
        return new Response(content, {
          headers: { 
            'Content-Type': contentType
          }
        });
      } catch {
        // Directory without index.html - serve 404
        return new Response('Not Found', { status: 404 });
      }
    }
    
    const content = await Deno.readFile(fullPath);
    const ext = extname(fullPath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    const headers: Record<string, string> = { 
      'Content-Type': contentType
    };
    
    return new Response(content, {
      headers
    });
  } catch {
    // File not found - try index.html for SPA routing
    try {
      const indexPath = join(FRONTEND_DIST, 'index.html');
      const content = await Deno.readFile(indexPath);
      return new Response(content, {
        headers: { 
          'Content-Type': 'text/html'
        }
      });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  }
}

// Start file watcher
startFileWatcher();

// Start heartbeat cleanup timer
startCleanupTimer();

console.log(`Server running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, handleRequest);
