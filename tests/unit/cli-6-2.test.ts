const cli = new URL('../../cli/bin/lapdev.js', import.meta.url).pathname;
const fixture = new URL('../fixtures/runtime-6-1', import.meta.url).pathname;

function decode(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}

async function runCli(args: string[], env: Record<string, string> = {}) {
  return await new Deno.Command('node', {
    args: [cli, ...args],
    stdout: 'piped',
    stderr: 'piped',
    env: { ...Deno.env.toObject(), ...env },
  }).output();
}

Deno.test('[P0] 6.2-AC1: matching manifest is accepted', async () => {
  const result = await runCli(['doctor', '--runtime-dir', fixture]);
  if (result.code !== 0) throw new Error(decode(result.stderr));
  if (!decode(result.stdout).includes('PASS runtime')) throw new Error(decode(result.stdout));
});

Deno.test('[P0] 6.2-AC1: mismatched manifest version is rejected', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'lapdev-manifest-mismatch-' });
  const manifest = JSON.parse(await Deno.readTextFile(`${fixture}/manifest.json`));
  manifest.version = '9.9.9';
  await Deno.mkdir(`${temp}/bin`);
  await Deno.copyFile(`${fixture}/bin/lapdev-runtime.js`, `${temp}/bin/lapdev-runtime.js`);
  await Deno.writeTextFile(`${temp}/manifest.json`, JSON.stringify(manifest));
  const result = await runCli(['doctor', '--runtime-dir', temp]);
  if (result.code !== 3 || !decode(result.stdout).includes('WARN runtime')) throw new Error(decode(result.stdout));
});

Deno.test('[P0] 6.2-AC3: offline cache miss does not launch', async () => {
  const home = await Deno.makeTempDir({ prefix: 'lapdev-offline-home-' });
  const result = await runCli(['web', '--offline', '--no-open'], { HOME: home });
  const output = `${decode(result.stdout)}${decode(result.stderr)}`;
  if (result.code !== 3 || !output.includes('offline cache miss')) throw new Error(output);
});

Deno.test('[P1] 6.2-AC2: invalid local asset integrity is rejected', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'lapdev-manifest-integrity-' });
  const manifest = JSON.parse(await Deno.readTextFile(`${fixture}/manifest.json`));
  manifest.sha256 = '0000000000000000000000000000000000000000000000000000000000000000';
  await Deno.mkdir(`${temp}/bin`);
  await Deno.copyFile(`${fixture}/bin/lapdev-runtime.js`, `${temp}/bin/lapdev-runtime.js`);
  await Deno.copyFile(`${fixture}/runtime.tar.gz`, `${temp}/runtime.tar.gz`);
  await Deno.writeTextFile(`${temp}/manifest.json`, JSON.stringify(manifest));
  const result = await runCli(['web', '--no-open', '--runtime-dir', temp]);
  if (result.code !== 3 || !decode(result.stderr).includes('integrity mismatch')) throw new Error(decode(result.stderr));
});
