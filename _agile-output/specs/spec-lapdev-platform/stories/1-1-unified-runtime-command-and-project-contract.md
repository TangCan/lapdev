---
status: draft
story_key: 1-1-unified-runtime-command-and-project-contract
epic: 1
story: 1
---

# Story 1.1: 统一运行时命令与项目契约

## Intent

<frozen-after-approval>
作为维护者，我希望开发、测试、端口和版本都有一个可执行的运行时契约，从而让干净检出的项目不依赖过时的 README 假设。

Requirements: FR1, NFR8
</frozen-after-approval>

## Acceptance Criteria

- Given a clean checkout and the current package, frontend, backend, container and CI configuration; when a maintainer follows the documented development, test and health-check commands; then every command resolves to an existing script or an explicitly documented directory-specific command.
- Given the frontend, backend, container and health-check services; when the runtime contract is read; then ports and version claims have one consistent source and do not contradict CI or manifests.
- Given a documentation drift check; when a documented command, port or version no longer matches its source configuration; then the check fails with the mismatched path and expected value.
- Given the repository's restricted test environment; when the contract check runs; then it reports environment limitations separately from real command/configuration regressions.

## Tasks

1. Audit root/frontend/backend scripts, CI, container entrypoint and runtime configuration for command, port and version sources.
2. Define one runtime-contract check with actionable mismatch output.
3. Correct only stale runtime documentation or command pointers; preserve historical documents as historical when they are intentionally excluded.
4. Add focused tests for valid commands and representative command/port/version drift.
5. Run the repository's relevant frontend/backend/documentation checks and record the results.

## Code Map

- `package.json`: root test commands; root currently has no `dev` or `start` script.
- `frontend/package.json`: frontend `dev`, `build`, `test`, lint and pinned dependency ranges.
- `scripts/entrypoint.sh`: container Deno server entrypoint and current permission invocation.
- `scripts/config.sh`, `scripts/run-tests.sh`: shared ports, proxy handling and integration test orchestration.
- `.github/workflows/build-and-push.yml`: CI Deno version, container port and health check.
- `README.md`, `docs/architecture.md`, `docs/epics.md`: documentation drift candidates; do not treat excluded historical epics as current requirements.
- `_bmad/config.toml`, `_bmad/bmm/config.yaml`, `AGENTS.md`: current BMAD output and project instruction contract.

## Implementation Notes

- Keep the change focused on the contract and its verification; security permission reduction belongs to Story 2.3.
- Prefer deriving checks from manifests/configuration over duplicating version strings in a new source file.
- Do not change application behavior merely to make an outdated document true; update the document or expose the actual command explicitly.

## Open Questions

- None for this story; the port/version source can be selected from existing manifests and CI without a product decision.

## Dev Notes

### ATDD Artifacts

- Checklist: `_agile-output/test-artifacts/atdd-checklist-1-1-unified-runtime-command-and-project-contract.md`
- Component/unit tests: `tests/unit/runtime-contract.test.ts`
