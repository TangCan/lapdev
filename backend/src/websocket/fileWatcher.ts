// Deno WebSocket API is built-in, no external import needed
import { auditCapabilityDecision, authorizeCapability, currentPolicyProfile, getRemoteAuthSessionStore, isCapabilityContextCurrent, nextAuditRevision, resolveCapabilityContext } from '../security/capability.ts';
import { emitSecurityAuditEvent } from '../security/audit.ts';
import type { Capability, CapabilityContext } from '../security/capability.ts';

const WORKSPACE_DIR = Deno.env.get('WORKSPACE_PATH') || `${Deno.cwd()}/../workspace`;

// Heartbeat configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 45000; // 45 seconds (1.5x interval)
const CLEANUP_INTERVAL = 60000; // 60 seconds

// Git watcher debounce configuration
const GIT_DEBOUNCE_DELAY = 500; // 500ms debounce for Git changes

// Use Deno's WebSocket type which is returned by Deno.upgradeWebSocket
// deno-lint-ignore no-explicit-any
type WebSocket = any;

const clients = new Set<WebSocket>();
let watcher: Deno.FsWatcher | null = null;

// Terminal sessions mapped by session ID
const terminalClients = new Map<string, WebSocket>();

export function isSessionBound(context: CapabilityContext | undefined, sessionId: string): boolean {
  return !context?.sessionId || context.sessionId === 'http-request' || context.sessionId === sessionId;
}

// Track client subscriptions
interface ClientState {
  ws: WebSocket;
  lastActivity: number;
  isAlive: boolean;
  heartbeatTimer?: number;
  subscribedToGit: boolean;
  subscribedToFiles: boolean;
  sessionStore: ReturnType<typeof getRemoteAuthSessionStore>;
  wasRemote: boolean;
  auditSessionId: string;
  context?: CapabilityContext;
}
const clientStates = new Map<WebSocket, ClientState>();

// Git state debounce timer
let gitDebounceTimer: number | undefined;

// Track subscribed Git clients
const gitSubscribers = new Set<WebSocket>();

// Track broadcast statistics for monitoring
interface BroadcastStats {
  totalBroadcasts: number;
  successfulSends: number;
  failedSends: number;
  lastBroadcastTime: number;
}

const broadcastStats: BroadcastStats = {
  totalBroadcasts: 0,
  successfulSends: 0,
  failedSends: 0,
  lastBroadcastTime: 0
};

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
      const message = JSON.stringify({
        type: 'terminalOutput',
        sessionId,
        output,
      });
      if (!canSendBusiness(ws, 'terminal')) return;
      if (!isSessionBound(clientStates.get(ws)?.context, sessionId)) {
        const state = clientStates.get(ws)!;
        const context = auditContext(state, currentClientContext(state));
        emitSecurityAuditEvent({
          outcome: 'denied', reason: 'SESSION_MISMATCH',
          principalId: context.principalId, workspaceId: context.workspaceId,
          sessionId: context.sessionId, requestId: context.requestId,
          revision: nextAuditRevision(context.workspaceId), capability: 'terminal', profile: context.profile,
        });
        terminalClients.delete(sessionId);
        return;
      }
      await ws.send(message);
    } catch {
      closeFailedClient(ws);
    }
  }
}

function auditContext(state: ClientState, context: CapabilityContext): CapabilityContext {
  return { ...context, sessionId: state.auditSessionId };
}

function closeFailedClient(ws: WebSocket): void {
  cleanupClient(ws);
  try { ws.close?.(1011, 'WebSocket operation failed'); } catch { /* 已清理 */ }
}

function currentClientContext(state: ClientState): CapabilityContext {
  const context = state.context;
  const remote = state.wasRemote || currentPolicyProfile() === 'remote-shared';
  const current = resolveCapabilityContext(new Request('http://localhost', {
    headers: remote && context?.sessionId ? { Authorization: `Bearer ${context.sessionId}` } : {},
  }), [], state.sessionStore);
  // 原属远程的连接在部署模式改变后仍按远程策略授权。
  if (remote) {
    current.profile = 'remote-shared';
    current.deploymentProfile = 'remote-shared';
    current.authenticated = Boolean(context?.profile === 'remote-shared' && isCapabilityContextCurrent(context, state.sessionStore) && context.authenticated);
    current.userId = current.authenticated ? context!.userId : '';
  }
  if (context) {
    current.requestId = context.requestId;
    current.principalId = context.principalId;
    current.workspaceId = context.workspaceId;
    current.sessionId = context.sessionId;
  }
  return current;
}

function removeCapabilityMappings(ws: WebSocket, capability: Capability): void {
  const state = clientStates.get(ws);
  if (capability === 'files' && state) state.subscribedToFiles = false;
  if (capability === 'git') {
    gitSubscribers.delete(ws);
    if (state) state.subscribedToGit = false;
  }
  if (capability === 'terminal') {
    for (const [id, client] of terminalClients) if (client === ws) terminalClients.delete(id);
  }
}

