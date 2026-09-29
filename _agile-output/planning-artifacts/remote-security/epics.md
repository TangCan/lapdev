---
stepsCompleted: ["draft"]
inputDocuments:
  - "../../specs/spec-remote-security-and-deployment/SPEC.md"
  - "../architecture/architecture-lapdev-remote-security-2026-09-29/ARCHITECTURE-SPINE.md"
  - "../../../AGENTS.md"
excludedDocuments: []
---

# Lapdev Remote Security and Least-Privilege Deployment — Epic Breakdown

## Requirements Inventory

### Capabilities

CAP-1: Authenticated remote sessions are bound to an assigned workspace and capability policy.

CAP-2: Remote sessions can operate only within their assigned workspace and explicitly allowed capabilities.

CAP-3: Terminal and subprocess operations follow an explicit remote policy and are audited without secret leakage.

CAP-4: Lapdev can start and pass health checks under a selected least-privilege deployment profile.

### Architecture Requirements

- Preserve the parent modular-monolith and backend-owned state invariants.
- Use one `AuthenticatedCapabilityContext` for HTTP and WebSocket requests.
- Enforce workspace boundaries through one `WorkspaceBoundary` service.
- Apply deny-by-default `remote-shared` policy to capability, cwd, executable, arguments, environment, network, resources and interactive mode.
- Route terminal and subprocess execution through `CommandPolicy` and one bounded process port.
- Keep secrets server/deployment-side and redact audit, event, telemetry and error output.
- Treat Deno, container, entrypoint and health-check permissions as one tested deployment profile.

### Resolved Decisions for remote-shared-v1

- A deployment-injected bootstrap access token is exchanged for a short-lived server-side opaque session; no external IdP is required for v1.
- One deployment exposes one workspace root; sessions cannot switch workspace or share membership across tenants.
- Arbitrary remote shell is disabled; Git uses an explicit read-only subcommand set and LSP uses a fixed executable catalog.
- AI secrets are injected by the deployment environment and never returned to remote clients; external secret storage is deferred.
- Deno/container permissions are explicit; `allow-run` is limited to fixed Git/LSP executables and the release gate tests allow/deny behavior.

### Deferred Decisions

- External identity provider and multi-user membership before public deployment.
- Additional command, network and resource policy entries after operational review.
- Additional LSP executables after adapter and permission-profile review.
- External secret store when rotation, ownership or compliance requires it.

## FR/Capability Coverage Map

CAP-1: Epic 1 — authenticated remote sessions and revalidation.
CAP-2: Epic 1 and Epic 2 — workspace isolation and capability authorization.
CAP-3: Epic 2 and Epic 3 — command policy, execution and redacted audit.
CAP-4: Epic 4 — least-privilege deployment profile and release gate.

## Epic List

### Epic 1: Authenticated Remote Sessions and Workspace Isolation

Operators can establish, reconnect and use a remote session that is bound to the correct principal, workspace and capability context.

### Epic 2: Deny-by-Default Capability Policy

Operators can execute only explicitly allowed file, Agent, Git, LSP, terminal and AI capabilities within the assigned workspace.

### Epic 3: Constrained Execution, Secrets and Audit

Operators can run permitted commands and AI operations with centralized policy decisions, server-side secrets and redacted traceable outcomes.

### Epic 4: Least-Privilege Release Deployment

Maintainers can build, start and health-check a release image under a named minimum-permission profile before publication.

## Epic 1: Authenticated Remote Sessions and Workspace Isolation

### Story 1.1: Resolve a shared authenticated capability context

As a remote operator,
I want every HTTP and WebSocket request resolved into one authenticated capability context,
So that identity, workspace and session authorization cannot diverge by transport.

**Acceptance Criteria:**

- **Given** an HTTP request or WebSocket upgrade includes valid session credentials
  **When** the transport adapter resolves the request
  **Then** it produces one context containing principal, workspace, session, deployment profile and requested capability.
