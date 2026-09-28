<!-- bmad:context -->
<!-- Verified 2026-09-28 against 580966e327ac16ba22c0b1ec3492d7e3d311941b. Managed by bmad-project-context; edits inside this block are replaced on refresh. Keep anything you want preserved outside the markers. -->

## lapdev

Open-source AI Web IDE. React/Vite frontend, Deno/TypeScript backend, Rust core, Monaco, terminal, Git, LSP, AI providers, Agent operations, BMAD and skills. Planning artifacts live in `_agile-output/planning-artifacts/`; implementation artifacts live in `_agile-output/implementation-artifacts/`; project knowledge lives in `docs/`.

## Policy

- Treat the workspace as untrusted input when the backend is network-exposed; do not expand production permissions or expose terminal/file/Git/Agent operations without an explicit security review.
- Do not add secrets to tracked files, browser-persisted configuration, logs, or test fixtures; use environment/secret injection appropriate to the deployment mode.
- Treat `_agile-output/` as the current BMAD output location; keep legacy `implementation_artifacts/` as migration/archival input until its contents are deliberately migrated.

## Where things are

- Backend entrypoint and HTTP/WebSocket routing: `backend/src/main.ts`
- Skill discovery and compatibility work: `backend/src/services/skillService.ts`; current Codex/BMAD skills: `.agents/skills/`; legacy Lapdev skills: `.lapdev/skills/`
- Frontend AI configuration: `frontend/src/services/aiService.ts`
- Container entrypoint: `scripts/entrypoint.sh`
- Test orchestration: `scripts/run-tests.sh`; root test commands: `package.json`; frontend commands: `frontend/package.json`
- Architecture and product documentation: `docs/`; research and planning decisions: `_agile-output/planning-artifacts/`
- Test artifacts: `_agile-output/test-artifacts/`

## Running and verifying

- Use `npm run test:frontend` for frontend Vitest tests and `npm run test:backend` for backend Deno tests; use `npm test` for the full orchestrated suite.
- Run frontend development commands from `frontend/` with `npm run dev`; the root package does not define `npm run dev` or `npm run start`.
- Run backend tests through the root script so proxy bypass and project paths are configured; do not replace the repository's test wrapper with an ad hoc Deno command.
- Before changing runtime/version guidance, read `package.json`, `frontend/package.json`, `scripts/config.sh`, and the relevant CI workflow.
- When changing BMAD/Codex skills, verify both discovery and invocation from `.agents/skills/`; do not assume installation alone makes a skill visible to a running Codex session.

## Conventions that differ from defaults

- Keep `.agents/skills/` as the primary Codex/BMAD skill source; support `.lapdev/skills/` only as an explicitly labeled legacy compatibility source.
- Keep BMAD planning and implementation outputs under `_agile-output/`; do not create new workflow artifacts under the legacy root `implementation_artifacts/`.
- Keep workspace/file operations bounded by the configured workspace root; do not accept arbitrary paths from API or Agent requests.
- Treat terminal, Git, LSP, file writes, and AI calls as capability-bearing operations that require explicit authorization and auditability.

## Known pitfalls

- Frontend tests that shell out can fail with `spawnSync /bin/sh EPERM` in restricted environments; classify this as an environment/test-runner issue and preserve a separate signal for real assertion failures.
- The React Compiler lint test is version/configuration-sensitive; verify the installed React, compiler, ESLint plugin, and expected diagnostic before changing its assertion.
- Do not infer current project status from `implementation_artifacts/sprint-status.yaml` without checking whether it has been migrated or mapped into `_agile-output/`.
- Do not assume WebSocket Origin checks are authentication; validate session/user binding before treating a connection as authorized.

<!-- /bmad:context -->
