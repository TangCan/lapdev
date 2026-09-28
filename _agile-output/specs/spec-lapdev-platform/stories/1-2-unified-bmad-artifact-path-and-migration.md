---
status: done
route: dispatch
baseline_commit: b4e21c0
story_key: 1-2-unified-bmad-artifact-path-and-migration
epic: 1
story: 2
---

# Story 1.2: 统一 BMAD 产物目录与迁移映射

## Intent

作为 BMAD 用户，我希望当前规划和实施产物统一解析到 `_agile-output`，并能解释旧目录的迁移状态，从而不会误读或丢失项目状态。

## Tasks & Acceptance

### Tasks

- [x] Audit current BMAD configuration, status, legacy directories and help metadata.
- [x] Add a read-only migration report with explicit `pending`, `migrated`, and `conflict` states.
- [x] Add an explicit migration mode that never overwrites a different destination file.
- [x] Add focused tests for current-path resolution, identical files, pending files and conflicts.
- [x] Run relevant unit and regression checks; record environment limitations.

### Acceptance Criteria

- [x] Current planning, implementation, test and sprint-status paths resolve under `_agile-output`.
- [x] Legacy `implementation_artifacts` content is classified rather than silently ignored.
- [x] Migration preserves content and refuses conflicting overwrites.
- [x] The report makes the current status location and legacy source visible to maintainers.

## Code Map

- `_bmad/config.toml`: current output configuration.
- `_agile-output/implementation-artifacts/sprint-status.yaml`: current status source.
- `implementation_artifacts/`: legacy migration/archive input.

## Dev Notes

`bmad-create-story` is not installed in this Codex workspace; the colocated spec is the documented fallback for the same story context. Implementation follows the explicit-migration boundary in `AGENTS.md`.

## Verification

- `deno test --allow-read --allow-run --allow-write tests/unit/bmad-artifact-migration.test.ts` — 3 passed.
- `deno run --allow-read --allow-write scripts/bmad-artifact-migration.ts` — report generated; legacy files remain `pending` until explicit migration.
- `git diff --check` — passed.
