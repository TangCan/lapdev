import {
  getGitStatus,
  getGitDiff,
  getBranches,
  stageFiles,
  commitChanges,
  checkoutBranch
} from '../services/gitService.ts';
import { triggerGitStatusUpdate } from '../websocket/fileWatcher.ts';

// 统一错误处理和日志记录
function logError(endpoint: string, error: unknown, requestInfo?: Record<string, unknown>) {
  console.error(`[Git API Error] ${endpoint}:`, error);
  if (requestInfo) {
    console.error(`[Git API Request Info]:`, JSON.stringify(requestInfo));
  }
}

function createErrorResponse(message: string, status: number = 400): Response {
  return new Response(JSON.stringify({
    status: 'error',
    message
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'X-Error-Type': 'Validation'
    },
    status
  });
}

function createSuccessResponse(data?: unknown): Response {
  return new Response(JSON.stringify({
    status: 'success',
    data
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200
  });
}

export async function handleGitStatus(req: Request): Promise<Response> {
  try {
    const result = await getGitStatus();
    
    if (result.status === 'success') {
      return createSuccessResponse(result.data);
    }
    
    logError('handleGitStatus', new Error(result.message || 'Unknown error'));
    return createErrorResponse(result.message || 'Failed to get git status');
  } catch (error) {
    logError('handleGitStatus', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function handleGitDiff(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');

    if (!path) {
      return createErrorResponse('Path parameter is required');
    }

    // 验证路径长度
    if (path.length > 2048) {
      return createErrorResponse('Path is too long');
    }

    const result = await getGitDiff(path);
    
    if (result.status === 'success') {
      return createSuccessResponse(result.data);
    }
    
    logError('handleGitDiff', new Error(result.message || 'Unknown error'), { path });
    return createErrorResponse(result.message || 'Failed to get git diff');
  } catch (error) {
    logError('handleGitDiff', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function handleGitBranches(req: Request): Promise<Response> {
  try {
    const result = await getBranches();
    
    if (result.status === 'success') {
      return createSuccessResponse(result.data);
    }
    
    logError('handleGitBranches', new Error(result.message || 'Unknown error'));
    return createErrorResponse(result.message || 'Failed to get branches');
  } catch (error) {
    logError('handleGitBranches', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function handleGitStage(req: Request): Promise<Response> {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON body');
    }
    
    if (!body.paths || !Array.isArray(body.paths)) {
      return createErrorResponse('Paths array is required');
    }

    // 验证路径数量限制
    if (body.paths.length > 100) {
      return createErrorResponse('Too many paths in request');
    }

    // 验证每个路径
    for (const path of body.paths) {
      if (typeof path !== 'string' || path.length > 2048) {
        return createErrorResponse('Invalid path in paths array');
      }
    }

    const result = await stageFiles(body.paths);
    
    if (result.status === 'success') {
      // Trigger WebSocket update on success
      triggerGitStatusUpdate();
      return createSuccessResponse();
    }
    
    logError('handleGitStage', new Error(result.message || 'Unknown error'), { paths: body.paths });
    return createErrorResponse(result.message || 'Failed to stage files');
  } catch (error) {
    logError('handleGitStage', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function handleGitCommit(req: Request): Promise<Response> {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON body');
    }
    
    if (!body.message || typeof body.message !== 'string') {
      return createErrorResponse('Commit message is required');
    }

    // 验证提交信息长度
    if (body.message.length > 1000) {
      return createErrorResponse('Commit message is too long');
    }

    const result = await commitChanges(body.message);
    
    if (result.status === 'success') {
      // Trigger WebSocket update on success
      triggerGitStatusUpdate();
      return createSuccessResponse();
    }
    
    logError('handleGitCommit', new Error(result.message || 'Unknown error'), { message: body.message });
    return createErrorResponse(result.message || 'Failed to commit');
  } catch (error) {
    logError('handleGitCommit', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function handleGitCheckout(req: Request): Promise<Response> {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return createErrorResponse('Invalid JSON body');
    }
    
    if (!body.branch || typeof body.branch !== 'string') {
      return createErrorResponse('Branch name is required');
    }

    // 验证分支名称长度
    if (body.branch.length > 255) {
      return createErrorResponse('Branch name is too long');
    }

    const result = await checkoutBranch(body.branch);
    
    if (result.status === 'success') {
      // Trigger WebSocket update on success
      triggerGitStatusUpdate();
      return createSuccessResponse();
    }
    
    logError('handleGitCheckout', new Error(result.message || 'Unknown error'), { branch: body.branch });
    return createErrorResponse(result.message || 'Failed to checkout');
  } catch (error) {
    logError('handleGitCheckout', error);
    return createErrorResponse('Internal server error', 500);
  }
}