---
status: ready-for-dev
story_id: '1.1'
story_key: 1-1-resolve-a-shared-authenticated-capability-context
---

# Story 1.1: Resolve a shared authenticated capability context

## User Story

As a remote operator,
I want every HTTP and WebSocket request resolved into one authenticated capability context,
So that identity, workspace and session authorization cannot diverge by transport.

## Scope

Implement the `remote-shared-v1` authentication boundary for the existing modular monolith:

- deployment-injected `LAPDEV_REMOTE_ACCESS_TOKEN` bootstrap secret;
- short-lived server-side opaque session after successful authentication;
- `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/` browser session cookie;
- shared `AuthenticatedCapabilityContext` for HTTP and WebSocket paths;
- rejection of absent, expired, forged and malformed credentials before adapter I/O;
- session revalidation on reconnect.

This story does not implement multi-user membership, external identity providers, or arbitrary remote terminal execution.

## Acceptance Criteria

### AC-1: Shared context for HTTP and WebSocket

**Given** an HTTP request or WebSocket upgrade includes valid session credentials
**When** the transport adapter resolves the request
**Then** it produces one context containing principal, workspace, session, deployment profile and requested capability.

### AC-2: Invalid credentials rejected before I/O

**Given** credentials are absent, expired, forged or malformed
**When** the request reaches the application boundary
**Then** it is rejected with the shared error shape and no adapter I/O occurs.

### AC-3: Reconnect uses current server state

**Given** a client reconnects
**When** the session is revalidated
**Then** the server checks the current workspace and capability policy instead of trusting stale client state.

### AC-4: Secure browser session handling

**Given** a browser authenticates successfully over HTTPS
**When** the server issues the session
**Then** the session cookie is Secure, HttpOnly, SameSite=Lax, Path=/, short-lived and absent from URL/localStorage/logs.

## Constraints

- Preserve parent architecture AD-1, AD-2, AD-3, AD-6 and AD-7.
- Do not use Origin as authentication.
- Do not log or return the bootstrap token, opaque session value or raw credentials.
- Keep the implementation compatible with local-trusted mode and existing unauthenticated local test fixtures through an explicit test/development profile only.
- Workspace and capability policy enforcement remains in application services; transport adapters only normalize and pass context.

## Affected Areas

- `backend/src/main.ts` and HTTP/WebSocket routing
- backend capability/session services and shared error/event types
- existing WebSocket session-binding policy
- backend API and WebSocket tests
- `_agile-output/test-artifacts/`

## Verification

- Backend unit tests for context resolution, token exchange, cookie flags, expiry, forged token and profile behavior.
- HTTP integration tests for protected route rejection and successful context propagation.
- WebSocket tests for upgrade rejection, session binding and reconnect revalidation.
- `npm run test:backend`, relevant API tests, full `npm test`, and Rust regression commands available in the repository.

## Dev Notes

- ATDD checklist: `_agile-output/test-artifacts/atdd-checklist-1-1-resolve-a-shared-authenticated-capability-context.md`
- Red-phase test scaffold: `backend/src/security/authSession.test.ts`
