const root = new URL('../..', import.meta.url).pathname;

Deno.test('[P0] 6.5: release workflow gates publishing on protected version tags', async () => {
  const workflow = await Deno.readTextFile(`${root}/.github/workflows/runtime-release.yml`);
  for (const value of ["tags: ['v*.*.*']", 'if: startsWith(github.ref, \'refs/tags/v\')', 'actions/upload-artifact@v4', 'gh release create', 'gh release upload']) {
    if (!workflow.includes(value)) throw new Error(`workflow contract missing ${value}`);
  }
  if (workflow.includes('--clobber')) throw new Error('release workflow must not silently replace immutable assets');
});

Deno.test('[P0] 6.5: release manifest scripts recompute archive size and SHA-256', async () => {
  const script = await Deno.readTextFile(`${root}/scripts/generate-runtime-release-manifest.mjs`);
  const verifier = await Deno.readTextFile(`${root}/scripts/verify-runtime-release.mjs`);
  for (const text of [script, verifier]) {
    if (!text.includes('createHash') || !text.includes('statSync')) throw new Error('release integrity contract is incomplete');
  }
});

Deno.test('[P0] 6.6: npm publisher metadata and toolchain meet Trusted Publishing requirements', async () => {
  const workflow = await Deno.readTextFile(`${root}/.github/workflows/runtime-release.yml`);
  const cliPackage = JSON.parse(await Deno.readTextFile(`${root}/cli/package.json`));
  if (cliPackage.repository?.url !== 'https://github.com/TangCan/lapdev.git') {
    throw new Error('npm package repository must match the publishing GitHub repository');
  }
  if (!workflow.includes('node-version: 24') || !workflow.includes('npm@11.5.1')) {
    throw new Error('npm publishing toolchain does not meet Trusted Publishing minimum versions');
  }
  if (!workflow.includes('id-token: write') || !workflow.includes('node scripts/publish-npm-release.mjs')) {
    throw new Error('npm publishing must use GitHub OIDC');
  }
});
