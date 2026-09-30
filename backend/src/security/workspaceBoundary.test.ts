import { assertEquals, assertMatch } from 'jsr:@std/assert@1';
import { WorkspaceBoundary } from './workspaceBoundary.ts';

Deno.test('内部精确路径保留字面名称并验证存在性、身份和 canonical 边界', async () => {
  const temp = await Deno.makeTempDir();
  try {
    const root = `${temp}/root`;
    await Deno.mkdir(`${root}/a`, { recursive: true });
    await Deno.writeTextFile(`${root}/a/b`, 'separator');
    await Deno.writeTextFile(`${root}/a\\b`, 'literal');
    await Deno.writeTextFile(`${temp}/outside`, 'outside');
    await Deno.symlink(root, `${temp}/alias`);
    await Deno.symlink(`${root}/a\\b`, `${root}/inside`);
    await Deno.symlink(`${temp}/outside`, `${root}/escape`);
    await Deno.symlink(`${root}/missing`, `${root}/dangling`);
    for (const configuredRoot of [root, `${temp}/alias`]) {
      const boundary = new WorkspaceBoundary({ root: configuredRoot, workspaceId: 'a' });
      assertEquals(boundary.validateExistingPath('a', `${configuredRoot}/a\\b`), `${root}/a\\b`);
      assertEquals(boundary.validateExistingPath('a', `${configuredRoot}/inside`), `${root}/a\\b`);
      assertEquals(boundary.validateExistingPath('a', configuredRoot), root);
      for (const child of ['missing', 'escape', 'dangling']) {
        assertEquals(boundary.validateExistingPath('a', `${configuredRoot}/${child}`), null);
      }
      assertEquals(boundary.validateExistingPath('b', configuredRoot), null);
      assertEquals(boundary.validateExistingPath('a', `${temp}/outside`), null);
      assertEquals(boundary.resolve('a', '/workspace/a\\b'), `${configuredRoot}/a/b`);
      assertEquals(boundary.resolve('a', `${configuredRoot}/a\\b`), null);
    }
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});

Deno.test('normalizes only the assigned workspace handle and relative child paths', async () => {
  const root = await Deno.makeTempDir({ prefix: 'lapdev-workspace-' });
  try {
    const boundary = new WorkspaceBoundary({ root, workspaceId: 'workspace-a' });
    assertEquals(boundary.resolve('workspace-a', '/workspace'), root);
    assertEquals(boundary.resolve('workspace-a', '/workspace/src/main.ts'), `${root}/src/main.ts`);
    assertEquals(boundary.normalize('workspace-a', 'src/main.ts'), '/workspace/src/main.ts');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('rejects traversal, host absolute paths and another workspace before I/O', async () => {
  const root = await Deno.makeTempDir({ prefix: 'lapdev-workspace-' });
  try {
    const boundary = new WorkspaceBoundary({ root, workspaceId: 'workspace-a' });
    assertEquals(boundary.resolve('workspace-a', '/workspace/../outside'), null);
    assertEquals(boundary.resolve('workspace-a', '/etc/passwd'), null);
    assertEquals(boundary.resolve('workspace-b', '/workspace/file.ts'), null);
    assertMatch(boundary.errorCode, /^WORKSPACE_/);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('rejects existing and new paths that escape through symlinks', async () => {
  const root = await Deno.makeTempDir({ prefix: 'lapdev-workspace-' });
  const outside = await Deno.makeTempDir({ prefix: 'lapdev-outside-' });
  try {
    await Deno.writeTextFile(`${outside}/secret.txt`, 'secret');
    await Deno.symlink(outside, `${root}/linked`);
    await Deno.symlink(`${outside}/secret.txt`, `${root}/external-file`);
    await Deno.symlink(`${outside}/missing`, `${root}/dangling`);
    const boundary = new WorkspaceBoundary({ root, workspaceId: 'workspace-a' });
    assertEquals(boundary.resolve('workspace-a', '/workspace/linked/secret.txt'), null);
    assertEquals(boundary.resolve('workspace-a', '/workspace/linked/new.txt'), null);
    assertEquals(boundary.resolve('workspace-a', '/workspace/linked'), null);
    assertEquals(boundary.resolve('workspace-a', '/workspace/external-file'), null);
    assertEquals(boundary.resolve('workspace-a', '/workspace/dangling'), null);
    assertEquals(boundary.resolve('workspace-a', '/workspace/dangling/new.txt'), null);
  } finally {
    await Deno.remove(root, { recursive: true });
    await Deno.remove(outside, { recursive: true });
  }
});

Deno.test('accepts internal links and canonicalizes a symlinked workspace root', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'lapdev-canonical-root-' });
  try {
    const root = `${temp}/real`;
    await Deno.mkdir(`${root}/directory`, { recursive: true });
    await Deno.writeTextFile(`${root}/directory/file.txt`, 'inside');
    await Deno.symlink(root, `${temp}/alias`);
    await Deno.symlink(`${root}/directory`, `${root}/internal-directory`);
    await Deno.symlink(`${root}/directory/file.txt`, `${root}/internal-file`);
    for (const configuredRoot of [root, `${temp}/alias`]) {
      const boundary = new WorkspaceBoundary({ root: configuredRoot, workspaceId: 'workspace-a' });
      for (const child of ['', '/internal-file', '/internal-directory', '/internal-directory/file.txt', '/internal-directory/new/deep.txt', '/new/deep.txt']) {
        assertEquals(boundary.resolve('workspace-a', `/workspace${child}`), `${configuredRoot}${child}`);
      }
    }
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});