function validateClientSession(state: ClientState): boolean {
  if (!state.context || isCapabilityContextCurrent(state.context, state.sessionStore)) return true;
  console.info(JSON.stringify({
    type: 'security_session_invalidated',
    requestId: state.context.requestId || 'unknown',
    principalId: state.context.principalId || 'anonymous',
    workspaceId: state.context.workspaceId || 'unknown',
    sessionId: state.auditSessionId,
    reason: 'expired-or-revoked',
  }));
  cleanupClient(state.ws);
  try { state.ws.close?.(4001, 'Session expired or revoked'); } catch { /* 已清理 */ }
  return false;
}

function canSendBusiness(ws: WebSocket, capability: Capability): boolean {
  const state = clientStates.get(ws);
  if (!state || ws.readyState !== WebSocket.OPEN) {
    cleanupClient(ws);
    return false;
  }
  if (!validateClientSession(state)) {
    const current = currentClientContext(state);
    auditCapabilityDecision(auditContext(state, current), capability, { allowed: false, code: 'UNAUTHENTICATED', message: 'Session expired or revoked' });
    return false;
  }
  const current = currentClientContext(state);
  const decision = authorizeCapability(current, capability);
  auditCapabilityDecision(auditContext(state, current), capability, decision);
  if (!decision.allowed) removeCapabilityMappings(ws, capability);
  return decision.allowed;
}

export function getTerminalClient(sessionId: string): WebSocket | undefined {
  return terminalClients.get(sessionId);
}

type TerminalHandlers = Pick<typeof import('../handlers/terminalHandler.ts'), 'flushPendingOutput' | 'forwardTerminalInput'>;

