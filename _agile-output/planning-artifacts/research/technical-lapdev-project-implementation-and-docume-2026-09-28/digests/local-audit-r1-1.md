# Local audit digest — round 1

## Scope

Audited the repository structure, package/task definitions, runtime entrypoints, deployment scripts, tests, BMAD configuration, and primary project documents on 2026-09-28.

## Findings

- The implementation is a multi-surface product: React/Vite frontend, Deno/TypeScript backend, a small Rust core, WebSocket terminal/file-watch paths, LSP handlers, AI providers, agent file operations, BMAD integration, and a skill market. Evidence: `frontend/src/`, `backend/src/`, `core/src/`, `shared/`, `docs/003_design.md`.
- The test estate is broad but fragmented: 117 files under `tests/`, 7 frontend test files, and 2 backend test files. The root scripts mix Deno, Vitest, Playwright, shell, and container workflows. Evidence: `package.json`, `tests/`, `frontend/tests/`, `backend/tests/`.
- Backend tests pass in this environment: 7 test files/suites and 39 steps passed. Frontend tests reported 673/684 passed; 10 failures were caused by `spawnSync /bin/sh EPERM` in tests that shell out, and one React Compiler assertion failed. This run is evidence of test-runner/environment coupling, not proof of production failure.
- Runtime and documentation drift is material. `frontend/package.json` uses React 19.2.0 and Playwright 1.60.0, while `README.md` and `docs/architecture.md` still describe React 18.2.0 and older Playwright versions. `docs/epics.md` also contains historical statements that React 19 was not released.
- The documented commands are not fully executable from the repository root: `README.md` says `npm run dev` and `npm run start`, but the root `package.json` does not define those scripts; the frontend defines `dev` and the backend has a Deno entrypoint instead.
- Skill path documentation is inconsistent. The implementation scans `~/.lapdev/skills` and `.lapdev/skills` (`backend/src/services/skillService.ts`), while the installed BMAD/Codex integration uses `.agents/skills` and the project configuration now uses `_agile-output`.
- Deployment grants broad runtime privileges: `scripts/entrypoint.sh` launches Deno with `-A`, and test scripts use `--allow-all`. This is a concrete production hardening target because the backend exposes terminal execution, file writes, Git operations, AI configuration, and agent operations.
- AI keys are stored in browser `sessionStorage` by the frontend (`frontend/src/services/aiService.ts`), while backend routes accept AI configuration and agent/file/terminal endpoints without an evident authentication layer in `backend/src/main.ts`. This creates a high-priority threat-model and deployment-boundary gap for any network-exposed instance.
- Project status is not discoverable from the configured BMAD artifact paths: `_agile-output/planning-artifacts` and `_agile-output/implementation-artifacts` are empty, while the current closed sprint status remains under root `implementation_artifacts/sprint-status.yaml`. The BMAD resolver therefore cannot use the legacy status as current workflow evidence.

## Leads

1. Verify current Deno permission and production deployment guidance; compare least-privilege permissions, subprocess isolation, secrets, and observability patterns.
2. Verify current Agent Skills/Codex project discovery expectations and define one canonical skill path strategy for Lapdev, BMAD, and Codex.
3. Verify React Compiler/React 19 migration guidance and use it to distinguish stale tests from real compiler regressions.
4. Look for current guidance on Web IDE/LSP/terminal architecture, observability, and secure multi-tenant boundaries.

## Local recommendation hypothesis

The highest-value sequence is likely: establish a canonical project/runtime contract and security boundary first; then repair CI/test determinism and documentation drift; then invest in product capabilities such as skill lifecycle, LSP breadth, and collaborative/remote workspace features. External research must confirm or overturn this hypothesis.
