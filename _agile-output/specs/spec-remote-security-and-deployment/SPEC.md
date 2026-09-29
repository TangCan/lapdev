---
id: SPEC-remote-security-and-deployment
companions:
  - "../spec-lapdev-platform/SPEC.md"
  - "../../planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md"
  - "../../planning-artifacts/architecture/architecture-lapdev-remote-security-2026-09-29/ARCHITECTURE-SPINE.md"
  - "../../planning-artifacts/research/technical-lapdev-project-implementation-and-docume-2026-09-28/research.md"
  - "../../../AGENTS.md"
sources: []
---

> **Canonical contract.** This SPEC and its companions define the next Lapdev implementation scope for authenticated remote sharing and least-privilege deployment.

# Lapdev Remote Security and Least-Privilege Deployment

## Why

Lapdev now has capability boundaries, workspace checks, session binding and delivery gates, but remote-shared operation still lacks selected authentication, workspace isolation, command policy and deployment permission decisions. This work gives operators a defensible boundary for controlled remote access without turning the existing modular monolith into a microservice system.

## Capabilities

- **CAP-1**
  - **intent:** Authorized users can establish and reconnect sessions bound to an assigned workspace and capability policy.
  - **success:** Unauthenticated, expired, forged and cross-workspace sessions are rejected consistently over HTTP and WebSocket.

- **CAP-2**
  - **intent:** A remote session can operate only within its assigned workspace and explicitly allowed capabilities.
  - **success:** File, Agent, Git, terminal, LSP and AI requests cannot cross workspace or policy boundaries.

- **CAP-3**
  - **intent:** Operators can run permitted terminal and subprocess operations under an explicit remote policy.
  - **success:** Disallowed commands, environments, working directories and resource requests are rejected and audited without secret leakage.

- **CAP-4**
  - **intent:** Maintainers can start and health-check Lapdev under a selected least-privilege deployment profile.
  - **success:** The release image works with the smallest tested filesystem, network, environment and subprocess permissions and publishes only after the gate passes.

## Constraints

- Continue evolving the existing React/Vite, Deno/TypeScript, Rust-core monorepo and single deployment unit; do not require a microservice split.
- Every remote request must pass authentication, workspace isolation, capability policy and audit checks; Origin is not sufficient authorization.
- Remote-shared v1 uses a deployment-injected bootstrap access token exchanged for a short-lived server-side opaque session; it targets controlled single-workspace deployments.
- Remote-shared v1 denies arbitrary shell execution by default; only fixed Git/LSP adapters and explicitly configured capabilities may run subprocesses.
- Production startup must not use Deno `-A` or container-wide permissions as the application security boundary.
- Secrets must not enter tracked files, browser-persisted configuration, logs, events or test fixtures.
- Preserve the existing backend-owned workspace/session state model and capability adapters.

## Non-goals

- Selecting a production identity provider or secret-management vendor in this SPEC.
- Delivering a public multi-tenant SaaS architecture.
- Adding remote collaboration, multi-user editing or new AI providers.
- Splitting Lapdev into independently deployed services.

## Success signal

A controlled remote deployment can authenticate a session, bind it to the correct workspace and policy, reject unauthorized or cross-workspace operations over HTTP and WebSocket, and run the release image with a tested minimum permission profile. Audit records make each decision traceable without exposing credentials or sensitive prompts.

## Assumptions

- The initial target is a trusted-network or controlled remote-sharing deployment, not immediate public multi-tenant SaaS.
- Existing capability context, workspace boundary, WebSocket binding, audit and test foundations are the implementation starting point.
- The v1 workspace model is one deployment root bound to one remote session scope; multi-user membership and tenant switching are deferred.
- AI secrets are injected by the deployment environment and used only inside backend provider adapters; rotation is deployment-driven in v1.

## Open Questions

- When should v1 replace the deployment-injected token with an external identity provider?
- What workspace membership and tenant model is required before public multi-tenant deployment?
- Which additional command, network and resource policies should be added after the v1 deny-by-default baseline?
- When is an external secret store required instead of deployment environment injection?
- Which additional language adapters can be admitted to the fixed LSP executable catalog?
