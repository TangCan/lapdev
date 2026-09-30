import { assertEquals } from 'jsr:@std/assert@1';
import { CommandPolicy, type CommandRequest } from '../security/commandPolicy.ts';
import { handleCloseTerminal, handleCreateTerminal, handleTerminalCommand, handleTerminalOutput, terminalLaunchConfig } from './terminalHandler.ts';

const expected = {
  linux: ['-qc', '/bin/bash -i', '/dev/null'],
  darwin: ['-q', '/dev/null', '/bin/bash', '-i'],
};

for (const platform of ['linux', 'darwin'] as const) {
  Deno.test(`${platform} terminal uses the authorized launch and preserves close semantics`, async () => {
    assertEquals(terminalLaunchConfig(platform), { executable: '/usr/bin/script', args: expected[platform] });
    const commandDescriptor = Object.getOwnPropertyDescriptor(Deno, 'Command')!;
    const originalEvaluate = CommandPolicy.prototype.evaluate;
    const buildDescriptor = Object.getOwnPropertyDescriptor(Deno, 'build')!;
    const keys = ['CAPABILITY_POLICY_PROFILE', 'WORKSPACE_PATH'];
    const previous = keys.map(key => Deno.env.get(key));
    let authorized: CommandRequest | undefined;
    let spawns = 0;
    let constructions = 0;
    let killed = false;
    let resolveStatus!: (status: Deno.CommandStatus) => void;
    const status = new Promise<Deno.CommandStatus>(resolve => { resolveStatus = resolve; });
    const writes: string[] = [];
    const stdin = new WritableStream<Uint8Array>({ write(value) { writes.push(new TextDecoder().decode(value)); } });
    const child = {
      stdin,
      stdout: new ReadableStream<Uint8Array>({ start(controller) { controller.close(); } }),
      stderr: new ReadableStream<Uint8Array>({ start(controller) { controller.close(); } }),
      status,
      kill(signal: string) { assertEquals(signal, 'SIGTERM'); killed = true; resolveStatus({ success: false, code: 143, signal: 'SIGTERM' }); },
    };
    let sessionId: string | undefined;
    const request = (body: unknown) => new Request('http://localhost/terminal', { method: 'POST', body: JSON.stringify(body) });
    try {
      Object.defineProperty(Deno, 'build', { configurable: true, value: { ...Deno.build, os: platform } });
      Deno.env.set(keys[0], 'local-trusted');
      Deno.env.set(keys[1], Deno.cwd());
      CommandPolicy.prototype.evaluate = function (value) {
        authorized = value;
        assertEquals(spawns, 0);
        return originalEvaluate.call(this, value);
      };
      const FakeCommand = class {
        constructor(executable: string, options: Deno.CommandOptions) {
          constructions++;
          assertEquals(executable, authorized!.executable);
          assertEquals(options.args, expected[platform]);
          assertEquals(options.args, authorized!.args);
          assertEquals(options.args === authorized!.args, true);
          assertEquals(options.cwd, authorized!.cwd);
          assertEquals(options.cwd, Deno.cwd());
          assertEquals([options.stdin, options.stdout, options.stderr], ['piped', 'piped', 'piped']);
          assertEquals(options.env?.TERM, 'xterm-256color');
          assertEquals(options.env?.COLUMNS, '120');
          assertEquals(options.env?.LINES, '24');
        }
        spawn() { spawns++; return child; }
      } as unknown as typeof Deno.Command;
      Object.defineProperty(Deno, 'Command', { configurable: true, value: FakeCommand });
      const created = await handleCreateTerminal(request({ executable: 'client-override', args: ['-c'] }));
      assertEquals(created.status, 200);
      sessionId = (await created.json()).sessionId;
      assertEquals(spawns, 1);
      assertEquals((await handleTerminalCommand(request({ sessionId, command: 'printf test' }))).status, 200);
      assertEquals(writes, ['printf test\n']);
      assertEquals((await handleCloseTerminal(request({ sessionId }))).status, 200);
      assertEquals(killed, true);
      const output = await handleTerminalOutput(new Request(`http://localhost/terminal?sessionId=${sessionId}`));
      assertEquals(output.status, 400);
      assertEquals((await output.json()).message, 'Session not found');
      sessionId = undefined;
      Deno.env.set(keys[0], 'remote-shared');
      spawns = 0;
      constructions = 0;
      const denied = await handleCreateTerminal(request({}));
      assertEquals(denied.status, 403);
      assertEquals((await denied.json()).error.code, 'INTERACTIVE_DENIED');
      assertEquals(spawns, 0);
      assertEquals(constructions, 0);
    } finally {
      if (sessionId) await handleCloseTerminal(request({ sessionId }));
      resolveStatus({ success: false, code: 143, signal: 'SIGTERM' });
      await status;
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      if (!stdin.locked) await stdin.close().catch(() => {});
      Object.defineProperty(Deno, 'Command', commandDescriptor);
      CommandPolicy.prototype.evaluate = originalEvaluate;
      Object.defineProperty(Deno, 'build', buildDescriptor);
      keys.forEach((key, index) => { if (previous[index] === undefined) Deno.env.delete(key); else Deno.env.set(key, previous[index]!); });
    }
  });
}
