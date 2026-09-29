#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir, platform, arch } from 'node:os';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const PACKAGE_FILE = join(CLI_DIR, 'package.json');
const PACKAGE = JSON.parse(readFileSync(PACKAGE_FILE, 'utf8'));
const EXIT_USAGE = 2;
const EXIT_RUNTIME = 3;

function usage() {
  console.error('Usage: lapdev <web|doctor|version> [options]');
  console.error('  web [--runtime-dir DIR] [--workspace DIR] [--port PORT] [--no-open] [--offline] [--manifest-url URL]');
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
  const options = { command, noOpen: false, offline: false };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--no-open') {
      options.noOpen = true;
    } else if (arg === '--offline') {
      options.offline = true;
    } else if (arg === '--runtime-dir' || arg === '--workspace' || arg === '--port' || arg === '--manifest-url') {
      const value = rest[++i];
      if (!value || value.startsWith('--')) return { error: `${arg} requires a value` };
      const optionName = arg === '--runtime-dir' ? 'runtimeDir'
        : arg === '--workspace' ? 'workspace'
          : arg === '--port' ? 'port' : 'manifestUrl';
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

function targetForCurrentPlatform() {
  const key = `${platform()}-${arch()}`;
  const targets = {
    'linux-x64': 'x86_64-unknown-linux-gnu',
    'darwin-arm64': 'aarch64-apple-darwin',
  };
  return targets[key] ? { platform: platform(), arch: arch(), target: targets[key] } : null;
}

function validateManifest(value) {
  if (!value || typeof value !== 'object') return 'runtime manifest must be an object';
  const entries = Array.isArray(value.runtimes) ? value.runtimes : [value];
  const current = targetForCurrentPlatform();
  if (!current) return `unsupported platform: ${platform()}-${arch()}`;
  const entry = entries.find((candidate) => candidate?.version === PACKAGE.version
    && candidate.platform === current.platform
    && candidate.arch === current.arch);
  if (!entry) return `runtime manifest has no entry for ${PACKAGE.version}/${current.platform}-${current.arch}`;
  for (const field of ['version', 'platform', 'arch', 'target', 'asset', 'size', 'sha256', 'commit']) {
    if (typeof entry[field] !== 'string' || entry[field].length === 0) return `runtime manifest field is missing: ${field}`;
  }
  if (entry.target !== current.target) return `unsupported runtime target: ${entry.target}`;
  if (!/^\d+$/.test(entry.size) || !/^[a-f0-9]{64}$/i.test(entry.sha256)) {
    return 'runtime manifest size or sha256 is invalid';
  }
  return null;
}

function validateLocalAsset(root, manifest) {
  const asset = manifest.asset;
  if (/^[a-z]+:\/\//i.test(asset)) return null;
  const assetPath = resolve(root, asset);
  if (!within(root, assetPath) || !existsSync(assetPath)) return 'runtime asset is missing or outside the runtime directory';
  try {
    const realAssetPath = realpathSync(assetPath);
    if (!within(root, realAssetPath)) return 'runtime asset resolves outside the runtime directory';
    const info = statSync(realAssetPath);
    if (!info.isFile()) return 'runtime asset is not a regular file';
    const observed = createHash('sha256').update(readFileSync(realAssetPath)).digest('hex');
    if (String(info.size) !== manifest.size || observed !== manifest.sha256.toLowerCase()) {
      return `runtime asset integrity mismatch (expected ${manifest.sha256}/${manifest.size}, observed ${observed}/${info.size})`;
    }
  } catch {
    return 'runtime asset cannot be inspected';
  }
  return null;
}

function validateRuntime(runtimeDir) {
  const requestedRoot = resolve(runtimeDir);
  if (!existsSync(requestedRoot)) return { error: 'runtime directory does not exist' };
  const root = realpathSync(requestedRoot);
  const manifest = loadManifest(root);
  if (manifest.error) return { error: manifest.error };
  if (!within(root, manifest.path)) return { error: 'runtime manifest resolves outside the runtime directory' };
  const manifestError = validateManifest(manifest.value);
  if (manifestError) return { error: manifestError };
  const selectedManifest = Array.isArray(manifest.value.runtimes)
    ? manifest.value.runtimes.find((entry) => entry.version === PACKAGE.version && entry.platform === platform() && entry.arch === arch())
    : manifest.value;
  const assetError = validateLocalAsset(root, selectedManifest);
  if (assetError) return { error: assetError };
  const launcherName = selectedManifest.launcher || manifest.value.launcher || 'bin/lapdev-runtime';
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
  return { root, manifest: selectedManifest, launcher: realLauncher };
}

function runtimeDirFrom(options) {
  return options.runtimeDir || process.env.LAPDEV_RUNTIME_DIR || join(homedir(), '.cache', 'lapdev', PACKAGE.version, `${platform()}-${arch()}`);
}

function hasExplicitRuntimeDir(options) {
  return Boolean(options.runtimeDir || process.env.LAPDEV_RUNTIME_DIR);
}

function manifestUrlFrom(options) {
  return options.manifestUrl || process.env.LAPDEV_RUNTIME_MANIFEST_URL;
}

function allowedReleaseUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const hosts = new Set(['github.com', 'api.github.com', 'objects.githubusercontent.com', 'raw.githubusercontent.com']);
  if (url.protocol !== 'https:' || !hosts.has(url.hostname)) return null;
  return url;
}

function assertArchiveEntries(archivePath) {
  let listing;
  try {
    listing = execFileSync('tar', ['-tzf', archivePath], { encoding: 'utf8' });
  } catch {
    throw new Error('runtime archive cannot be inspected');
  }
  for (const entry of listing.split('\n').filter(Boolean)) {
    const normalized = entry.replace(/^\.\//, '');
    if (normalized.startsWith('/') || normalized.split('/').includes('..') || normalized.includes('\\')) {
      throw new Error(`runtime archive contains an unsafe path: ${entry}`);
    }
  }
  for (const required of ['bin/lapdev-runtime', 'manifest.json']) {
    if (!listing.split('\n').some((entry) => entry === `./${required}`)) {
      throw new Error(`runtime archive is missing ${required}`);
    }
  }
}

async function downloadAndInstall(manifestUrl, cacheDir) {
  const manifestEndpoint = allowedReleaseUrl(manifestUrl);
  if (!manifestEndpoint) throw new Error('runtime manifest URL must use an allowed GitHub HTTPS source');
  const manifestResponse = await fetch(manifestEndpoint, { redirect: 'manual' });
  if (manifestResponse.status >= 300 && manifestResponse.status < 400) throw new Error('runtime manifest redirects are not allowed');
  if (!manifestResponse.ok) throw new Error(`runtime manifest request failed: HTTP ${manifestResponse.status}`);
  const manifest = await manifestResponse.json();
  const manifestError = validateManifest(manifest);
  if (manifestError) throw new Error(manifestError);
  const selected = Array.isArray(manifest.runtimes)
    ? manifest.runtimes.find((entry) => entry.version === PACKAGE.version && entry.platform === platform() && entry.arch === arch())
    : manifest;
  const assetUrl = allowedReleaseUrl(selected.asset);
  if (!assetUrl) throw new Error('runtime asset URL must use an allowed GitHub HTTPS source');
  const assetResponse = await fetch(assetUrl, { redirect: 'manual' });
  if (assetResponse.status >= 300 && assetResponse.status < 400) throw new Error('runtime asset redirects are not allowed');
  if (!assetResponse.ok) throw new Error(`runtime asset request failed: HTTP ${assetResponse.status}`);
  const data = Buffer.from(await assetResponse.arrayBuffer());
  const observedHash = createHash('sha256').update(data).digest('hex');
  if (String(data.length) !== selected.size || observedHash !== selected.sha256.toLowerCase()) {
    throw new Error(`runtime asset integrity mismatch (expected ${selected.sha256}/${selected.size}, observed ${observedHash}/${data.length})`);
  }
  const parent = dirname(cacheDir);
  mkdirSync(parent, { recursive: true });
  const tempRoot = mkdtempSync(join(parent, '.lapdev-runtime-'));
  const archivePath = join(tempRoot, 'runtime.tar.gz');
  const extractionPath = join(tempRoot, 'runtime');
  try {
    writeFileSync(archivePath, data, { flag: 'wx' });
    assertArchiveEntries(archivePath);
    mkdirSync(extractionPath);
    execFileSync('tar', ['-xzf', archivePath, '-C', extractionPath]);
    if (existsSync(cacheDir)) {
      renameSync(cacheDir, `${cacheDir}.invalid-${Date.now()}`);
    }
    renameSync(extractionPath, cacheDir);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
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

async function web(options) {
  if (!hasExplicitRuntimeDir(options) && options.offline && !existsSync(runtimeDirFrom(options))) {
    return fail(`offline cache miss for ${PACKAGE.version}/${platform()}-${arch()}`);
  }
  if (!hasExplicitRuntimeDir(options) && !options.offline && !existsSync(runtimeDirFrom(options)) && manifestUrlFrom(options)) {
    try {
      await downloadAndInstall(manifestUrlFrom(options), runtimeDirFrom(options));
    } catch (error) {
      return fail(error instanceof Error ? error.message : 'runtime download failed');
    }
  }
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
  process.exitCode = await web(options);
} else {
  fail(`unknown command: ${options.command}`, EXIT_USAGE);
  usage();
}
