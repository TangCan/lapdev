Read and follow these review instructions completely.

claims_file content:
Story 6.1 CLI implementation: review staged changes against its implementation spec and acceptance criteria.

Review content:
diff --git "a/_agile-output/implementation-artifacts/6-1-cli-\345\221\275\344\273\244\344\270\216\346\234\254\345\234\260\345\220\257\345\212\250\345\245\221\347\272\246.md" "b/_agile-output/implementation-artifacts/6-1-cli-\345\221\275\344\273\244\344\270\216\346\234\254\345\234\260\345\220\257\345\212\250\345\245\221\347\272\246.md"
index d463405..7f37a28 100644
--- "a/_agile-output/implementation-artifacts/6-1-cli-\345\221\275\344\273\244\344\270\216\346\234\254\345\234\260\345\220\257\345\212\250\345\245\221\347\272\246.md"
+++ "b/_agile-output/implementation-artifacts/6-1-cli-\345\221\275\344\273\244\344\270\216\346\234\254\345\234\260\345\220\257\345\212\250\345\245\221\347\272\246.md"
@@ -1,7 +1,14 @@
 ---
 storyId: "6.1"
 storyKey: "6-1-cli-命令与本地启动契约"
-status: "ready-for-dev"
+status: "in-review"
+baseline_commit: "74e0fa1"
+context:
+  - "_agile-output/implementation-artifacts/epic-6-context.md"
+  - "_agile-output/planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md"
+  - "_agile-output/specs/spec-lapdev-platform/SPEC.md"
+  - "_agile-output/specs/spec-lapdev-platform/release-runtime-contract.md"
+  - "AGENTS.md"
 source: "_agile-output/planning-artifacts/epics.md"
 ---

@@ -61,3 +68,21 @@ So that I can start Lapdev without Docker, Podman, Deno or Rust toolchains.
 - Use a controlled `--runtime-dir` fixture for local and ATDD tests.
 - Default all runtime listeners to localhost and keep workspace paths separate from runtime paths.
 - Do not place secrets, workspace data or generated runtime assets in the npm package.
