---
id: SPEC-lapdev-platform
companions:
  - '../../../AGENTS.md'
  - '../../planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md'
  - '../../planning-artifacts/research/technical-lapdev-project-implementation-and-docume-2026-09-28/research.md'
  - '../../planning-artifacts/research/technical-npm-cli-github-release-acr-2026-09-29/research.md'
  - 'release-runtime-contract.md'
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

- **CAP-6**
  - **intent:** Users can install a versioned npm CLI and start Lapdev locally without Docker/ACR or manually installing Deno/Rust, while maintainers retain a source-install path.
  - **success:** The CLI selects a supported platform runtime, verifies its versioned manifest and checksum, caches it outside the workspace, starts Lapdev on localhost, and reports actionable errors for unsupported platforms, unavailable assets or corrupted downloads.

## Constraints

- Evolve the existing React/Vite, Deno/TypeScript, Rust-core monorepo and single deployment unit; do not require a microservice split.
- Backend application services own workspace, session, file, Git, LSP, skill and Agent state; frontend owns only view and temporary interaction state.
- Every privileged operation must pass through a capability context and policy profile; deployment permissions are a second, least-privilege boundary.
- Use a versioned event envelope across HTTP/WebSocket and capability events, with one shared error shape and explicit revision semantics.
- `.agents/skills` is the primary Codex/BMAD skill source; `.lapdev/skills` is a labelled legacy source; new BMAD artifacts belong under `_agile-output/`.
- LSP process lifecycle belongs to one backend LSP Manager; language-specific behavior belongs in adapters/configuration.
- Preserve secrets out of tracked files, browser-persisted configuration, logs and fixtures.
- The primary release path is npm CLI plus GitHub Release platform runtimes; Docker/ACR is optional and not a release-success gate.
- Runtime manifests bind CLI version, Git tag, platform, architecture, target, asset, size, SHA-256 and build commit; downloads are verified before atomic cache installation.
- The first platform targets are Linux x64 and macOS arm64; Rust FFI libraries are target-built real files in the runtime archive and the default server bind is `127.0.0.1`.
- npm publication uses GitHub Actions OIDC Trusted Publishing; pull requests do not publish and protected `v*` tags are the release authority.

## Non-goals

- Splitting Lapdev into independently deployed microservices.
- Selecting a production identity provider, tenant model or remote secret-management vendor.
- Defining a complete public API schema or generated SDK before real consumers are inventoried.
- Expanding to more AI providers, remote collaboration or multi-user features before the capability and session boundaries are implemented.
- Replacing the existing frontend/backend stack solely to resolve current documentation or test drift.
- Making Docker/ACR or any container registry a prerequisite for the primary local installation path.
- Promising all operating systems before the target-specific runtime and FFI health checks exist.

## Success signal

A new maintainer can start, test and extend Lapdev from the documented contract; an implementation can add a skill source or language server without copying security or lifecycle code; users can install a pinned CLI and start a verified local runtime without Docker/ACR; and a remote or restricted test can demonstrate that unauthorized, stale, duplicate and workspace-escaping operations fail consistently.

## Assumptions

- The initial implementation target remains a single repository and single deployment unit.
- Remote-shared mode will require explicit authentication, workspace isolation and terminal allowlist decisions, but those decisions are not yet selected.

## Open Questions

- Which authentication/session mechanism and workspace trust boundary will govern remote-shared mode?
- What terminal command allowlist and subprocess isolation policy are required outside local-trusted mode?
- Should `implementation_artifacts/sprint-status.yaml` move into `_agile-output/implementation-artifacts/`, or remain as an archival link?
- Are GitHub Release assets reachable in target user environments, and is an offline/mirror installation path required?
- Is Windows part of the first supported platform wave, and what signing/attestation scheme follows the checksum MVP?
