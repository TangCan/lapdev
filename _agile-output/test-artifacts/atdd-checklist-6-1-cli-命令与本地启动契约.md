---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-09-29
storyId: "6.1"
storyKey: "6-1-cli-命令与本地启动契约"
storyFile: "_agile-output/implementation-artifacts/6-1-cli-命令与本地启动契约.md"
atddChecklistPath: "_agile-output/test-artifacts/atdd-checklist-6-1-cli-命令与本地启动契约.md"
generatedTestFiles:
  - "tests/unit/cli-6-1.test.ts"
  - "tests/e2e/cli-6-1.spec.ts"
inputDocuments:
  - "_agile-output/implementation-artifacts/6-1-cli-命令与本地启动契约.md"
  - "package.json"
  - "playwright.config.ts"
  - "_bmad/tea/config.yaml"
acceptanceCriteria:
  - id: AC-1
    idSource: supplied
    text: Versioned CLI exposes web, doctor and version with stable behavior and npx execution.
  - id: AC-2
    idSource: supplied
    text: web --no-open starts a valid runtime on 127.0.0.1 without Docker, Podman, Deno or Rust.
  - id: AC-3
    idSource: supplied
    text: Invalid or incomplete runtime returns a stable non-zero error without launching it.
  - id: AC-4
    idSource: supplied
    text: doctor reports platform, Node, runtime directory and cache checks without secrets.
  - id: AC-5
    idSource: supplied
    text: Invalid command, option or platform is rejected without untrusted I/O.
  - id: AC-6
    idSource: supplied
    text: Existing source-install entrypoints remain compatible.
---

# ATDD Checklist — Story 6.1

## Preflight

- Stack: fullstack (React/Vite frontend, Deno backend, Rust core).
- Frameworks: Playwright 1.60.0, Vitest 2.0.5, Deno test, Cargo test.
- Generation mode: AI/sequential; browser recording was not needed for a CLI process contract.
- `bmad-create-story` was unavailable in the installed Codex skill catalog; the Story file was created from the approved Epic source as a compatibility handoff.

## Test Strategy

| Criterion | Primary red-phase scaffold | Level | Priority | Green-phase branches |
|---|---|---|---|---|
| AC-1 | CLI exposes three commands and versioned npx package | Unit/API | P0 | packed tarball invocation, help and exit codes |
| AC-2 | `web --no-open` binds localhost and returns health | Integration | P0 | runtime fixture, clean cache, no toolchain |
| AC-3 | invalid runtime is rejected before process launch | Unit | P0 | missing files, wrong manifest, malformed launcher |
| AC-4 | doctor returns safe check categories | Unit | P1 | missing Node, cache permissions, redaction |
| AC-5 | invalid input has stable non-zero result and no I/O | Unit | P0 | unsupported platform, path traversal, unknown option |
| AC-6 | source commands remain runnable | Integration | P1 | frontend/backend test wrappers and source startup |

Each criterion has exactly one primary red-phase leaf. The first assertion in each leaf is the criterion-defining property; setup output remains opaque until that assertion.

## Generated RED Phase

- `tests/unit/cli-6-1.test.ts`: six ignored Deno red-phase leaves, one per AC.
- `tests/e2e/cli-6-1.spec.ts`: one ignored Playwright install-path scaffold for the clean temporary user environment.
- Scaffolds are intentionally skipped/ignored before implementation and must be activated during build/automation.

## Validation

- All supplied AC ids are preserved and unique.
- No secrets, workspace contents or arbitrary paths are asserted in diagnostics.
- Temporary runtime paths are outside the workspace in the intended implementation.
- No orphan browser session or random temporary artifact was created.
