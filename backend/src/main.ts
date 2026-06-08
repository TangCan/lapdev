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
  handleCloseTerminal
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
import { handleBMADInstall, handleBMADStatus } from './handlers/bmadHandler.ts';

const PORT = parseInt(Deno.env.get('PORT') || '3000');

// 验证和解析ALLOWED_ORIGINS环境变量
function parseAllowedOrigins(): string[] {
  const envValue = Deno.env.get('ALLOWED_ORIGINS');
  if (!envValue) {
    return ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];
  }
  
  const origins = envValue.split(',').map(o => o.trim()).filter(o => o.length > 0);
  
  // 验证每个origin格式
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
  
  return validOrigins.length > 0 ? validOrigins : ['http://localhost:3000', 'http://localhost:5173'];
}

const ALLOWED_ORIGINS = parseAllowedOrigins();

// Helper to build CORS headers based on origin
function getCorsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    default:
      response = new Response('Not Found', { status: 404 });
  }

  return addCorsHeaders(response, corsHeaders);
}

// Start file watcher
startFileWatcher();

// Start heartbeat cleanup timer
startCleanupTimer();

console.log(`Server running on http://localhost:${PORT}`);

Deno.serve({ port: PORT }, handleRequest);
