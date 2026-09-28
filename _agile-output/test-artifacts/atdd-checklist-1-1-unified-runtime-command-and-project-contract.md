---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: 2026-09-28
storyId: "1.1"
storyKey: 1-1-unified-runtime-command-and-project-contract
storyFile: _agile-output/specs/spec-lapdev-platform/stories/1-1-unified-runtime-command-and-project-contract.md
atddChecklistPath: _agile-output/test-artifacts/atdd-checklist-1-1-unified-runtime-command-and-project-contract.md
generatedTestFiles:
  - tests/unit/runtime-contract.test.ts
inputDocuments:
  - _agile-output/specs/spec-lapdev-platform/stories/1-1-unified-runtime-command-and-project-contract.md
  - package.json
  - frontend/package.json
  - scripts/config.sh
  - .github/workflows/build-and-push.yml
  - README.md
acceptanceCriteria:
  - id: AC-1
    idSource: generated
    text: Documented development and test commands resolve to existing scripts or explicit directory commands.
  - id: AC-2
    idSource: generated
    text: Ports and version claims have one consistent source and do not contradict CI or manifests.
  - id: AC-3
    idSource: generated
    text: Documentation drift produces an actionable mismatch.
  - id: AC-4
    idSource: generated
    text: Environment limitations are separated from real command/configuration regressions.
---

# ATDD Checklist — Story 1.1

## Red-phase intent

The new unit tests define the runtime contract at repository boundaries. They are expected to fail before the implementation and documentation are corrected because README currently contains stale React, Playwright and port claims.

## Generated red-phase tests

- `tests/unit/runtime-contract.test.ts`
  - Checks the frontend development command is documented from the correct directory.
  - Rejects the nonexistent root `npm run start` command.
  - Compares documented React/Playwright/Deno values with package and CI sources.
  - Checks the current `_agile-output` and `.agents/skills` project contract is discoverable.
  - Requires the contract checker to emit actionable `DRIFT` and `ENVIRONMENT` classifications.

## Generation mode

AI generation mode selected. The story is a repository contract and documentation/configuration check, not a live UI interaction; browser recording would not add evidence.

## Test strategy

| Criterion | Primary red-phase assertion | Level | Priority |
| --- | --- | --- | --- |
| AC-1 | README documents an executable frontend command and no missing root start command | Unit | P1 |
| AC-2 | README version/port claims match manifests, CI and shared config | Unit | P1 |
| AC-3 | `scripts/validate-runtime-contract.sh` exists and emits `DRIFT` | Unit | P1 |
| AC-4 | The checker contains a separate `ENVIRONMENT` classification | Unit | P1 |

The four primary assertions are intentionally narrow; the implementation may add secondary checks, but a secondary assertion must not mask the criterion-defining failure.

## ATDD workflow adaptation

This story uses a Deno unit-test scaffold. API/E2E worker output and `test.skip()` scaffolds were not generated because the current Codex runtime exposes neither worker launcher; no API or browser journey is part of the acceptance criteria. The real unit tests remain active in the red phase so they can expose the current documentation/configuration drift.

## Red-phase result

Focused execution: `deno test --allow-read tests/unit/runtime-contract.test.ts`

- 1 passed: current BMAD/Codex project contract is discoverable.
- 4 failed as intended: stale README command/version claims and missing runtime-contract checker.

## Validate and complete

- Prerequisites: story spec, acceptance criteria, repository sources and red-phase test are captured.
- Test handoff: `tests/unit/runtime-contract.test.ts`.
- CLI sessions: none opened; no orphaned browser process.
- Temporary worker artifacts: none created; the workflow fallback was sequential and inline.

## Handoff

Run the focused test with `deno test --allow-read tests/unit/runtime-contract.test.ts` before implementation. The implementation should make the test green without duplicating version values into a second source of truth.
