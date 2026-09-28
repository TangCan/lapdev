---
status: done
route: dispatch
baseline_commit: 438c5c2
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

## Tasks & Acceptance

### Tasks

- [x] Audit root/frontend/backend scripts, CI, container entrypoint and runtime configuration for command, port and version sources.
- [x] Define one runtime-contract check with actionable mismatch output.
- [x] Correct only stale runtime documentation or command pointers; preserve historical documents as historical when they are intentionally excluded.
- [x] Add focused tests for valid commands and representative command/port/version drift.
- [x] Run the repository's relevant frontend/backend/documentation checks and record the results.

### Acceptance Criteria

- Given a clean checkout and the current package, frontend, backend, container and CI configuration; when a maintainer follows the documented development, test and health-check commands; then every command resolves to an existing script or an explicitly documented directory-specific command.
- Given the frontend, backend, container and health-check services; when the runtime contract is read; then ports and version claims have one consistent source and do not contradict CI or manifests.
- Given a documentation drift check; when a documented command, port or version no longer matches its source configuration; then the check fails with the mismatched path and expected value.
- Given the repository's restricted test environment; when the contract check runs; then it reports environment limitations separately from real command/configuration regressions.

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
- Build implementation is complete in the baseline changes: `scripts/validate-runtime-contract.sh` derives expected values from manifests, shared port configuration and CI, while returning exit code 1 for drift and 2 for environment limitations.
- Review fixes: the checker now validates executable command targets, runtime defaults, CI/container mappings, current architecture documentation, and executes both drift and environment branches in focused tests.

## Dev Notes

### ATDD Artifacts

- Checklist: `_agile-output/test-artifacts/atdd-checklist-1-1-unified-runtime-command-and-project-contract.md`
- Component/unit tests: `tests/unit/runtime-contract.test.ts`

### Review Findings

- [x] [Review][Patch] Validate the frontend development script exists before accepting the documented command.
- [x] [Review][Patch] Validate `scripts/release.sh` exists and is executable before accepting the production command.
- [x] [Review][Patch] Derive backend, frontend, container and host port expectations from `scripts/config.sh` instead of hardcoding them.
- [x] [Review][Patch] Cross-check backend runtime defaults and CI health/container mappings against the shared port contract.
- [x] [Review][Patch] Classify missing shell tools as `ENVIRONMENT` before attempting drift checks.
- [x] [Review][Patch] Replace source-text-only assertions with executable valid, drift and environment fixture tests.
- [x] [Review][Patch] Derive version expectations in tests from package and workflow sources.
- [x] [Review][Patch] Include current `docs/architecture.md` in version drift coverage and align its current runtime values.

## Review Triage Log

- `patch` — Reviewers found hardcoded ports and incomplete host/container coverage; verified against `scripts/config.sh`, `Dockerfile`, backend config and CI, then fixed by deriving and cross-checking all relevant values.
- `patch` — Reviewers found command existence and executable-bit checks were missing; verified the checker could accept a missing frontend or release command, then added explicit checks.
- `patch` — Reviewers found drift/environment behavior was only checked as source text; verified the tests would pass after disabling checker behavior, then added temporary-fixture execution tests for exit codes 0, 1 and 2.
- `patch` — Verification review found `docs/architecture.md` still advertised old React/Playwright versions and the legacy artifact path; updated the current documentation and included it in the checker.

## Verification

**Commands:**

- `./scripts/validate-runtime-contract.sh` -- expected: `OK: runtime contract is consistent`.
- `deno test --allow-read --allow-run --allow-write --allow-env --allow-sys tests/unit/runtime-contract.test.ts` -- expected: 6 tests pass, including valid, drift and environment fixtures.
- `npm run test:unit` -- expected: full Deno unit suite passes.
