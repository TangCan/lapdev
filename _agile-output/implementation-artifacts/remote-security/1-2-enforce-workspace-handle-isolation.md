---
status: ready-for-dev
story_id: '1.2'
story_key: 1-2-enforce-workspace-handle-isolation
---

# Story 1.2: Enforce workspace handle isolation

## User Story

As a remote operator,
I want a session to receive only an authorized workspace handle,
So that file and Agent operations cannot escape its workspace.

## Scope

Implement one `WorkspaceBoundary` service and use it for file and Agent path resolution. The boundary accepts only the deployment's assigned workspace handle, normalizes relative paths below the configured root, rejects traversal and host absolute paths, and resolves existing/new paths through real parent directories to prevent symlink escapes.

## Acceptance Criteria

### AC-1: Authorized handle normalization

**Given** a session requests a workspace operation
**When** `WorkspaceBoundary` normalizes and authorizes the workspace handle
**Then** the application service passes only the authorized handle to adapters.

### AC-2: Escape rejection before I/O

**Given** a request uses traversal, absolute host paths, symlinks or another workspace identifier
**When** the boundary evaluates it
**Then** the request is rejected before filesystem or Agent I/O.

### AC-3: Workspace separation

**Given** two sessions reference different workspaces
**When** both issue valid operations
**Then** neither session can observe or mutate the other workspace.

## Constraints

- Preserve the one-deployment/one-workspace remote-shared-v1 decision.
- Keep local-trusted behavior compatible with existing tests.
- Do not rely on lexical prefix checks alone; existing and new paths must account for symlink resolution.
- Return safe, stable rejection errors without exposing host paths.

## Affected Areas

- `backend/src/security/workspaceBoundary.ts`
- `backend/src/services/fileService.ts`
- `backend/src/handlers/agentHandler.ts`
- backend security and handler tests
- `_agile-output/test-artifacts/`

## Verification

- Boundary unit tests for valid handles, traversal, absolute paths, workspace mismatch, existing symlink and new-file parent symlink.
- Existing file and Agent tests remain green.
- `npm run test:backend`, full `npm test`, and Rust regression commands.

## Dev Notes

- Story 1.1 shared context: `backend/src/security/capability.ts`
- ATDD checklist: `_agile-output/test-artifacts/atdd-checklist-1-2-enforce-workspace-handle-isolation.md`
- Red-phase tests: `backend/src/security/workspaceBoundary.test.ts`
