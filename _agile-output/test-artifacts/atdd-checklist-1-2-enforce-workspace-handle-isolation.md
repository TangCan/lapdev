---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests']
lastStep: 'step-04-generate-tests'
lastSaved: '2026-09-29'
storyId: '1.2'
storyKey: '1-2-enforce-workspace-handle-isolation'
storyFile: '_agile-output/implementation-artifacts/remote-security/1-2-enforce-workspace-handle-isolation.md'
atddChecklistPath: '_agile-output/test-artifacts/atdd-checklist-1-2-enforce-workspace-handle-isolation.md'
generatedTestFiles:
  - 'backend/src/security/workspaceBoundary.test.ts'
inputDocuments:
  - '_agile-output/specs/spec-remote-security-and-deployment/SPEC.md'
  - '_agile-output/planning-artifacts/architecture/architecture-lapdev-remote-security-2026-09-29/ARCHITECTURE-SPINE.md'
  - '_agile-output/implementation-artifacts/remote-security/1-2-enforce-workspace-handle-isolation.md'
  - 'backend/src/services/fileService.ts'
  - 'backend/src/handlers/agentHandler.ts'
---

# ATDD Checklist — Epic 1, Story 1.2

**日期：** 2026-09-29  
**技术栈：** fullstack；主测试层为 backend unit/integration boundary

## Acceptance Criteria

| ID | 来源 | 验收标准 |
| --- | --- | --- |
| AC-1 | supplied | WorkspaceBoundary 规范化并授权 workspace handle，适配器只收到授权 handle。 |
| AC-2 | supplied | traversal、host absolute path、symlink、其他 workspace identifier 在 filesystem/Agent I/O 前拒绝。 |
| AC-3 | supplied | 不同 workspace 的 session 不能互相观察或修改。 |

## Strategy

- P0 unit: valid root/child handles, traversal, host absolute paths, wrong workspace id.
- P0 filesystem boundary: existing symlink and new-file parent symlink escape.
- P1 regression: existing fileService and Agent path behavior remains compatible.
- 不生成 UI/E2E/Pact 测试；本 Story 没有 UI 或服务契约行为。

## Red-Phase Scaffold

**File:** `backend/src/security/workspaceBoundary.test.ts`

- RED — boundary API does not yet exist; tests define the authorized workspace handle contract.
- Covers legal `/workspace` and child paths, traversal, absolute path, wrong workspace, and symlink escape.
