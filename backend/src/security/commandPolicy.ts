import { resolve } from 'https://deno.land/std@0.224.0/path/mod.ts';

export interface CommandRequest {
  executable: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  interactive: boolean;
}

export interface CommandDecision {
  allowed: boolean;
  code: 'ALLOWED' | 'EXECUTABLE_DENIED' | 'ARGUMENTS_DENIED' | 'CWD_DENIED' | 'ENVIRONMENT_DENIED' | 'INTERACTIVE_DENIED';
  reason: string;
}

export interface CommandPolicyOptions {
  profile: 'local-trusted' | 'remote-shared';
  workspaceRoot: string;
}

const REMOTE_EXECUTABLES = new Set(['git', '/usr/bin/git', '/usr/local/bin/git', 'typescript-language-server', '/usr/local/bin/typescript-language-server']);
const SAFE_ENVIRONMENT = new Set(['LANG', 'LC_ALL', 'PATH', 'TERM']);
const SHELL_TOKENS = /(?:&&|\|\||[;|]|\$\(|`|\n|\r)/;

export class CommandPolicy {
  private readonly profile: CommandPolicyOptions['profile'];
  private readonly workspaceRoot: string;

  constructor(options: CommandPolicyOptions) {
    this.profile = options.profile;
    this.workspaceRoot = resolve(options.workspaceRoot);
  }

  evaluate(request: CommandRequest): CommandDecision {
    if (this.profile !== 'remote-shared') return { allowed: true, code: 'ALLOWED', reason: 'local-trusted profile' };
    if (request.interactive) return { allowed: false, code: 'INTERACTIVE_DENIED', reason: 'interactive execution is disabled remotely' };
    if (!REMOTE_EXECUTABLES.has(request.executable)) return { allowed: false, code: 'EXECUTABLE_DENIED', reason: 'executable is not in the remote catalog' };
    const cwd = resolve(request.cwd);
    if (cwd !== this.workspaceRoot && !cwd.startsWith(`${this.workspaceRoot}/`)) return { allowed: false, code: 'CWD_DENIED', reason: 'cwd is outside the workspace' };
    if (request.args.some((arg) => SHELL_TOKENS.test(arg) || arg === '-c')) return { allowed: false, code: 'ARGUMENTS_DENIED', reason: 'shell composition is not allowed' };
    if (Object.keys(request.env).some((key) => !SAFE_ENVIRONMENT.has(key))) return { allowed: false, code: 'ENVIRONMENT_DENIED', reason: 'environment key is not approved' };
    return { allowed: true, code: 'ALLOWED', reason: 'matched remote command policy' };
  }
}
