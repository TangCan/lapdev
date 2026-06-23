import { sendTerminalOutput } from '../websocket/fileWatcher.ts';

interface TerminalSession {
  id: string;
  process: Deno.ChildProcess;
  outputBuffer: string;
  stdinWriter?: WritableStreamDefaultWriter<Uint8Array>;
}

const sessions = new Map<string, TerminalSession>();

export async function handleCreateTerminal(_req: Request): Promise<Response> {
  const sessionId = crypto.randomUUID();
  
  const command = new Deno.Command('bash', {
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
    cwd: Deno.env.get('WORKSPACE_DIR') || Deno.cwd(),
    env: {
      ...Deno.env.toObject(),
      TERM: 'xterm-256color',
    },
  });

  const process = command.spawn();

  const session: TerminalSession = {
    id: sessionId,
    process,
    outputBuffer: '',
    stdinWriter: process.stdin.getWriter(),
  };

  sessions.set(sessionId, session);

  // Read stdout and send to WebSocket
  (async () => {
    const decoder = new TextDecoder();
    const reader = process.stdout.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const output = decoder.decode(value);
      session.outputBuffer += output;
      await sendTerminalOutput(sessionId, output);
    }
  })();

  // Read stderr and send to WebSocket
  (async () => {
    const decoder = new TextDecoder();
    const reader = process.stderr.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const output = decoder.decode(value);
      session.outputBuffer += output;
      await sendTerminalOutput(sessionId, output);
    }
  })();

  // Handle process exit
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
      // Send SIGWINCH signal to notify terminal of window size change
      // Deno.kill requires --allow-run permission
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

    session.process.stdin?.close();
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
