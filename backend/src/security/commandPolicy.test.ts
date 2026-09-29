import { assertEquals } from 'jsr:@std/assert@1';
import { CommandPolicy } from './commandPolicy.ts';

const base = { executable: '/usr/bin/git', args: ['status'], cwd: '/workspace', env: {}, interactive: false };

Deno.test('remote command policy allows only fixed Git/LSP entries', () => {
  const policy = new CommandPolicy({ profile: 'remote-shared', workspaceRoot: '/workspace' });
  assertEquals(policy.evaluate(base).allowed, true);
  assertEquals(policy.evaluate({ ...base, executable: '/bin/bash', args: ['-c', 'id'] }).allowed, false);
  assertEquals(policy.evaluate({ ...base, args: ['status', '&&', 'cat', '/etc/passwd'] }).allowed, false);
});

Deno.test('remote command policy denies escapes, secret environments, and interactive mode', () => {
  const policy = new CommandPolicy({ profile: 'remote-shared', workspaceRoot: '/workspace' });
  assertEquals(policy.evaluate({ ...base, cwd: '/tmp' }).allowed, false);
  assertEquals(policy.evaluate({ ...base, env: { SECRET_TOKEN: 'not logged' } }).allowed, false);
  assertEquals(policy.evaluate({ ...base, interactive: true }).allowed, false);
});
