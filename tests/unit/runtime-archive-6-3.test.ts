const root = new URL('../..', import.meta.url).pathname;

Deno.test('[P0] 6.3: archive builder declares supported target matrix and required layout', async () => {
  const script = await Deno.readTextFile(`${root}/scripts/build-runtime-archive.sh`);
  for (const value of ['linux-x64', 'darwin-arm64', 'x86_64-unknown-linux-gnu', 'aarch64-apple-darwin', 'bin', 'lib', 'app', 'LICENSES']) {
    if (!script.includes(value)) throw new Error(`archive contract missing ${value}`);
  }
});

Deno.test('[P0] 6.3: archive builder rejects unsupported targets', async () => {
  const result = await new Deno.Command('bash', {
    args: [`${root}/scripts/build-runtime-archive.sh`, 'windows-x64'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (result.code !== 2) throw new Error(new TextDecoder().decode(result.stderr));
});

Deno.test('[P1] 6.3: archive builder excludes workspace, fixtures and secrets by construction', async () => {
  const script = await Deno.readTextFile(`${root}/scripts/build-runtime-archive.sh`);
  for (const forbidden of ['workspace', 'tests/fixtures', 'node_modules', '.env']) {
    if (script.includes(`cp -R "${'${PROJECT_ROOT}'}/${forbidden}`)) throw new Error(`forbidden input copied: ${forbidden}`);
  }
});

Deno.test('[P0] 6.3: archive verifier enforces required layout and forbidden paths', async () => {
  const script = await Deno.readTextFile(`${root}/scripts/verify-runtime-archive.sh`);
  for (const value of ['bin/lapdev-server', 'bin/lapdev-runtime', 'lib/', 'app/backend/', 'app/frontend/dist/', 'manifest.json', 'workspace', 'node_modules', '.env']) {
    if (!script.includes(value)) throw new Error(`archive verifier missing ${value}`);
  }
});
