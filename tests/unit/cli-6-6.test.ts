const projectRoot = new URL('../..', import.meta.url).pathname;
const fixture = new URL('../fixtures/runtime-6-1', import.meta.url).pathname;

function outputText(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}

Deno.test('[P0] 6.6: packed CLI runs through the npx installation path', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'lapdev-cli-6-6-' });
  try {
    const pack = await new Deno.Command('npm', {
      args: ['pack', './cli', '--pack-destination', temp],
      cwd: projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (pack.code !== 0) throw new Error(outputText(pack.stderr));
    const archive = [...Deno.readDirSync(temp)].find((entry) => entry.name.endsWith('.tgz'));
    if (!archive) throw new Error('npm pack did not produce an archive');
    const version = await new Deno.Command('npm', {
      args: ['exec', '--offline', '--yes', `--package=${temp}/${archive.name}`, '--', 'lapdev', 'version'],
      cwd: projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (version.code !== 0 || outputText(version.stdout).trim() !== '1.0.2') {
      throw new Error(outputText(version.stderr) || outputText(version.stdout));
    }
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});

Deno.test('[P0] 6.6: packed CLI starts a matching runtime without Docker, Deno or Rust', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'lapdev-cli-6-6-' });
  const port = '34569';
  let child: Deno.ChildProcess | undefined;
  try {
    const pack = await new Deno.Command('npm', {
      args: ['pack', './cli', '--pack-destination', temp],
      cwd: projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    if (pack.code !== 0) throw new Error(outputText(pack.stderr));
    const archive = [...Deno.readDirSync(temp)].find((entry) => entry.name.endsWith('.tgz'));
    if (!archive) throw new Error('npm pack did not produce an archive');
    child = new Deno.Command('npm', {
      args: ['exec', '--offline', '--yes', `--package=${temp}/${archive.name}`, '--', 'lapdev', 'web', '--no-open', '--runtime-dir', fixture, '--port', port],
      cwd: projectRoot,
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    let healthy = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        healthy = response.ok;
        if (healthy) break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    if (!healthy) throw new Error('packed CLI runtime did not become healthy');
  } finally {
    child?.kill('SIGTERM');
    if (child) await child.status;
    await Deno.remove(temp, { recursive: true });
  }
});
