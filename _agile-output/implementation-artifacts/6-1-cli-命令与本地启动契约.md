---
storyId: "6.1"
storyKey: "6-1-cli-命令与本地启动契约"
status: "done"
baseline_commit: "74e0fa1"
context:
  - "_agile-output/implementation-artifacts/epic-6-context.md"
  - "_agile-output/planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md"
  - "_agile-output/specs/spec-lapdev-platform/SPEC.md"
  - "_agile-output/specs/spec-lapdev-platform/release-runtime-contract.md"
  - "AGENTS.md"
source: "_agile-output/planning-artifacts/epics.md"
---

# Story 6.1: CLI 命令与本地启动契约

As a Lapdev user,
I want a versioned npm CLI with predictable local commands,
So that I can start Lapdev without Docker, Podman, Deno or Rust toolchains.

**Requirements:** FR6, NFR9, NFR13

## Acceptance Criteria

### AC-1: Versioned CLI commands

**Given** a published or locally packed CLI version
**When** the user invokes `web`, `doctor` or `version`
**Then** each command has stable help, exit-code and output behavior
**And** `npx` can execute the selected package version from a clean temporary directory

### AC-2: Local runtime startup

**Given** a valid runtime directory or a resolvable runtime release
**When** the user runs `web --no-open`
**Then** the CLI starts Lapdev on `127.0.0.1` and reports the local URL
**And** the CLI process itself does not require Docker, Podman, Deno or Rust

### AC-3: Runtime validation errors

**Given** an invalid or incomplete runtime directory
**When** the CLI attempts to start `web`
**Then** it returns a stable non-zero exit code with actionable diagnostics
**And** it does not launch a partially trusted runtime

### AC-4: Doctor diagnostics

**Given** the CLI is invoked with `doctor`
**When** it checks the current platform, Node version, runtime directory and cache configuration
**Then** it reports each check as pass, warning or failure without exposing secrets or workspace contents

### AC-5: Invalid invocation safety

**Given** an unsupported command, option or platform
**When** the CLI parses the invocation
**Then** it prints concise usage guidance and a stable non-zero exit code
**And** it does not download, execute or modify an untrusted path

### AC-6: Source-install compatibility

**Given** the existing source-install development path
**When** maintainers run the documented source commands
**Then** adding the CLI package does not change or break the source development entrypoints

## Implementation Notes

- Keep CLI code isolated from the existing source-install entrypoints.
- Use a controlled `--runtime-dir` fixture for local and ATDD tests.
- Default all runtime listeners to localhost and keep workspace paths separate from runtime paths.
- Do not place secrets, workspace data or generated runtime assets in the npm package.

## Tasks & Acceptance

- [x] Create a versioned `@lapdev/cli` package with `web`, `doctor` and `version` commands.
- [x] Implement safe command parsing, stable non-zero errors and `--no-open`/`--runtime-dir` options.
- [x] Validate the runtime directory layout before launching any process.
- [x] Start a validated local runtime on `127.0.0.1` and report its URL without requiring project toolchains.
- [x] Keep source-install commands and existing package scripts unchanged.
- [x] Activate and pass the AC-1 through AC-6 tests after implementation.

## Acceptance Verification

- AC-1: `version`, `doctor` and `web` are exposed by the packed npm CLI and `npx`-compatible.
- AC-2: `web --no-open --runtime-dir <dir>` starts only a validated local launcher and uses localhost.
- AC-3: incomplete runtime directories fail before child-process launch.
- AC-4: `doctor` reports platform, Node, runtime and cache checks without secret values.
- AC-5: unknown commands/options and unsupported runtime targets return stable non-zero errors without untrusted I/O.
- AC-6: existing source-install scripts remain unchanged and their smoke checks continue to pass.

## Review Triage Log

- 手工安全审查：已修复运行时目录、manifest 和 launcher 的真实路径校验；目录外的符号链接或非普通文件会在启动前拒绝。
- 代码审查子代理层：当前 Codex 环境未提供可用的 subagent 能力，四份独立审查提示文件已保留；本地人工审查、针对性安全用例和全量回归已完成。
- E2E：CLI 是 Node 本地进程契约，浏览器测试保留为显式跳过的 scaffold；6 个 Deno Story 测试全部通过。
