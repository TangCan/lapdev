// Request and Response are built-in Deno types
import {
  getFileTree,
  readFile,
  writeFile,
  createFile,
  createDirectory,
  renameFile,
  deleteFile
} from '../services/fileService.ts';
import type { CreateFileRequest, RenameRequest, DeleteRequest } from '../types/file.ts';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function handleFileTree(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '/';
  const depth = parseInt(url.searchParams.get('depth') || '3');

  const result = await getFileTree(path, depth);
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: result.status === 'success' ? 200 : 400
  });
}

export async function handleReadFile(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get('path');

  if (!path) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Path parameter is required'
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }

  const result = await readFile(path);
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: result.status === 'success' ? 200 : 404
  });
}

export async function handleWriteFile(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    
    if (!path) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Path parameter is required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const content = await req.text();
    const result = await writeFile(path, content);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.status === 'success' ? 200 : 400
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: getErrorMessage(error)
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

export async function handleCreateFile(req: Request): Promise<Response> {
  try {
    const body: CreateFileRequest = await req.json();
    
    if (!body.path || !body.type) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Path and type are required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    let result;
    if (body.type === 'directory') {
      result = await createDirectory(body.path);
    } else {
      result = await createFile(body.path, body.content);
    }
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.status === 'success' ? 201 : 400
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: getErrorMessage(error)
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

export async function handleRenameFile(req: Request): Promise<Response> {
  try {
    const body: RenameRequest = await req.json();
    
    if (!body.oldPath || !body.newPath) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'oldPath and newPath are required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const result = await renameFile(body.oldPath, body.newPath);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.status === 'success' ? 200 : 400
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: getErrorMessage(error)
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}

export async function handleDeleteFile(req: Request): Promise<Response> {
  try {
    const body: DeleteRequest = await req.json();
    
    if (!body.path) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Path is required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const result = await deleteFile(body.path);
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: result.status === 'success' ? 200 : 400
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: getErrorMessage(error)
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}