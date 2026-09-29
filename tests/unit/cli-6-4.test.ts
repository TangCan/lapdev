const cli = new URL('../../cli/bin/lapdev.js', import.meta.url).pathname;

function decode(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes);
}

Deno.test('[P0] 6.4-AC1: non-GitHub or non-HTTPS manifest sources are rejected', async () => {
  const home = await Deno.makeTempDir({ prefix: 'lapdev-source-policy-' });
  const result = await new Deno.Command('node', {
    args: [cli, 'web', '--manifest-url', 'http://127.0.0.1:9/manifest.json', '--no-open'],
    stdout: 'piped',
    stderr: 'piped',
    env: { ...Deno.env.toObject(), HOME: home },
  }).output();
  if (result.code !== 3 || !decode(result.stderr).includes('allowed GitHub HTTPS source')) throw new Error(decode(result.stderr));
});