- **Given** credentials are absent, expired, forged or malformed
  **When** the request reaches the application boundary
  **Then** it is rejected with the shared error shape and no adapter I/O occurs.
- **Given** a client reconnects
  **When** the session is revalidated
  **Then** the server checks the current workspace and capability policy instead of trusting stale client state.

### Story 1.2: Enforce workspace handle isolation

As a remote operator,
I want a session to receive only an authorized workspace handle,
So that file and Agent operations cannot escape its workspace.

**Acceptance Criteria:**

- **Given** a session requests a workspace operation
  **When** `WorkspaceBoundary` normalizes and authorizes the workspace handle
  **Then** the application service passes only the authorized handle to adapters.
- **Given** a request uses traversal, absolute host paths, symlinks or another workspace identifier
  **When** the boundary evaluates it
  **Then** the request is rejected before filesystem or Agent I/O.
- **Given** two sessions reference different workspaces
  **When** both issue valid operations
  **Then** neither session can observe or mutate the other workspace.

### Story 1.3: Revalidate session changes and disconnects

As a remote operator,
I want policy and workspace changes to affect existing connections,
So that a previously valid session cannot retain stale access.

**Acceptance Criteria:**

- **Given** a session expires, is revoked or loses a capability
  **When** it sends a new request or reconnects
  **Then** the request is rejected or re-scoped using current server state.
- **Given** a WebSocket session is disconnected
  **When** its session record is closed or invalidated
  **Then** capability operations and terminal registrations cannot continue under the stale session.
- **Given** an authorization decision changes
  **When** the server emits a security event
  **Then** the event contains correlation and session metadata without credentials.

## Epic 2: Deny-by-Default Capability Policy

### Story 2.1: Define explicit remote capability policy

As an operator,
I want remote capabilities to be denied unless explicitly allowed,
So that newly added operations do not become remotely available by accident.

**Acceptance Criteria:**

- **Given** a `remote-shared` policy evaluates a capability
  **When** no matching rule exists
  **Then** the capability is denied by default.
- **Given** a rule grants a capability
  **When** the request context, workspace and session do not match its scope
  **Then** the request remains denied.
- **Given** a local-trusted policy is configured
  **When** a remote request is evaluated
  **Then** local-trusted permissions are not implicitly inherited.

### Story 2.2: Apply policy to file, Agent, Git and LSP operations

As a remote operator,
I want all workspace capabilities to use the same policy decision,
So that one operation cannot bypass restrictions enforced by another.

**Acceptance Criteria:**

- **Given** file, Agent, Git or LSP operations use an authorized workspace handle
  **When** the application service evaluates them
  **Then** capability and workspace policy are checked before adapter I/O.
- **Given** an operation requests a disallowed capability or resource
  **When** policy evaluation completes
  **Then** it is rejected consistently over HTTP and WebSocket.
- **Given** a policy decision succeeds or fails
  **When** the operation completes
  **Then** its decision reason and correlation data are available to audit without secrets.

### Story 2.3: Apply policy to AI operations

As a remote operator,
I want AI requests scoped to the session and workspace policy,
So that remote agents cannot use unauthorized tools or workspace data.

**Acceptance Criteria:**

- **Given** an AI request includes workspace context or Agent capabilities
  **When** the application service evaluates it
  **Then** file, terminal and Agent capabilities are checked independently before use.
- **Given** an AI request is outside the session policy
  **When** authorization runs
  **Then** it is rejected without sending the request to a provider.
- **Given** an AI request succeeds or fails
  **When** it is logged or emitted
  **Then** keys and complete sensitive prompts are absent.

## Epic 3: Constrained Execution, Secrets and Audit

### Story 3.1: Centralize command and subprocess policy

As an operator,
I want terminal, Git and subprocess commands evaluated by one policy gate,
So that shell and process paths cannot bypass remote restrictions.

**Acceptance Criteria:**

