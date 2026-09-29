const cli = new URL('../../cli/bin/lapdev.js', import.meta.url).pathname;
const runtime = new URL('../fixtures/runtime-6-1', import.meta.url).pathname;

async function runCli(args: string[]) {
  return await new Deno.Command('node', {
    args: [cli, ...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
}

function text(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}

Deno.test('[P0] AC-1: versioned CLI exposes web, doctor and version', async () => {
  // Given a packed-compatible CLI entrypoint, when version and doctor run...
  const version = await runCli(['version']);
  const doctor = await runCli(['doctor', '--runtime-dir', runtime]);
  // Then the command contract is stable and the expected checks are visible.
  if (text(version.stdout).trim() !== '1.0.0') throw new Error(text(version.stderr));
  if (!text(doctor.stdout).includes('PASS runtime')) throw new Error(text(doctor.stdout));
});

Deno.test('[P0] AC-2: web --no-open starts localhost runtime', async () => {
  // Given a valid runtime fixture, when web starts without opening a browser...
  const child = new Deno.Command('node', {
    args: [cli, 'web', '--no-open', '--runtime-dir', runtime, '--port', '34568'],
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  try {
    let response: Response | undefined;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        response = await fetch('http://127.0.0.1:34568/health');
        if (response.ok) break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    // Then the server is reachable only through the localhost contract.
    if (!response?.ok) throw new Error('localhost health check did not pass');
  } finally {
    child.kill('SIGTERM');
    await child.status;
  }
});

Deno.test('[P0] AC-3: invalid runtime is rejected before launch', async () => {
  // Given an incomplete runtime path, when web validates it...
  const result = await runCli(['web', '--no-open', '--runtime-dir', `${runtime}/missing`]);
  // Then it fails before starting a child runtime.
  if (result.code !== 3 || !text(result.stderr).includes('does not exist')) throw new Error(text(result.stderr));
});

Deno.test('[P1] AC-4: doctor reports safe environment checks', async () => {
  // Given a controlled runtime directory, when doctor inspects the environment...
  const result = await runCli(['doctor', '--runtime-dir', runtime]);
  // Then it reports categories without secrets or workspace contents.
  const output = text(result.stdout);
  if (!/^PASS (node|platform|runtime|cache)$/m.test(output)) throw new Error(output);
  if (output.includes('LAPDEV_') || output.includes('/workspace')) throw new Error('diagnostic leaked sensitive context');
});

Deno.test('[P0] AC-5: invalid invocation returns stable non-zero result', async () => {
  // Given an unsupported command, when the CLI parses it...
  const result = await runCli(['unknown-command']);
  // Then it returns usage guidance without touching a runtime path.
  if (result.code !== 2 || !text(result.stderr).includes('unknown command')) throw new Error(text(result.stderr));
});

Deno.test('[P1] AC-6: source-install entrypoints remain compatible', async () => {
  // Given the existing source package, when its command contract is inspected...
  const packageJson = JSON.parse(await Deno.readTextFile(new URL('../../package.json', import.meta.url)));
  // Then existing source test entrypoints remain present.
  for (const key of ['test:frontend', 'test:backend', 'test:rust']) {
    if (typeof packageJson.scripts[key] !== 'string') throw new Error(`missing source script: ${key}`);
  }
});
