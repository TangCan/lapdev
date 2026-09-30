import { dirname, relative, resolve } from 'https://deno.land/std@0.224.0/path/mod.ts';

export interface WorkspaceBoundaryOptions {
  root: string;
  workspaceId: string;
  handlePrefix?: string;
}

/**
 * Converts an untrusted workspace handle into a path below one configured root.
 * Both existing targets and the nearest existing parent of new targets are
 * canonicalized, so a symlink cannot turn a valid-looking child into an escape.
 */
export class WorkspaceBoundary {
  readonly errorCode = 'WORKSPACE_INVALID_HANDLE';
  private readonly root: string;
  private readonly workspaceId: string;
  private readonly handlePrefix: string;

  constructor(options: WorkspaceBoundaryOptions) {
    this.root = resolve(options.root);
    this.workspaceId = options.workspaceId;
    this.handlePrefix = options.handlePrefix ?? '/workspace';
  }

  normalize(workspaceId: string, handle: string): string | null {
    const resolved = this.resolve(workspaceId, handle);
    if (!resolved) return null;
    const child = relative(this.root, resolved);
    return child ? `${this.handlePrefix}/${child.split('\\').join('/')}` : this.handlePrefix;
  }

  resolve(workspaceId: string, handle: string): string | null {
    if (workspaceId !== this.workspaceId || typeof handle !== 'string' || handle.includes('\0')) return null;
    const normalized = handle.replaceAll('\\', '/').replace(/\/+/g, '/');
    const relativeHandle = this.toRelativeHandle(normalized);
    if (relativeHandle === null || relativeHandle.split('/').some((part) => part === '..')) return null;

    const candidate = resolve(this.root, relativeHandle);
    if (!this.isBelowRoot(candidate)) return null;
    let parent = candidate;
    while (true) {
      try {
        // lstat distinguishes a dangling link from a genuinely absent path.
        Deno.lstatSync(parent);
        return this.isCanonicalPathInsideRoot(parent) ? candidate : null;
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) return null;
      }
      if (parent === this.root) return null;
      const next = dirname(parent);
      if (next === parent) return null;
      parent = next;
    }
  }

  private toRelativeHandle(handle: string): string | null {
    if (handle === this.handlePrefix) return '';
    if (handle.startsWith(`${this.handlePrefix}/`)) return handle.slice(this.handlePrefix.length + 1);
    if (handle.startsWith('/')) return null;
    return handle;
  }

  private isBelowRoot(candidate: string): boolean {
    return candidate === this.root || candidate.startsWith(`${this.root}/`);
  }

  private isCanonicalPathInsideRoot(path: string): boolean {
    try {
      const realRoot = Deno.realPathSync(this.root);
      const realPath = Deno.realPathSync(path);
      return realPath === realRoot || realPath.startsWith(`${realRoot}/`);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) return false;
      return false;
    }
  }
}
