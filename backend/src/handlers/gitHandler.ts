import {
  getGitStatus,
  getGitDiff,
  getBranches,
  stageFiles,
  commitChanges,
  checkoutBranch
} from '../services/gitService.ts';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function handleGitStatus(req: Request): Promise<Response> {
  const result = await getGitStatus();
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: result.status === 'success' ? 200 : 400
  });
}

export async function handleGitDiff(req: Request): Promise<Response> {
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

  const result = await getGitDiff(path);
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: result.status === 'success' ? 200 : 400
  });
}

export async function handleGitBranches(req: Request): Promise<Response> {
  const result = await getBranches();
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: result.status === 'success' ? 200 : 400
  });
}

export async function handleGitStage(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    
    if (!body.paths || !Array.isArray(body.paths)) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Paths array is required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const result = await stageFiles(body.paths);
    
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

export async function handleGitCommit(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    
    if (!body.message) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Commit message is required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const result = await commitChanges(body.message);
    
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

export async function handleGitCheckout(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    
    if (!body.branch) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Branch name is required'
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const result = await checkoutBranch(body.branch);
    
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