export function handleWebSocket(
  ws: WebSocket,
  context?: CapabilityContext,
  sessionStore = getRemoteAuthSessionStore(),
  loadTerminalHandlers: () => Promise<TerminalHandlers> = () => import('../handlers/terminalHandler.ts'),
): void {
  clients.add(ws);
  
  // Initialize client state for heartbeat tracking
  const clientState: ClientState = {
    ws,
    lastActivity: Date.now(),
    isAlive: true,
    subscribedToGit: false,
    subscribedToFiles: false,
    sessionStore,
    wasRemote: context?.profile === 'remote-shared' || currentPolicyProfile() === 'remote-shared',
    auditSessionId: crypto.randomUUID(),
    context,
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
      if (!clientStates.has(ws) || !validateClientSession(clientState)) return;
      const message = JSON.parse(event.data);
      clientState.lastActivity = Date.now();
      const capabilities: Record<string, Capability> = {
        subscribe: 'files', unsubscribe: 'files',
        subscribeToGit: 'git', unsubscribeFromGit: 'git',
        terminalRegister: 'terminal', terminalInput: 'terminal', terminalUnregister: 'terminal',
      };
      const capability = Object.hasOwn(capabilities, message.type) ? capabilities[message.type] : undefined;
      if (capability) {
        const current = currentClientContext(clientState);
        const decision = authorizeCapability(current, capability);
        auditCapabilityDecision(auditContext(clientState, current), capability, decision);
        if (!decision.allowed) {
          removeCapabilityMappings(ws, capability);
          await ws.send(JSON.stringify({ type: 'error', code: 'CAPABILITY_DENIED', message: decision.message }));
          return;
        }
        if (capability === 'terminal' && message.sessionId && !isSessionBound(clientState.context, message.sessionId)) {
          await ws.send(JSON.stringify({ type: 'error', code: 'SESSION_MISMATCH', message: 'WebSocket session does not match terminal session' }));
          return;
        }
      }
      
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
        case 'subscribeToGit':
          clientState.subscribedToGit = true;
          gitSubscribers.add(ws);
          await ws.send(JSON.stringify({
            type: 'gitSubscribed',
            message: 'Subscribed to Git status updates'
          }));
          break;
        case 'unsubscribeFromGit':
          clientState.subscribedToGit = false;
          gitSubscribers.delete(ws);
          await ws.send(JSON.stringify({
            type: 'gitUnsubscribed',
            message: 'Unsubscribed from Git status updates'
          }));
          break;
        case 'terminalRegister':
          if (message.sessionId) {
            if (!isSessionBound(clientState.context, message.sessionId)) {
              await ws.send(JSON.stringify({ type: 'error', code: 'SESSION_MISMATCH', message: 'WebSocket session does not match terminal session' }));
              break;
            }
            console.log('[terminalRegister] Received');
            registerTerminalClient(message.sessionId, ws);
            const { flushPendingOutput } = await loadTerminalHandlers();
            await flushPendingOutput(message.sessionId);
            if (!canSendBusiness(ws, 'terminal') || terminalClients.get(message.sessionId) !== ws) break;
            await ws.send(JSON.stringify({
              type: 'terminalRegistered',
              sessionId: message.sessionId,
            }));
            console.log('[terminalRegister] Completed');
          }
          break;
        case 'terminalInput':
          // Forward terminal input to the backend process
          if (message.sessionId && message.input) {
            const { forwardTerminalInput } = await loadTerminalHandlers();
            await forwardTerminalInput(message.sessionId, message.input);
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
    } catch {
      console.error('Error handling WebSocket message');
      closeFailedClient(ws);
    }
  };

  ws.onerror = () => {
    console.error('WebSocket error');
    closeFailedClient(ws);
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
      closeFailedClient(ws);
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
  gitSubscribers.delete(ws);
  
  // Clean up terminal client mappings when WebSocket closes
  for (const [sessionId, client] of terminalClients) {
    if (client === ws) {
      terminalClients.delete(sessionId);
      console.log('Unregistered terminal client');
    }
  }
}

/**
 * Broadcast Git status update to subscribed clients
 */
export async function broadcastGitStatus(status: unknown): Promise<void> {
  let message: string;
  
  // Validate and serialize message
  try {
    message = JSON.stringify({
      type: 'gitStatus',
      status,
      timestamp: new Date().toISOString()
    });
  } catch {
    console.error('[WebSocket] Failed to serialize Git status');
    return;
  }

  const startTime = Date.now();
  broadcastStats.totalBroadcasts++;
  let successCount = 0;
  let failCount = 0;
  const failedClients: WebSocket[] = [];

  for (const client of gitSubscribers) {
    try {
      // Check if connection is still open before sending
      if (!canSendBusiness(client, 'git')) continue;
      
      await client.send(message);
      successCount++;
    } catch {
      failCount++;
      failedClients.push(client);
      closeFailedClient(client);
      
      console.error('[WebSocket] Failed to send Git status');
    }
  }

  // Clean up failed clients after iteration to avoid modifying set during iteration
  for (const client of failedClients) {
    gitSubscribers.delete(client);
    cleanupClient(client);
    console.log('[WebSocket] Removed disconnected client from Git subscribers');
  }

  // Update statistics
  broadcastStats.successfulSends += successCount;
  broadcastStats.failedSends += failCount;
  broadcastStats.lastBroadcastTime = Date.now();

  // Log broadcast summary
  const duration = Date.now() - startTime;
  console.log(`[WebSocket] Git status broadcast completed: ${successCount} sent, ${failCount} failed, ${duration}ms`);
}

/**
 * Trigger Git status update with debounce
 */
export function triggerGitStatusUpdate(): void {
  // Clear existing timer if any
  if (gitDebounceTimer) {
    clearTimeout(gitDebounceTimer);
  }
  
  // Set new debounced timer
  gitDebounceTimer = setTimeout(async () => {
    try {
      // Dynamically import gitService to avoid circular imports
      const { getGitStatus } = await import('../services/gitService.ts');
      const result = await getGitStatus();
      await broadcastGitStatus(result);
    } catch (error) {
      console.error('Error broadcasting Git status:', error);
    }
  }, GIT_DEBOUNCE_DELAY) as unknown as number;
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
  const state = clientStates.get(ws);
  if (state) state.subscribedToFiles = true;
  await ws.send(JSON.stringify({
    type: 'subscribed',
    message: 'File watcher subscribed'
  }));
}

async function handleUnsubscribe(ws: WebSocket, _message: unknown): Promise<void> {
  const state = clientStates.get(ws);
  if (state) state.subscribedToFiles = false;
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
  
  let message: string;
  
  // Validate and serialize message
  try {
    message = JSON.stringify({
      type: messageType,
      eventType,
      path,
      timestamp: new Date().toISOString()
    });
  } catch {
    console.error('[WebSocket] Failed to serialize file change message');
    return;
  }

  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;
  const failedClients: WebSocket[] = [];

  for (const client of clients) {
    if (!clientStates.get(client)?.subscribedToFiles) continue;
    try {
      // Check if connection is still open before sending
      if (!canSendBusiness(client, 'files')) continue;
      
      await client.send(message);
      successCount++;
    } catch {
      failCount++;
      failedClients.push(client);
      closeFailedClient(client);
      
      console.error('[WebSocket] Failed to send file change');
    }
  }

  // Clean up failed clients after iteration to avoid modifying set during iteration
  for (const client of failedClients) {
    clients.delete(client);
    cleanupClient(client);
    console.log('[WebSocket] Removed disconnected client from broadcast list');
  }

  // Log broadcast summary
  const duration = Date.now() - startTime;
  console.log(`[WebSocket] File change broadcast completed: ${successCount} sent, ${failCount} failed, ${duration}ms`);
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