+
+## Tasks & Acceptance
+
+- [x] Create a versioned `@lapdev/cli` package with `web`, `doctor` and `version` commands.
+- [x] Implement safe command parsing, stable non-zero errors and `--no-open`/`--runtime-dir` options.
+- [x] Validate the runtime directory layout before launching any process.
+- [x] Start a validated local runtime on `127.0.0.1` and report its URL without requiring project toolchains.
+- [x] Keep source-install commands and existing package scripts unchanged.
+- [ ] Activate and pass the AC-1 through AC-6 tests after implementation.
+
+## Acceptance Verification
+
+- AC-1: `version`, `doctor` and `web` are exposed by the packed npm CLI and `npx`-compatible.
+- AC-2: `web --no-open --runtime-dir <dir>` starts only a validated local launcher and uses localhost.
+- AC-3: incomplete runtime directories fail before child-process launch.
+- AC-4: `doctor` reports platform, Node, runtime and cache checks without secret values.
+- AC-5: unknown commands/options and unsupported runtime targets return stable non-zero errors without untrusted I/O.
+- AC-6: existing source-install scripts remain unchanged and their smoke checks continue to pass.
diff --git a/_agile-output/implementation-artifacts/epic-6-context.md b/_agile-output/implementation-artifacts/epic-6-context.md
new file mode 100644
index 0000000..360a763
--- /dev/null
+++ b/_agile-output/implementation-artifacts/epic-6-context.md
@@ -0,0 +1,39 @@
+# Epic 6 Context: 一键安装与本地运行时发布
+
+<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->
+
+## Goal
+
+让用户通过固定版本的 npm CLI 在本机启动 Lapdev，而不需要 Docker、ACR、Deno 或 Rust 工具链；同时让维护者能够为明确支持的平台构建、校验并通过 GitHub Release 发布 runtime，并保留源码安装路径。
+
+## Stories
+
+- Story 6.1: CLI 命令与本地启动契约
+- Story 6.2: Runtime Manifest、平台选择与缓存
+- Story 6.3: Deno、Rust 与前端 Runtime Archive
+- Story 6.4: Runtime 完整性与安全启动
+- Story 6.5: GitHub Release 平台发布
+- Story 6.6: npm Trusted Publishing 与端到端安装验证
+
+## Requirements & Constraints
+
+- CLI 必须提供 `web`、`doctor`、`version`，支持固定版本的 `npx` 调用。
+- 运行时 manifest 必须绑定 CLI 版本、Git tag、平台、架构、target、asset、大小、SHA-256 和构建 commit。
+- 首批平台为 Linux x64 与 macOS arm64；Rust FFI 必须以目标平台真实动态库文件交付。
+- runtime 下载必须在执行前完成大小和 SHA-256 校验，并原子安装到 workspace 外的用户缓存。
+- 默认监听 `127.0.0.1`；发布归档不得包含 secrets、workspace 数据、测试 fixture 或无关构建缓存。
+- PR/普通 push 只执行构建、测试和健康检查；受保护的 `vX.Y.Z` tag 才能发布 GitHub Release 和 npm。
+- npm 发布使用 GitHub Actions OIDC Trusted Publishing，不使用长期 npm token。
+- Docker/ACR 不是发布成功门禁；源码安装路径必须继续可用。
+
+## Technical Decisions
+
+- npm CLI 是本地发布边界；CLI 负责命令解析、manifest 选择、下载、校验、缓存和启动。
+- CLI 与 runtime 通过版本化 manifest 绑定，禁止执行未验证、过期或不兼容的缓存条目。
+- runtime 布局稳定包含 `bin`、`lib`、`app`、manifest 与 license；Deno backend launcher、React/Vite 构建产物、共享资源和 Rust FFI 均由归档提供。
+- GitHub Release 是 runtime 资产的权威来源；tag、manifest、包版本与 commit 必须可追溯。
+- 本地运行时和 workspace 路径分离，诊断不能泄露 secrets、完整 prompt 或 workspace 内容。
+
+## Cross-Story Dependencies
+
+6.1 建立 CLI 命令和本地启动契约；6.2 提供 manifest、平台选择和缓存；6.3 生成可运行归档；6.4 加固完整性与安全启动；6.5 发布并验证 GitHub Release 资产；6.6 完成 npm Trusted Publishing 和端到端安装验证。源码安装不依赖这些新增发布入口。
diff --git a/_agile-output/implementation-artifacts/sprint-status.yaml b/_agile-output/implementation-artifacts/sprint-status.yaml
index ac74a8d..e44057c 100644
--- a/_agile-output/implementation-artifacts/sprint-status.yaml
+++ b/_agile-output/implementation-artifacts/sprint-status.yaml
@@ -6,7 +6,7 @@
 # completed, different performance-optimization plan.

 generated: 09-28-2026 18:32
-last_updated: 09-29-2026 00:00
+last_updated: 09-29-2026 00:45
 project: lapdev
 project_key: NOKEY
 tracking_system: file-system
@@ -47,8 +47,8 @@ development_status:
   5-4-可观测性与审计质量门禁: done
   epic-5-retrospective: optional

-  epic-6: backlog
-  6-1-cli-命令与本地启动契约: ready-for-dev
+  epic-6: in-progress
+  6-1-cli-命令与本地启动契约: in-review
   6-2-runtime-manifest-平台选择与缓存: backlog
   6-3-deno-rust-与前端-runtime-archive: backlog
   6-4-runtime-完整性与安全启动: backlog
