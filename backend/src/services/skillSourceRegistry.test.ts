import { assertEquals } from 'jsr:@std/assert@1';
import { SkillSourceRegistry } from './skillSourceRegistry.ts';
import { SkillService } from './skillService.ts';
Deno.test('skill source registry preserves identity, priority and failed metadata', () => {
  const registry = new SkillSourceRegistry();
  registry.register({ id: 'codex', path: '.agents/skills', label: 'codex-primary', enabled: true, priority: 100, status: 'available' });
  registry.register({ id: 'legacy', path: '.lapdev/skills', label: 'lapdev-legacy', enabled: true, priority: 10, status: 'available' });
  registry.setStatus('legacy', 'failed', 'parse failure');
  assertEquals(registry.list()[0].id, 'codex');
  assertEquals(registry.list()[1].error, 'parse failure');
});

Deno.test('workspace skill load/list/match ignores runtime cwd and preserves source precedence', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'lapdev-skill-workspace-' });
  const cwd = Deno.cwd();
  const previous = new Map(['HOME', 'WORKSPACE_PATH'].map(key => [key, Deno.env.get(key)]));
  try {
    const workspace = `${temp}/workspace`;
    const runtime = `${temp}/runtime`;
    const home = `${temp}/home`;
    const content = (name: string, marker: string) => `---\nname: ${name}\ntrigger:\n  keywords: [workspace-probe]\n---\n${marker}\n`;
    for (const [path, name, marker] of [
      [`${workspace}/.agents/skills/probe/SKILL.md`, 'probe', 'primary'],
      [`${workspace}/.lapdev/skills/probe.skill.md`, 'probe', 'legacy'],
      [`${home}/.lapdev/skills/probe.skill.md`, 'probe', 'global'],
      [`${workspace}/.lapdev/skills/legacy.skill.md`, 'legacy', 'legacy-only'],
      [`${home}/.lapdev/skills/global.skill.md`, 'global', 'global-only'],
      [`${runtime}/.agents/skills/runtime/SKILL.md`, 'runtime', 'cwd-only'],
    ]) {
      await Deno.mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
      await Deno.writeTextFile(path, content(name, marker));
    }
    Deno.chdir(runtime);
    Deno.env.set('HOME', home);
    Deno.env.set('WORKSPACE_PATH', workspace);
    const service = new SkillService();
    const loaded = service.loadSkills();
    assertEquals(loaded.skills.map(skill => skill.name).sort(), ['global', 'legacy', 'probe']);
    assertEquals(service.getSkillByName('probe')?.source, 'codex-primary');
    assertEquals(service.getSkillByName('probe')?.content, 'primary');
    assertEquals(service.getSkillByName('legacy')?.source, 'lapdev-legacy');
    assertEquals(service.getSkillByName('global')?.source, 'lapdev-global');
    assertEquals(service.getSkills(), loaded.skills);
    assertEquals(service.matchSkills('workspace-probe').length, 3);
    Deno.env.delete('WORKSPACE_PATH');
    const fallback = new SkillService();
    assertEquals(fallback.loadSkills().skills.some(skill => skill.name === 'runtime'), true);
    assertEquals(fallback.getSkillByName('probe')?.source, 'lapdev-global');
  } finally {
    Deno.chdir(cwd);
    for (const [key, value] of previous) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
    await Deno.remove(temp, { recursive: true });
  }
});

Deno.test('project skill canonical boundaries reject external and dangling links at every level', async () => {
  const temp = await Deno.makeTempDir({ prefix: 'skill-boundary-' });
  const previous = new Map(['HOME', 'WORKSPACE_PATH'].map(key => [key, Deno.env.get(key)]));
  const content = (name: string) => `---\nname: ${name}\ntrigger:\n  keywords: [boundary-probe]\n---\n${name}\n`;
  try {
    const outside = `${temp}/outside`;
    const home = `${temp}/home`;
    await Deno.mkdir(outside);
    await Deno.writeTextFile(`${outside}/SKILL.md`, content('outside'));
    await Deno.writeTextFile(`${outside}/outside.skill.md`, content('outside-legacy'));
    await Deno.mkdir(`${home}/.lapdev/skills`, { recursive: true });
    await Deno.writeTextFile(`${home}/.lapdev/skills/global.skill.md`, content('global-outside-project'));
    Deno.env.set('HOME', home);
    for (const source of ['.agents/skills', '.lapdev/skills']) {
      for (const level of ['root', 'directory', 'file']) {
        if (source === '.lapdev/skills' && level === 'directory') continue;
        for (const target of [outside, `${temp}/missing`]) {
          const workspace = await Deno.makeTempDir({ dir: temp, prefix: 'workspace-' });
          const sourcePath = `${workspace}/${source}`;
          await Deno.mkdir(sourcePath.slice(0, sourcePath.lastIndexOf('/')), { recursive: true });
          if (level === 'root') {
            await Deno.symlink(target, sourcePath);
          } else {
            await Deno.mkdir(sourcePath);
            if (level === 'directory') await Deno.symlink(target, `${sourcePath}/probe`);
            else if (source === '.agents/skills') {
              await Deno.mkdir(`${sourcePath}/probe`);
              await Deno.symlink(`${target}/SKILL.md`, `${sourcePath}/probe/SKILL.md`);
            } else await Deno.symlink(`${target}/outside.skill.md`, `${sourcePath}/probe.skill.md`);
          }
          Deno.env.set('WORKSPACE_PATH', workspace);
          const service = new SkillService();
          const loaded = service.loadSkills();
          assertEquals(loaded.skills.map(skill => skill.source), ['lapdev-global']);
          assertEquals(service.getSkills(), loaded.skills);
          assertEquals(service.matchSkills('boundary-probe').map(skill => skill.source), ['lapdev-global']);
          assertEquals(loaded.diagnostics?.some(diagnostic => diagnostic.source === (source === '.agents/skills' ? 'codex-primary' : 'lapdev-legacy') && diagnostic.severity === 'error'), true);
        }
      }
    }
    const workspace = `${temp}/valid`;
    await Deno.mkdir(`${workspace}/content/probe`, { recursive: true });
    await Deno.writeTextFile(`${workspace}/content/probe/SKILL.md`, content('internal'));
    await Deno.writeTextFile(`${workspace}/content/internal.skill.md`, content('internal-legacy'));
    await Deno.mkdir(`${workspace}/.agents`, { recursive: true });
    await Deno.mkdir(`${workspace}/.lapdev`, { recursive: true });
    await Deno.symlink(`${workspace}/content`, `${workspace}/.agents/skills`);
    await Deno.symlink(`${workspace}/content`, `${workspace}/.lapdev/skills`);
    await Deno.symlink(`${workspace}/content/internal.skill.md`, `${workspace}/content/linked.skill.md`);
    await Deno.symlink(`${workspace}/content/probe`, `${workspace}/content/linked-directory`);
    await Deno.mkdir(`${workspace}/content/linked-file`);
    await Deno.symlink(`${workspace}/content/probe/SKILL.md`, `${workspace}/content/linked-file/SKILL.md`);
    await Deno.symlink(workspace, `${temp}/canonical-root`);
    Deno.env.set('WORKSPACE_PATH', `${temp}/canonical-root`);
    const service = new SkillService();
    assertEquals(service.loadSkills().skills.map(skill => skill.name).sort(), ['global-outside-project', 'internal', 'internal-legacy']);
    assertEquals(service.matchSkills('boundary-probe').length, 3);
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) Deno.env.delete(key); else Deno.env.set(key, value);
    }
    await Deno.remove(temp, { recursive: true });
  }
});
