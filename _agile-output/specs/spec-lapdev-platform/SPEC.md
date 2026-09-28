---
id: SPEC-lapdev-platform
companions:
  - '../../../AGENTS.md'
  - '../../planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md'
  - '../../planning-artifacts/research/technical-lapdev-project-implementation-and-docume-2026-09-28/research.md'
sources: []
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete contract for Lapdev platform hardening and extensibility.

# Lapdev Platform Hardening and Extensibility

## Why

Lapdev already combines a React/Vite IDE, Deno backend, Rust core, terminal, filesystem, Git, LSP, AI, Agent, BMAD and skills. Its next bottleneck is boundary inconsistency: privileged operations can diverge in authorization, frontend and backend can disagree about state, skill sources can be invisible or duplicated, and runtime/documentation/test contracts can drift. This work turns the existing system into a predictable platform that can be extended without multiplying security, lifecycle and compatibility defects.

## Capabilities

- **CAP-1**
  - **intent:** Agents and operators can discover the current runtime commands, BMAD artifacts and Codex/BMAD skills through one explainable project contract.
  - **success:** A clean setup follows one documented path; `.agents/skills` is discovered as the primary source; legacy skill/artifact sources are labelled; missing, duplicate or stale sources produce actionable diagnostics.

- **CAP-2**
  - **intent:** The system can authorize and audit workspace, file, terminal, Git, LSP, AI and Agent operations according to user, workspace and session policy.
  - **success:** The same authorization decision applies through HTTP and WebSocket; unauthorized or workspace-escaping operations are rejected; high-risk operations and denials have correlation data without exposing secrets.

- **CAP-3**
  - **intent:** Clients can reconnect and observe workspace and session changes without competing state owners or ambiguous event payloads.
  - **success:** Backend state remains authoritative; events carry stable type/version/workspace/session/request/revision metadata; stale or duplicate mutations cannot silently overwrite newer state.

- **CAP-4**
  - **intent:** Maintainers can add skill sources and language servers through registry and adapter contracts with consistent lifecycle and health behavior.
  - **success:** Adding a skill source or language does not duplicate transport, authorization or process-lifecycle logic; registry refresh and LSP failures are visible and recoverable.

- **CAP-5**
  - **intent:** Maintainers can verify implementation, tests, documentation and deployment contracts as one delivery quality signal.
  - **success:** CI catches command, version, port, artifact-path and documentation drift before image release, and distinguishes restricted-environment failures from real product regressions.

## Constraints

- Evolve the existing React/Vite, Deno/TypeScript, Rust-core monorepo and single deployment unit; do not require a microservice split.
- Backend application services own workspace, session, file, Git, LSP, skill and Agent state; frontend owns only view and temporary interaction state.
- Every privileged operation must pass through a capability context and policy profile; deployment permissions are a second, least-privilege boundary.
- Use a versioned event envelope across HTTP/WebSocket and capability events, with one shared error shape and explicit revision semantics.
- `.agents/skills` is the primary Codex/BMAD skill source; `.lapdev/skills` is a labelled legacy source; new BMAD artifacts belong under `_agile-output/`.
- LSP process lifecycle belongs to one backend LSP Manager; language-specific behavior belongs in adapters/configuration.
- Preserve secrets out of tracked files, browser-persisted configuration, logs and fixtures.

## Non-goals

- Splitting Lapdev into independently deployed microservices.
- Selecting a production identity provider, tenant model or remote secret-management vendor.
- Defining a complete public API schema or generated SDK before real consumers are inventoried.
- Expanding to more AI providers, remote collaboration or multi-user features before the capability and session boundaries are implemented.
- Replacing the existing frontend/backend stack solely to resolve current documentation or test drift.

## Success signal

A new maintainer can start, test and extend Lapdev from the documented contract; an implementation can add a skill source or language server without copying security or lifecycle code; and a remote or restricted test can demonstrate that unauthorized, stale, duplicate and workspace-escaping operations fail consistently before an image is released.

## Assumptions

- The initial implementation target remains a single repository and single deployment unit.
- Remote-shared mode will require explicit authentication, workspace isolation and terminal allowlist decisions, but those decisions are not yet selected.

## Open Questions

- Which authentication/session mechanism and workspace trust boundary will govern remote-shared mode?
- What terminal command allowlist and subprocess isolation policy are required outside local-trusted mode?
- Should `implementation_artifacts/sprint-status.yaml` move into `_agile-output/implementation-artifacts/`, or remain as an archival link?
