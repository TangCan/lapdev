---
status: in-progress
route: dispatch
baseline_commit: 3f8d6dd
story_key: 1-3-codex-bmad-skill-discovery-diagnostics
epic: 1
story: 3
---

# Story 1.3: 统一 Codex/BMAD 技能发现诊断

## Intent

作为 Codex/BMAD 用户，我希望技能发现能解释来源、优先级和错误，从而安装的技能要么可见，要么可诊断。

## Tasks & Acceptance

### Tasks

- [x] Audit existing skill loading and current `.agents/skills`/`.lapdev/skills` sources.
- [x] Report primary, legacy and global sources without copying or rewriting skill files.
- [x] Report duplicate identities, missing `SKILL.md`, parse failures and unavailable sources.
- [x] Add focused discovery tests and expose diagnostics through the load result.
- [ ] Run code review, automation and regression checks; record findings.

### Acceptance Criteria

- [x] `.agents/skills` is reported as the primary Codex/BMAD source.
- [x] `.lapdev/skills` is reported as an explicitly labelled legacy source.
- [x] Duplicate identities, missing `SKILL.md`, parse failures and refresh/source failures have actionable diagnostics.
- [x] Discovery does not copy or rewrite skill content.
- [x] A user can identify why a known installed skill is not visible.

## Code Map

- `backend/src/services/skillService.ts`: source-aware discovery and diagnostics.
- `shared/types/skill.ts`: public discovery diagnostic types.
- `tests/unit/skillService.test.ts`: discovery regression coverage.

## Dev Notes

`bmad-create-story` is not installed in this Codex workspace; this colocated spec is the documented fallback. `.agents/skills` has precedence over legacy/global sources and skill content remains read-only.