- **Given** a process request includes executable, arguments, cwd, environment, network target, resources or interactive mode
  **When** `CommandPolicy` evaluates it
  **Then** the normalized decision is allow or deny before the process port is called.
- **Given** the command uses shell composition, a disallowed executable, an invalid cwd or an unapproved environment variable
  **When** the policy evaluates it
  **Then** it is denied without process creation.
- **Given** a command is denied, terminated or fails
  **When** its audit event is emitted
  **Then** the event includes a safe decision reason and correlation data but not secret arguments or environment values.

### Story 3.2: Enforce server-side secret handling

As a remote operator,
I want AI and deployment secrets to remain server-side,
So that browser state and events cannot expose credentials.

**Acceptance Criteria:**

- **Given** a remote client reads configuration status
  **When** the backend responds
  **Then** it returns capability/configuration state without secret material.
- **Given** a provider operation requires a key
  **When** the application service invokes the adapter
  **Then** the key is resolved within the backend or deployment secret boundary.
- **Given** logs, errors, events, telemetry or fixtures contain provider data
  **When** redaction runs
  **Then** keys, tokens and complete sensitive prompts are removed or masked.

### Story 3.3: Emit correlated security audit events

As an operator,
I want denied and high-risk operations to be traceable,
So that remote incidents can be investigated without collecting secrets.

**Acceptance Criteria:**

- **Given** a request is allowed, denied, expired, revoked or causes a process failure
  **When** the backend records the outcome
  **Then** it uses the versioned event envelope with principal, workspace, session, request and revision context.
- **Given** multiple adapters participate in one request
  **When** telemetry is collected
  **Then** correlation identifiers connect transport, policy, application and adapter outcomes.
- **Given** an audit sink is unavailable
  **When** a high-risk operation is evaluated
  **Then** the configured fail-open/fail-closed behavior is explicit and tested rather than accidental.

## Epic 4: Least-Privilege Release Deployment

### Story 4.1: Define named deployment permission profiles

As an operator,
I want a named deployment profile describing required permissions,
So that local-trusted and remote-shared deployments are reproducible and reviewable.

**Acceptance Criteria:**

- **Given** a deployment profile is selected
  **When** startup configuration is loaded
  **Then** filesystem, network, environment and subprocess permissions are resolved from that profile.
- **Given** a remote-shared profile omits a permission
  **When** an operation requests it
  **Then** the application denies it or reports an explicit unsupported capability.
- **Given** an unknown or malformed profile is selected
  **When** startup validates configuration
  **Then** startup fails with a safe diagnostic before serving remote requests.

### Story 4.2: Replace full-permission startup with tested minimum permissions

As a maintainer,
I want the release entrypoint to use the smallest tested permissions,
So that deployment security does not depend on Deno `-A` or container-wide access.

**Acceptance Criteria:**

- **Given** the release image starts under the selected profile
  **When** the entrypoint launches the backend
  **Then** it uses explicit Deno/container permissions rather than unrestricted full access.
- **Given** required workspace, health, WebSocket, Git, LSP and process operations run
  **When** the minimum profile tests execute
  **Then** allowed operations succeed and denied operations fail at the intended boundary.
- **Given** a permission is missing
  **When** the service starts or handles a capability
  **Then** the failure identifies the profile and capability without exposing host secrets.

### Story 4.3: Add release permission and health gate

As a maintainer,
I want CI to verify minimum-permission startup before publishing an image,
So that a green build cannot hide an unsafe or unusable deployment.

**Acceptance Criteria:**

- **Given** code, tests and an image are ready for release
  **When** the release gate runs
  **Then** layered tests, profile validation, minimum-permission startup and health checks all pass before publication.
- **Given** a restricted environment prevents a check from running
  **When** the gate classifies the result
  **Then** it reports an environment limitation separately from a product or security failure.
- **Given** the image exposes an unexpected port, path or permission
  **When** the gate compares runtime and documented contract
  **Then** publication is blocked with an actionable drift finding.
