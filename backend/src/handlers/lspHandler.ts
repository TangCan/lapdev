import { LspService } from '../services/lspService.ts';

const lspService = new LspService();

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function handleLspCompletion(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content, position } = body;

    if (!path || !content || !position) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content, position'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const items = await lspService.getCompletions(path, content, position);

    return new Response(
      JSON.stringify({
        status: 'success',
        items
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspSignature(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content, position } = body;

    if (!path || !content || !position) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content, position'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const signatures = await lspService.getSignatureHelp(path, content, position);

    return new Response(
      JSON.stringify({
        status: 'success',
        signatures
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspDefinition(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content, position } = body;

    if (!path || !content || !position) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content, position'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const locations = await lspService.getDefinition(path, content, position);

    return new Response(
      JSON.stringify({
        status: 'success',
        locations
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspReferences(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content, position } = body;

    if (!path || !content || !position) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content, position'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const locations = await lspService.getReferences(path, content, position);

    return new Response(
      JSON.stringify({
        status: 'success',
        locations
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspTypeDefinition(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content, position } = body;

    if (!path || !content || !position) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content, position'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const locations = await lspService.getTypeDefinition(path, content, position);

    return new Response(
      JSON.stringify({
        status: 'success',
        locations
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspRename(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content, position, newName } = body;

    if (!path || !content || !position || !newName) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content, position, newName'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const edits = await lspService.renameSymbol(path, content, position, newName);

    return new Response(
      JSON.stringify({
        status: 'success',
        edits
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspFormat(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content } = body;

    if (!path || content === undefined) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formattedContent = await lspService.formatDocument(path, content);

    return new Response(
      JSON.stringify({
        status: 'success',
        content: formattedContent
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspCodeActions(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content, range } = body;

    if (!path || !content || !range) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content, range'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const actions = await lspService.getCodeActions(path, content, range);

    return new Response(
      JSON.stringify({
        status: 'success',
        actions
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspDiagnostics(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content } = body;

    if (!path || content === undefined) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const diagnostics = await lspService.getDiagnostics(path, content);

    return new Response(
      JSON.stringify({
        status: 'success',
        diagnostics
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspHover(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { path, content, position } = body;

    if (!path || !content || !position) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required fields: path, content, position'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const hover = await lspService.getHover(path, content, position);

    return new Response(
      JSON.stringify({
        status: 'success',
        hover
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspStart(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { language } = body;

    if (!language) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required field: language'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await lspService.startServer(language);

    return new Response(
      JSON.stringify({
        status: 'success',
        message: `LSP server for ${language} started`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspStop(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { language } = body;

    if (!language) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required field: language'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await lspService.stopServer(language);

    return new Response(
      JSON.stringify({
        status: 'success',
        message: `LSP server for ${language} stopped`
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function handleLspStatus(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const language = url.searchParams.get('language');

    if (!language) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Missing required parameter: language'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isRunning = lspService.isServerRunning(language);

    return new Response(
      JSON.stringify({
        status: 'success',
        running: isRunning
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: getErrorMessage(error)
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}