diff --git a/cli/README.md b/cli/README.md
new file mode 100644
index 0000000..853c546
--- /dev/null
+++ b/cli/README.md
@@ -0,0 +1,11 @@
+# @lapdev/cli
+
+Use a pinned Lapdev runtime without installing Docker, Deno or Rust:
+
+```sh
+npx @lapdev/cli@1.0.0 version
+npx @lapdev/cli@1.0.0 doctor
+npx @lapdev/cli@1.0.0 web --no-open --runtime-dir /path/to/runtime
+```
+
+Runtime directories must contain a `manifest.json` (or legacy `runtime.json`) and a launcher under `bin/`.
diff --git a/cli/bin/lapdev.js b/cli/bin/lapdev.js
new file mode 100755
index 0000000..4028728
--- /dev/null
+++ b/cli/bin/lapdev.js
@@ -0,0 +1,137 @@
+#!/usr/bin/env node
+
+import { existsSync, readFileSync } from 'node:fs';
+import { homedir, platform, arch } from 'node:os';
+import { dirname, join, normalize, relative, resolve } from 'node:path';
+import { spawn } from 'node:child_process';
+import { fileURLToPath } from 'node:url';
+
+const CLI_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
+const PACKAGE_FILE = join(CLI_DIR, 'package.json');
+const PACKAGE = JSON.parse(readFileSync(PACKAGE_FILE, 'utf8'));
+const EXIT_USAGE = 2;
+const EXIT_RUNTIME = 3;
+
+function usage() {
+  console.error('Usage: lapdev <web|doctor|version> [options]');
+  console.error('  web [--runtime-dir DIR] [--workspace DIR] [--port PORT] [--no-open]');
+  console.error('  doctor [--runtime-dir DIR]');
+  console.error('  version');
+}
+
+function fail(message, code = EXIT_RUNTIME) {
+  console.error(`lapdev: ${message}`);
+  process.exitCode = code;
+  return code;
+}
+
+function parseArgs(argv) {
+  const [command = '', ...rest] = argv;
+  const options = { command, noOpen: false };
+  for (let i = 0; i < rest.length; i += 1) {
+    const arg = rest[i];
+    if (arg === '--no-open') {
+      options.noOpen = true;
+    } else if (arg === '--runtime-dir' || arg === '--workspace' || arg === '--port') {
+      const value = rest[++i];
+      if (!value || value.startsWith('--')) return { error: `${arg} requires a value` };
+      const optionName = arg === '--runtime-dir' ? 'runtimeDir' : arg === '--workspace' ? 'workspace' : 'port';
+      options[optionName] = value;
+    } else if (arg === '--help' || arg === '-h') {
+      options.help = true;
+    } else {
+      return { error: `unknown option: ${arg}` };
+    }
+  }
+  return options;
+}
+
+function loadManifest(runtimeDir) {
+  for (const name of ['manifest.json', 'runtime.json']) {
+    const path = join(runtimeDir, name);
+    if (!existsSync(path)) continue;
+    try {
+      return { path, value: JSON.parse(readFileSync(path, 'utf8')) };
+    } catch {
+      return { error: `${name} is not valid JSON` };
+    }
+  }
+  return { error: 'runtime manifest is missing' };
+}
+
+function within(root, candidate) {
+  const rel = relative(root, candidate);
+  return rel === '' || (rel !== '..' && !rel.startsWith(`..${normalize('/')}`) && !rel.startsWith('../') && !rel.startsWith('..\\') && !rel.includes('\0'));
+}
+
+function validateRuntime(runtimeDir) {
+  const root = resolve(runtimeDir);
+  if (!existsSync(root)) return { error: 'runtime directory does not exist' };
+  const manifest = loadManifest(root);
+  if (manifest.error) return { error: manifest.error };
+  if (!manifest.value || typeof manifest.value !== 'object' || typeof manifest.value.version !== 'string') {
+    return { error: 'runtime manifest must declare a version' };
+  }
+  const launcherName = manifest.value.launcher || 'bin/lapdev-runtime';
+  const launcher = resolve(root, launcherName);
+  if (!within(root, launcher) || !existsSync(launcher)) return { error: 'runtime launcher is missing or outside the runtime directory' };
+  return { root, manifest: manifest.value, launcher };
+}
+
+function runtimeDirFrom(options) {
+  return options.runtimeDir || process.env.LAPDEV_RUNTIME_DIR || join(homedir(), '.cache', 'lapdev', PACKAGE.version, `${platform()}-${arch()}`);
+}
+
+function doctor(options) {
+  const runtimeDir = runtimeDirFrom(options);
+  const checks = [
+    ['node', Number(process.versions.node.split('.')[0]) >= 18],
+    ['platform', Boolean(platform() && arch())],
+    ['runtime', Boolean(validateRuntime(runtimeDir).launcher)],
+    ['cache', Boolean(join(homedir(), '.cache', 'lapdev'))],
+  ];
+  for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'WARN'} ${name}`);
+  return checks.some(([, ok]) => !ok) ? EXIT_RUNTIME : 0;
+}
+
+function web(options) {
+  const runtime = validateRuntime(runtimeDirFrom(options));
+  if (runtime.error) return fail(runtime.error);
+  const port = options.port || process.env.PORT || '3333';
+  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) return fail('port must be between 1 and 65535', EXIT_USAGE);
+  const child = spawn(runtime.launcher, [], {
+    cwd: runtime.root,
+    env: { ...process.env, PORT: port, ...(options.workspace ? { WORKSPACE_PATH: resolve(options.workspace) } : {}) },
+    stdio: 'inherit',
+  });
+  child.once('error', (error) => fail(`runtime could not start: ${error.message}`));
+  child.once('exit', (code, signal) => {
+    if (signal) process.exitCode = 1;
+    else process.exitCode = code ?? 1;
+  });
+  console.log(`Lapdev runtime started at http://127.0.0.1:${port}`);
+  if (!options.noOpen) console.log('Browser opening is disabled until a desktop opener is configured.');
+  return 0;
+}
+
+const rawArgs = process.argv.slice(2);
+if (rawArgs.length === 1 && (rawArgs[0] === '--help' || rawArgs[0] === '-h')) {
+  usage();
+  process.exit(0);
+}
+const options = parseArgs(rawArgs);
+if (options.error) {
+  fail(options.error, EXIT_USAGE);
+  usage();
+} else if (options.help || !options.command) {
+  usage();
+} else if (options.command === 'version') {
+  console.log(PACKAGE.version);
+} else if (options.command === 'doctor') {
+  process.exitCode = doctor(options);
+} else if (options.command === 'web') {
+  process.exitCode = web(options);
+} else {
+  fail(`unknown command: ${options.command}`, EXIT_USAGE);
+  usage();
+}
diff --git a/cli/package.json b/cli/package.json
new file mode 100644
index 0000000..97d738b
--- /dev/null
+++ b/cli/package.json
@@ -0,0 +1,19 @@
+{
+  "name": "@lapdev/cli",
+  "version": "1.0.0",
+  "description": "Install and run Lapdev from a verified platform runtime",
+  "type": "module",
+  "bin": {
+    "lapdev": "bin/lapdev.js"
+  },
+  "files": [
+    "bin",
+    "README.md"
+  ],
+  "engines": {
+    "node": ">=18"
+  },
+  "publishConfig": {
+    "access": "public"
+  }
+}
diff --git a/tests/fixtures/runtime-6-1/bin/lapdev-runtime.js b/tests/fixtures/runtime-6-1/bin/lapdev-runtime.js
new file mode 100755
index 0000000..500ca5d
--- /dev/null
+++ b/tests/fixtures/runtime-6-1/bin/lapdev-runtime.js
@@ -0,0 +1,16 @@
+#!/usr/bin/env node
+
+import { createServer } from 'node:http';
+
+const port = Number(process.env.PORT || 3333);
+const server = createServer((request, response) => {
+  if (request.url === '/health') {
+    response.writeHead(200, { 'content-type': 'application/json' });
+    response.end(JSON.stringify({ status: 'ok' }));
+    return;
+  }
+  response.writeHead(404);
+  response.end();
+});
+
+server.listen(port, '127.0.0.1');
diff --git a/tests/fixtures/runtime-6-1/manifest.json b/tests/fixtures/runtime-6-1/manifest.json
new file mode 100644
index 0000000..636f71d
--- /dev/null
+++ b/tests/fixtures/runtime-6-1/manifest.json
@@ -0,0 +1,6 @@
+{
+  "version": "1.0.0",
+  "platform": "test",
+  "arch": "test",
+  "launcher": "bin/lapdev-runtime.js"
+}
diff --git a/tests/fixtures/runtime-6-1/package.json b/tests/fixtures/runtime-6-1/package.json
new file mode 100644
index 0000000..e986b24
--- /dev/null
+++ b/tests/fixtures/runtime-6-1/package.json
@@ -0,0 +1,4 @@
+{
+  "private": true,
+  "type": "module"
+}


Return findings as text.
