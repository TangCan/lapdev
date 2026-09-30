import { assert, assertEquals } from 'jsr:@std/assert@1';
import { WorkspaceBoundary } from '../security/workspaceBoundary.ts';
import type { FileInfo } from '../types/file.ts';

Deno.test('递归文件树边界矩阵及普通 I/O 错误', async (t) => {
  const temp = await Deno.makeTempDir({ prefix: 'lapdev-tree-' });
  const savedEnv = [Deno.env.get('WORKSPACE_PATH'), Deno.env.get('WORKSPACE_ID')];
  const originals = { stat: Deno.stat, readDir: Deno.readDir, readTextFile: Deno.readTextFile, realPathSync: Deno.realPathSync };
  const normalize = WorkspaceBoundary.prototype.normalize;
  try {
    const root = `${temp}/root`;
    const outside = `${temp}/root-other`;
    await Deno.mkdir(`${root}/dir`, { recursive: true });
    await Deno.mkdir(outside);
    await Deno.writeTextFile(`${outside}/secret`, 'external-metadata');
    await Deno.writeTextFile(`${outside}/rules`, 'keep.txt\n');
    await Deno.writeTextFile(`${root}/keep.txt`, 'keep');
    await Deno.writeTextFile(`${root}/.hidden`, 'hidden');
    await Deno.writeTextFile(`${root}/dir/file`, 'inside');
    await Deno.writeTextFile(`${root}/dir/ignored`, 'ignored');
    await Deno.writeTextFile(`${root}/rules`, 'ignored\n');
    await Deno.symlink(`${root}/rules`, `${root}/dir/.gitignore`);
    await Deno.symlink(`${outside}/rules`, `${root}/.gitignore`);
    await Deno.symlink(outside, `${root}/dir/external-dir`);
    await Deno.symlink(`${outside}/secret`, `${root}/dir/external-file`);
    await Deno.symlink(`${root}/missing`, `${root}/dir/dangling`);
    await Deno.writeTextFile(`${root}/dir/unresolvable`, 'synthetic');
    await Deno.symlink(root, `${root}/dir/cycle`);
    await Deno.symlink(`${root}/dir`, `${root}/alias-one`);
    await Deno.symlink(`${root}/dir`, `${root}/alias-two`);
    await Deno.symlink(`${root}/dir/file`, `${root}/internal-file`);
    await Deno.mkdir(`${root}/a`);
    await Deno.mkdir(`${root}/a/external-rules`);
    await Deno.writeTextFile(`${root}/a/external-rules/keep.txt`, 'keep');
    await Deno.symlink(`${outside}/rules`, `${root}/a/external-rules/.gitignore`);
    await Deno.symlink(`${root}/a/external-rules`, `${root}/rules-alias`);
    await Deno.writeTextFile(`${root}/a/b`, 'separator');
    await Deno.writeTextFile(`${root}/a\\b`, 'literal-file');
    await Deno.mkdir(`${root}/a\\dir`);
    await Deno.writeTextFile(`${root}/a\\dir/child`, 'literal-child');
    await Deno.writeTextFile(`${root}/a\\dir/ignored`, 'ignored');
    await Deno.writeTextFile(`${root}/a\\dir/.gitignore`, 'ignored\n');
    await Deno.mkdir(`${root}/a/dir`);
    await Deno.writeTextFile(`${root}/a/dir/other`, 'separator-child');
    let deep = root;
    for (let i = 0; i < 22; i++) { deep += '/deep'; await Deno.mkdir(deep); }
    await Deno.symlink(root, `${temp}/alias`);

    for (const configuredRoot of [root, `${temp}/alias`]) {
      await t.step(configuredRoot === root ? '真实 root' : '链接 root', async () => {
        Deno.env.set('WORKSPACE_PATH', configuredRoot);
        Deno.env.set('WORKSPACE_ID', 'tree-test');
        const service: typeof import('./fileService.ts') = await import(`./fileService.ts?root=${encodeURIComponent(configuredRoot)}`);
        const reads: string[] = [];
        const externalRules = new Set([
          `${configuredRoot}/.gitignore`,
          `${configuredRoot}/a/external-rules/.gitignore`,
          `${configuredRoot}/rules-alias/.gitignore`,
        ]);
        const observe = (path: string | URL) => {
          const value = String(path);
          reads.push(value);
          assert(!value.startsWith(outside), `外部目标读取: ${value}`);
          assert(!/\/(external-dir|external-file|dangling|unresolvable)(\/|$)/.test(value), `不安全子项读取: ${value}`);
          assert(!externalRules.has(value), '外部规则读取');
        };
        Deno.stat = ((path: string | URL) => { observe(path); return originals.stat(path); }) as typeof Deno.stat;
        Deno.readDir = ((path: string | URL) => { observe(path); return originals.readDir(path); }) as typeof Deno.readDir;
        Deno.readTextFile = ((path: string | URL, options?: Deno.ReadFileOptions) => { observe(path); return originals.readTextFile(path, options); }) as typeof Deno.readTextFile;
        Deno.realPathSync = ((path: string | URL) => {
          if (String(path).endsWith('/unresolvable')) throw new Deno.errors.PermissionDenied('synthetic');
          return originals.realPathSync(path);
        }) as typeof Deno.realPathSync;
        try {
          const result = await service.getFileTree('/workspace', 100);
          assertEquals(result.status, 'success');
          assert(result.data);
          const tree = result.data;
          const child = (node: FileInfo, name: string) => { const found = node.children?.find(item => item.name === name); assert(found, name); return found; };
          assertEquals(tree.path, '/workspace');
          assert(!JSON.stringify(tree).includes(temp));
          assert(!tree.children?.some(item => item.name.startsWith('.')));
          assertEquals(child(tree, 'keep.txt').size, 4);
          assert(child(tree, 'keep.txt').lastModified);
          assertEquals(child(tree, 'internal-file').size, 6);
          for (const name of ['dir', 'alias-one', 'alias-two']) {
            const branch = child(tree, name);
            assertEquals(branch.children?.map(item => item.name), ['cycle', 'file']);
            assertEquals(child(branch, 'cycle').children, []);
            assertEquals(child(branch, 'file').path, `/workspace/${name}/file`);
          }
          assertEquals(child(tree, 'a\\b').size, 12);
          assertEquals(child(tree, 'a\\b').path, '/workspace/a\\b');
          assertEquals(child(child(tree, 'a\\dir'), 'child').path, '/workspace/a\\dir/child');
          assertEquals(child(tree, 'a\\dir').children?.map(item => item.name), ['child']);
          assertEquals(child(child(tree, 'a'), 'b').size, 9);
          assertEquals(child(child(child(tree, 'a'), 'dir'), 'other').size, 15);
          const sorted = [...tree.children!].sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1);
          assertEquals(tree.children, sorted);
          let node = tree;
          for (let i = 0; i < 20; i++) node = child(node, 'deep');
          assertEquals(node.children, []);
          for (const [branch, logicalPath] of [
            [child(child(tree, 'a'), 'external-rules'), '/workspace/a/external-rules'],
            [child(tree, 'rules-alias'), '/workspace/rules-alias'],
          ] as const) {
            assertEquals(branch.children?.map(item => item.name), ['keep.txt']);
            assertEquals(child(branch, 'keep.txt').path, `${logicalPath}/keep.txt`);
          }
          for (const [handle, logicalPath, childName] of [
            ['/workspace/a/external-rules', '/workspace/a/external-rules', 'keep.txt'],
            ['/workspace/rules-alias', '/workspace/rules-alias', 'keep.txt'],
            ['/workspace/alias-one', '/workspace/alias-one', 'file'],
            ['a/dir', '/workspace/a/dir', 'other'],
          ]) {
            const subtree = await service.getFileTree(handle, 1);
            assertEquals(subtree.status, 'success');
            assert(subtree.data);
            assertEquals(subtree.data.path, logicalPath);
            assertEquals(child(subtree.data, childName).path, `${logicalPath}/${childName}`);
            for (const item of subtree.data.children!) {
              assertEquals(item.path, `${logicalPath}/${item.name}`);
            }
          }
          for (const handle of ['/workspace/internal-file', 'dir/file']) {
            const file = await service.getFileTree(handle);
            assertEquals(file.status, 'success');
            assertEquals(file.data?.type, 'file');
            assertEquals(file.data?.path, handle.startsWith('/workspace/') ? handle : `/workspace/${handle}`);
            assertEquals(file.data?.size, 6);
          }
          // 最终断言捕获被可选规则 catch 吞掉的违规尝试。
          assert(!reads.some(value => value.startsWith(outside) || /\/(external-dir|external-file|dangling|unresolvable)(\/|$)/.test(value) || externalRules.has(value)));
          assert(reads.includes(`${configuredRoot}/alias-one/.gitignore`));
          reads.length = 0;
          const zero = await service.getFileTree('/workspace', 0);
          assertEquals(zero.data?.children, []);
          assertEquals(reads, [configuredRoot, configuredRoot]);
          const one = await service.getFileTree('/workspace', 1);
          assertEquals(child(one.data!, 'dir').children, []);
          for (const handle of ['/workspace/dir/external-dir', '/workspace/../root-other', outside]) {
            assertEquals(await service.getFileTree(handle), { status: 'error', message: 'Invalid workspace path' });
          }
          Deno.stat = (async (path: string | URL) => {
            const info = await originals.stat(path);
            WorkspaceBoundary.prototype.normalize = () => null;
            return info;
          }) as typeof Deno.stat;
          assertEquals(await service.getFileTree('/workspace'), { status: 'error', message: 'Invalid workspace path' });
          WorkspaceBoundary.prototype.normalize = normalize;
          Deno.stat = ((path: string | URL) => {
            if (String(path) === `${configuredRoot}/keep.txt`) return Promise.reject(new Error('stat failed'));
            return originals.stat(path);
          }) as typeof Deno.stat;
          assertEquals(await service.getFileTree('/workspace'), { status: 'error', message: 'stat failed' });
          Deno.stat = originals.stat;
          Deno.readDir = (() => { throw new Error('readDir creation failed'); }) as typeof Deno.readDir;
          assertEquals(await service.getFileTree('/workspace'), { status: 'error', message: 'readDir creation failed' });
          Deno.readDir = (async function* () { yield { name: 'keep.txt', isFile: true, isDirectory: false, isSymlink: false }; throw new Error('readDir iteration failed'); }) as typeof Deno.readDir;
          assertEquals(await service.getFileTree('/workspace'), { status: 'error', message: 'readDir iteration failed' });
          for (const failure of ['creation', 'iteration']) {
            let completedBranch = false;
            let readNestedChild = false;
            Deno.stat = ((path: string | URL) => {
              if (String(path) === `${configuredRoot}/dir/file`) readNestedChild = true;
              return originals.stat(path);
            }) as typeof Deno.stat;
            Deno.readDir = ((path: string | URL) => {
              if (String(path) === `${configuredRoot}/dir`) {
                assert(completedBranch, '嵌套失败前已完成其他合法分支');
                if (failure === 'creation') throw new Error('nested readDir creation failed');
                return (async function* () {
                  yield { name: 'file', isFile: true, isDirectory: false, isSymlink: false };
                  throw new Error('nested readDir iteration failed');
                })();
              }
              return (async function* () {
                if (String(path) === configuredRoot) {
                  for (const name of ['a', 'dir']) yield { name, isFile: false, isDirectory: true, isSymlink: false };
                } else {
                  yield* originals.readDir(path);
                  if (String(path) === `${configuredRoot}/a`) completedBranch = true;
                }
              })();
            }) as typeof Deno.readDir;
            const failed = await service.getFileTree('/workspace');
            assertEquals(failed, { status: 'error', message: `nested readDir ${failure} failed` });
            assertEquals(failed.data, undefined);
            assert(completedBranch);
            assertEquals(readNestedChild, failure === 'iteration');
          }
        } finally {
          Object.assign(Deno, originals);
          WorkspaceBoundary.prototype.normalize = normalize;
        }
      });
    }
  } finally {
    Object.assign(Deno, originals);
    WorkspaceBoundary.prototype.normalize = normalize;
    for (const [i, key] of ['WORKSPACE_PATH', 'WORKSPACE_ID'].entries()) {
      const value = savedEnv[i];
      if (value === undefined) Deno.env.delete(key); else Deno.env.set(key, value);
    }
    await Deno.remove(temp, { recursive: true });
  }
});
