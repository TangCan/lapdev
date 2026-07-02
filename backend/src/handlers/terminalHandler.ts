import { sendTerminalOutput } from '../websocket/fileWatcher.ts';

interface TerminalSession {
  id: string;
  process: Deno.ChildProcess;
  outputBuffer: string;
  stdinWriter?: WritableStreamDefaultWriter<Uint8Array>;
  pendingOutput: string[];
}

const sessions = new Map<string, TerminalSession>();

export async function handleCreateTerminal(_req: Request): Promise<Response> {
  console.log('[handleCreateTerminal] Received request');
  const sessionId = crypto.randomUUID();

  const command = new Deno.Command('/usr/bin/script', {
    args: ['-qc', '/bin/bash -i', '/dev/null'],
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
    cwd: Deno.env.get('WORKSPACE_DIR') || Deno.cwd(),
    env: {
      ...Deno.env.toObject(),
      TERM: 'xterm-256color',
      PS1: '\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ ',
      COLUMNS: '120',
      LINES: '24',
    },
  });

  const process = command.spawn();

  const session: TerminalSession = {
    id: sessionId,
    process,
    outputBuffer: '',
    stdinWriter: process.stdin.getWriter(),
    pendingOutput: [],
  };

  sessions.set(sessionId, session);

  

  (async () => {
    const decoder = new TextDecoder('utf-8');
    const reader = process.stdout.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const output = decoder.decode(value, { stream: true });
      await sendOrBufferOutput(sessionId, output);
    }
  })();

  (async () => {
    const decoder = new TextDecoder('utf-8');
    const reader = process.stderr.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const output = decoder.decode(value, { stream: true });
      await sendOrBufferOutput(sessionId, output);
    }
  })();

  process.status.then(async (status) => {
    sessions.delete(sessionId);
    await sendTerminalOutput(sessionId, `\n[Process exited with code ${status.code}]`);
  });

  return new Response(JSON.stringify({
    status: 'success',
    sessionId,
    message: 'Terminal session created',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sendOrBufferOutput(sessionId: string, output: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.outputBuffer += output;

  const ws = await import('../websocket/fileWatcher.ts').then(m => m.getTerminalClient(sessionId));
  if (ws) {
    if (session.pendingOutput.length > 0) {
      for (const pending of session.pendingOutput) {
        await sendTerminalOutput(sessionId, pending);
      }
      session.pendingOutput = [];
    }
    await sendTerminalOutput(sessionId, output);
  } else {
    session.pendingOutput.push(output);
    console.log(`[sendOrBufferOutput] Buffered ${output.length} bytes for session ${sessionId}`);
  }
}

export async function flushPendingOutput(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) return;

  if (session.pendingOutput.length > 0) {
    for (const output of session.pendingOutput) {
      await sendTerminalOutput(sessionId, output);
    }
    console.log(`[flushPendingOutput] Flushed ${session.pendingOutput.length} pending messages for session ${sessionId}`);
    session.pendingOutput = [];
  }
}

export async function handleTerminalCommand(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { sessionId, command } = body;

    if (!sessionId || !command) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'sessionId and command are required',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Session not found',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const encoder = new TextEncoder();
    if (session.stdinWriter) {
      await session.stdinWriter.write(encoder.encode(command + '\n'));
    } else {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Cannot write to terminal',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({
      status: 'success',
      message: 'Command sent',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

export async function handleTerminalResize(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { sessionId, cols, rows } = body;

    if (!sessionId || cols === undefined || rows === undefined) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'sessionId, cols, and rows are required',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Session not found',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    try {
      Deno.kill(session.process.pid, "SIGWINCH");
      console.log(`Resized terminal ${sessionId} to ${cols}x${rows}`);
    } catch (error) {
      console.log(`SIGWINCH not supported on this platform: ${error instanceof Error ? error.message : error}`);
    }

    return new Response(JSON.stringify({
      status: 'success',
      message: 'Resize signal sent',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

export async function forwardTerminalInput(sessionId: string, input: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) {
    return;
  }

  const encoder = new TextEncoder();
  if (session.stdinWriter) {
    await session.stdinWriter.write(encoder.encode(input));
  }
}

export async function handleCloseTerminal(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'sessionId is required',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Session not found',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    try {
      if (session.stdinWriter) {
        session.stdinWriter.releaseLock();
      }
      session.process.stdin?.close();
    } catch {
      // Ignore - stream may already be closed or locked
    }
    session.process.kill('SIGTERM');
    sessions.delete(sessionId);

    return new Response(JSON.stringify({
      status: 'success',
      message: 'Terminal session closed',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

export async function handleTerminalOutput(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'sessionId is required',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Session not found',
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const output = session.outputBuffer;
    session.outputBuffer = '';

    return new Response(JSON.stringify({
      status: 'success',
      output,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
