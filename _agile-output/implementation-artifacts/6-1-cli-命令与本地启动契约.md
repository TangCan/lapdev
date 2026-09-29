---
storyId: "6.1"
storyKey: "6-1-cli-命令与本地启动契约"
status: "ready-for-dev"
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
