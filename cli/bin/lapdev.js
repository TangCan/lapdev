#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { homedir, platform, arch } from 'node:os';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const PACKAGE_FILE = join(CLI_DIR, 'package.json');
const PACKAGE = JSON.parse(readFileSync(PACKAGE_FILE, 'utf8'));
const EXIT_USAGE = 2;
const EXIT_RUNTIME = 3;

function usage() {
  console.error('Usage: lapdev <web|doctor|version> [options]');
  console.error('  web [--runtime-dir DIR] [--workspace DIR] [--port PORT] [--no-open]');
  console.error('  doctor [--runtime-dir DIR]');
  console.error('  version');
}

function fail(message, code = EXIT_RUNTIME) {
  console.error(`lapdev: ${message}`);
  process.exitCode = code;
  return code;
}

function parseArgs(argv) {
  const [command = '', ...rest] = argv;
  const options = { command, noOpen: false };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--no-open') {
      options.noOpen = true;
    } else if (arg === '--runtime-dir' || arg === '--workspace' || arg === '--port') {
      const value = rest[++i];
      if (!value || value.startsWith('--')) return { error: `${arg} requires a value` };
      const optionName = arg === '--runtime-dir' ? 'runtimeDir' : arg === '--workspace' ? 'workspace' : 'port';
      options[optionName] = value;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      return { error: `unknown option: ${arg}` };
    }
  }
  return options;
}

function loadManifest(runtimeDir) {
  for (const name of ['manifest.json', 'runtime.json']) {
    const path = join(runtimeDir, name);
    if (!existsSync(path)) continue;
    try {
      return { path: realpathSync(path), value: JSON.parse(readFileSync(path, 'utf8')) };
    } catch {
      return { error: `${name} is not valid JSON` };
    }
  }
  return { error: 'runtime manifest is missing' };
}

function within(root, candidate) {
  const rel = relative(root, candidate);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${normalize('/')}`) && !rel.startsWith('../') && !rel.startsWith('..\\') && !rel.includes('\0'));
}

function validateRuntime(runtimeDir) {
  const requestedRoot = resolve(runtimeDir);
  if (!existsSync(requestedRoot)) return { error: 'runtime directory does not exist' };
  const root = realpathSync(requestedRoot);
  const manifest = loadManifest(root);
  if (manifest.error) return { error: manifest.error };
  if (!within(root, manifest.path)) return { error: 'runtime manifest resolves outside the runtime directory' };
  if (!manifest.value || typeof manifest.value !== 'object' || typeof manifest.value.version !== 'string') {
    return { error: 'runtime manifest must declare a version' };
  }
  const launcherName = manifest.value.launcher || 'bin/lapdev-runtime';
  const launcher = resolve(root, launcherName);
  if (!within(root, launcher) || !existsSync(launcher)) return { error: 'runtime launcher is missing or outside the runtime directory' };
  let realLauncher;
  try {
    realLauncher = realpathSync(launcher);
    if (!within(root, realLauncher) || !statSync(realLauncher).isFile()) {
      return { error: 'runtime launcher is not a regular file inside the runtime directory' };
    }
  } catch {
    return { error: 'runtime launcher cannot be inspected' };
  }
  return { root, manifest: manifest.value, launcher: realLauncher };
}

function runtimeDirFrom(options) {
  return options.runtimeDir || process.env.LAPDEV_RUNTIME_DIR || join(homedir(), '.cache', 'lapdev', PACKAGE.version, `${platform()}-${arch()}`);
}

function doctor(options) {
  const runtimeDir = runtimeDirFrom(options);
  const checks = [
    ['node', Number(process.versions.node.split('.')[0]) >= 18],
    ['platform', Boolean(platform() && arch())],
    ['runtime', Boolean(validateRuntime(runtimeDir).launcher)],
    ['cache', Boolean(join(homedir(), '.cache', 'lapdev'))],
  ];
  for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'WARN'} ${name}`);
  return checks.some(([, ok]) => !ok) ? EXIT_RUNTIME : 0;
}

function web(options) {
  const runtime = validateRuntime(runtimeDirFrom(options));
  if (runtime.error) return fail(runtime.error);
  const port = options.port || process.env.PORT || '3333';
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) return fail('port must be between 1 and 65535', EXIT_USAGE);
  const child = spawn(runtime.launcher, [], {
    cwd: runtime.root,
    env: { ...process.env, PORT: port, ...(options.workspace ? { WORKSPACE_PATH: resolve(options.workspace) } : {}) },
    stdio: 'inherit',
  });
  child.once('error', (error) => fail(`runtime could not start: ${error.message}`));
  child.once('exit', (code, signal) => {
    if (signal) process.exitCode = 1;
    else process.exitCode = code ?? 1;
  });
  console.log(`Lapdev runtime started at http://127.0.0.1:${port}`);
  if (!options.noOpen) console.log('Browser opening is disabled until a desktop opener is configured.');
  return 0;
}

const rawArgs = process.argv.slice(2);
if (rawArgs.length === 1 && (rawArgs[0] === '--help' || rawArgs[0] === '-h')) {
  usage();
  process.exit(0);
}
const options = parseArgs(rawArgs);
if (options.error) {
  fail(options.error, EXIT_USAGE);
  usage();
} else if (options.help || !options.command) {
  usage();
} else if (options.command === 'version') {
  console.log(PACKAGE.version);
} else if (options.command === 'doctor') {
  process.exitCode = doctor(options);
} else if (options.command === 'web') {
  process.exitCode = web(options);
} else {
  fail(`unknown command: ${options.command}`, EXIT_USAGE);
  usage();
}
