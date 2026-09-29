import { assertEquals, assertMatch } from 'jsr:@std/assert@1';
import { WorkspaceBoundary } from './workspaceBoundary.ts';

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
    const boundary = new WorkspaceBoundary({ root, workspaceId: 'workspace-a' });
    assertEquals(boundary.resolve('workspace-a', '/workspace/linked/secret.txt'), null);
    assertEquals(boundary.resolve('workspace-a', '/workspace/linked/new.txt'), null);
  } finally {
    await Deno.remove(root, { recursive: true });
    await Deno.remove(outside, { recursive: true });
  }
});
