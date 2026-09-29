---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - "_agile-output/specs/spec-lapdev-platform/SPEC.md"
  - "_agile-output/planning-artifacts/architecture/architecture-lapdev-2026-09-28/ARCHITECTURE-SPINE.md"
  - "_agile-output/planning-artifacts/research/technical-lapdev-project-implementation-and-docume-2026-09-28/research.md"
  - "_agile-output/planning-artifacts/research/technical-npm-cli-github-release-acr-2026-09-29/research.md"
  - "_agile-output/specs/spec-lapdev-platform/release-runtime-contract.md"
  - "AGENTS.md"
excludedDocuments:
  - "docs/prd.md"
  - "docs/architecture.md"
  - "docs/epics.md"
---

# lapdev - Epic Breakdown

## Overview

This document will decompose the current Lapdev platform hardening and extensibility specification into implementable epics and stories. The current source of truth is the SPEC and its adopted architecture/research/project-context companions; legacy planning documents are excluded because they describe an earlier performance-optimization plan.

## Requirements Inventory

### Functional Requirements

FR1: Agents and operators can discover the current runtime commands, BMAD artifacts and Codex/BMAD skills through one explainable project contract.

FR2: The system can authorize and audit workspace, file, terminal, Git, LSP, AI and Agent operations according to user, workspace and session policy.

FR3: Clients can reconnect and observe workspace and session changes without competing state owners or ambiguous event payloads.

FR4: Maintainers can add skill sources and language servers through registry and adapter contracts with consistent lifecycle and health behavior.

FR5: Maintainers can verify implementation, tests, documentation and deployment contracts as one delivery quality signal.

FR6: Users can install a versioned npm CLI and start Lapdev locally without Docker/ACR or manually installing Deno/Rust, while maintainers retain a source-install path.

### NonFunctional Requirements

NFR1: Every privileged operation must pass through a capability context and policy profile, with deployment permissions as a second least-privilege boundary.

NFR2: Backend application services are the sole owners of workspace, session, file, Git, LSP, skill and Agent state; frontend state is presentation or temporary interaction state.

NFR3: Cross-module HTTP/WebSocket events use a versioned envelope with stable type, workspace, session, request and revision metadata plus a shared error shape.

NFR4: `.agents/skills` is the primary Codex/BMAD source; `.lapdev/skills` is an explicitly labelled legacy source; new BMAD artifacts use `_agile-output/`.

NFR5: LSP process lifecycle is owned by one backend LSP Manager; language-specific behavior belongs in adapters/configuration.

NFR6: Secrets must not enter tracked files, browser-persisted configuration, logs or test fixtures.

NFR7: The initial implementation remains a single repository and single deployment unit; it must not require a microservice split.

NFR8: CI must distinguish restricted-environment failures from real product regressions and catch command, version, port, artifact-path and documentation drift before image release.

NFR9: The primary release path must not require Docker or a Docker Registry; Docker/ACR is optional and not a release-success gate.

NFR10: Runtime manifests must bind CLI version, Git tag, platform, architecture, target, asset, size, SHA-256 and build commit; downloads must be verified before atomic cache installation.

NFR11: Rust FFI libraries must be built for explicit target triples and distributed as real platform files; the first supported targets are Linux x64 and macOS arm64.

NFR12: npm publication must use GitHub Actions OIDC Trusted Publishing; pull requests must not publish and protected `v*` tags must be the release authority.

NFR13: The CLI must cache runtime assets outside the workspace and bind the server to `127.0.0.1` by default; secrets and user workspace data must not enter release archives.

### Additional Requirements

- Use a modular-monolith architecture with capability boundaries and ports-and-adapters.
- Route terminal, file, Git, LSP, AI, Agent and skill operations through application services; adapters perform bounded I/O but do not grant authorization.
- Resolve a capability context for every HTTP/WebSocket session and enforce local-trusted versus remote-shared policy profiles.
- Make the backend the authoritative owner of external and durable workspace/session state; frontend updates arrive through versioned events.
- Implement SkillRegistry source adapters without copying or rewriting skill contents, with source, identity, enabled state, refresh time and error diagnostics.
- Implement LSP Manager lifecycle per workspace/session, including capability negotiation, cancellation, diagnostic revisions, health, restart and cleanup.
- Keep `_agile-output/` as the current BMAD output root; treat `implementation_artifacts/` as migration/archive input until explicitly resolved.
- Preserve current stack reality: React 19.2.x, Vite 6.x, TypeScript 5.x, Deno 2.8.2 in CI, Vitest 2.0.5, Playwright 1.60.0 and Rust edition 2021.
- Add observability and audit correlation for HTTP, WebSocket, terminal, LSP, file, Agent and AI operations without logging secrets or complete sensitive prompts.
- Add an npm CLI with `web`, `doctor` and `version` commands; platform runtime selection, manifest lookup, checksum verification, cache isolation and local startup are explicit contracts.
- Build target-specific runtime archives containing the Deno/backend launcher, React/Vite output, shared assets and Rust FFI library; publish archives as GitHub Release assets keyed by protected Git tags.
- Keep source installation for contributors and add smoke tests for clean-cache startup, unsupported platforms, corrupt downloads and Deno/Rust FFI loading.
- Confirm later whether offline/mirror installation, Windows first-wave support and signed attestations are required; do not silently assume them.

### UX Design Requirements

None supplied. The current stories are platform, security and delivery work; UI-specific interaction requirements should be added through a future UX design contract before UI stories depend on them.

### FR Coverage Map

FR1: Epic 1 - 可靠的项目与技能发现
FR2: Epic 2 - 安全可控的工作区操作
FR3: Epic 3 - 一致的多客户端与 Agent 状态
FR4: Epic 4 - 可扩展的技能与语言能力
FR5: Epic 5 - 可信的交付与发布验证
FR6: Epic 6 - npm CLI 与平台运行时发布

## Epic List

### Epic 1: 可靠的项目启动与技能发现

开发者能按统一契约启动项目、找到 BMAD/Codex 技能和当前项目产物，并能解释技能或产物为何不可见。
**FRs covered:** FR1

### Epic 2: 安全的工作区与 Agent 操作

用户可以安全执行文件、终端、Git、LSP、AI 和 Agent 操作；越权、越界和未认证操作会被一致拒绝并留下审计线索。
**FRs covered:** FR2

### Epic 3: 一致的多客户端与实时状态

用户刷新、重连或同时使用 Agent/编辑器时，看到的工作区、会话和事件状态仍然一致，不会被旧事件静默覆盖。
**FRs covered:** FR3

### Epic 4: 可扩展的技能与语言能力

维护者可以新增技能来源或语言服务器，而不复制授权、传输和进程生命周期逻辑；用户能看到刷新、健康和失败状态。
**FRs covered:** FR4

### Epic 5: 可信的测试、发布与运维验证

维护者能在发布镜像前确认代码、测试、文档、版本、端口、产物路径和最小权限运行契约一致，并区分环境限制与真实回归。
**FRs covered:** FR5

### Epic 6: 一键安装与本地运行时发布

用户可以通过固定版本的 npm CLI 启动 Lapdev，而不需要 Docker、ACR、Deno 或 Rust 工具链；维护者可以为受支持的平台构建、校验并发布对应 runtime，并保留源码安装路径。
**FRs covered:** FR6

## Epic 1: 可靠的项目与技能发现

开发者能按统一契约启动项目、找到 BMAD/Codex 技能和当前项目产物，并能解释技能或产物为何不可见。

### Story 1.1: 统一运行时命令与项目契约

As a maintainer,
I want one executable runtime contract for development, testing, ports and versions,
So that a clean setup does not rely on stale README assumptions.

**Requirements:** FR1, NFR8

**Acceptance Criteria:**

**Given** a clean checkout and the current package, frontend, backend, container and CI configuration
**When** a maintainer follows the documented development, test and health-check commands
**Then** each command resolves to an existing script or an explicitly documented directory-specific command
**And** frontend, backend, test, container and health-check entrypoints use one consistent port/version contract
**And** a documentation drift check fails when a documented command, port or version no longer matches its source configuration

### Story 1.2: 统一 BMAD 产物目录与迁移映射

As a BMAD user,
I want current planning and implementation artifacts to resolve under `_agile-output`,
So that project status and workflow skills can find the same state.

**Requirements:** FR1, NFR4

**Acceptance Criteria:**

**Given** current BMAD configuration points to `_agile-output`
**When** a planning or implementation skill resolves its output and project status paths
**Then** it reads and writes current artifacts under `_agile-output`
**And** the legacy `implementation_artifacts` location is classified as migrated, archived, or explicitly pending rather than silently ignored
**And** `$bmad-help` and sprint/status workflows resolve the same current status location
**And** migration preserves existing artifact content and does not silently overwrite files

### Story 1.3: 统一 Codex/BMAD 技能发现诊断

As a Codex/BMAD user,
I want skill discovery to explain source, precedence and errors,
So that an installed skill is either visible or diagnosable.

**Requirements:** FR1, NFR4

**Acceptance Criteria:**

**Given** skill directories contain valid, duplicate, malformed or incomplete skill entries
**When** the project refreshes or queries available skills
**Then** `.agents/skills` is reported as the primary Codex/BMAD source
**And** `.lapdev/skills` is reported as an explicitly labelled legacy source
**And** duplicate identities, missing `SKILL.md`, parse failures and refresh failures have actionable diagnostics
**And** discovery does not copy or rewrite skill content
**And** a user can identify why a known installed skill is not visible

## Epic 2: 安全可控的工作区操作

用户可以安全执行文件、终端、Git、LSP、AI 和 Agent 操作；越权、越界和未认证操作会被一致拒绝并留下审计线索。
**FRs covered:** FR2

### Story 2.1: 统一 Capability Context 与 Policy Profile

As a workspace operator,
I want every privileged request to carry one capability context and policy profile,
So that authorization is consistent across features.

**Requirements:** FR2, NFR1

**Acceptance Criteria:**

**Given** an HTTP request or WebSocket connection invokes a privileged capability
**When** the backend resolves the request context
**Then** it identifies the user, workspace, session and requested capabilities through one shared context shape
**And** local-trusted and remote-shared policy profiles are distinguishable
**And** unauthorized capabilities are rejected with the shared error shape
**And** policy decisions are auditable without recording secrets or complete sensitive prompts

### Story 2.2: 工作区路径边界与文件操作授权

As a user,
I want file and Agent operations restricted to the configured workspace,
So that requests cannot read or modify arbitrary host paths.

**Requirements:** FR2, NFR1

**Acceptance Criteria:**

**Given** a file or Agent operation requests a path
**When** the application service authorizes and normalizes the operation
**Then** reads, writes, creates, deletes and renames remain within the configured workspace boundary
**And** path traversal, absolute-path escape and symlink escape attempts are rejected
**And** rejected operations use the shared error shape and include correlation data
**And** local and API tests cover valid paths, boundary paths and escape attempts

### Story 2.3: 终端、Git 与子进程最小权限

As a workspace operator,
I want terminal, Git and subprocess operations constrained by policy,
So that powerful host operations are explicit and auditable.

**Requirements:** FR2, NFR1, NFR6

**Acceptance Criteria:**

**Given** a terminal, Git or subprocess operation is requested
**When** the capability policy evaluates its command, environment and working directory
**Then** the operation is allowed only under the active policy profile and workspace boundary
**And** production startup does not rely on Deno `-A` as the application security control
**And** high-risk commands, failures and terminations produce audit events without secret values
**And** denied commands and invalid working directories are tested through the same application boundary

### Story 2.4: WebSocket 会话认证与敏感信息保护

As a remote user,
I want WebSocket and AI interactions bound to an authenticated session,
So that browser connections and credentials cannot cross user or workspace boundaries.

**Requirements:** FR2, NFR1, NFR6

**Acceptance Criteria:**

**Given** a client opens or reconnects a WebSocket or starts an AI operation
**When** the backend authenticates and evaluates the session
**Then** the connection is bound to the authorized user, workspace and session rather than relying only on Origin
**And** disconnect, reconnect and capability changes trigger appropriate session revalidation
**And** AI keys do not enter logs, events or unnecessary browser persistence
**And** unauthenticated, forged-session and cross-workspace attempts are rejected

## Epic 3: 一致的多客户端与 Agent 状态

用户刷新、重连或同时使用 Agent/编辑器时，看到的工作区、会话和事件状态仍然一致，不会被旧事件静默覆盖。
**FRs covered:** FR3

### Story 3.1: 后端权威状态与 Revision 模型

As a user,
I want workspace and session state to have one backend owner,
So that editor, Agent and reconnecting clients do not diverge.

**Requirements:** FR3, NFR2

**Acceptance Criteria:**

**Given** workspace, session, file, terminal, LSP or Agent state changes
**When** an application service applies the mutation
**Then** the backend remains the single owner of the external state
**And** frontend state is limited to presentation and temporary input state
**And** the state change receives a monotonic workspace/session revision
**And** duplicate or stale mutations cannot overwrite newer state

### Story 3.2: 统一版本化 Event Envelope

As a client integrator,
I want all cross-module events to share a versioned envelope,
So that clients can consume file, terminal, LSP, Agent and skill events consistently.

**Requirements:** FR3, NFR3

**Acceptance Criteria:**

**Given** an application service emits an HTTP or WebSocket result/event
**When** a client receives the message
**Then** it contains `type`, `version`, `workspaceId`, `sessionId`, `revision` and `requestId`
**And** failures use the shared error shape without leaking secrets
**And** capability-specific data remains inside the capability payload
**And** consumers tolerate unknown fields and explicit event-version changes have a compatibility rule

### Story 3.3: 重连、同步与 Stale Event 处理

As a user,
I want a reconnecting client to resynchronize safely,
So that temporary network failures do not produce stale UI or lost updates.

**Requirements:** FR3, NFR3

**Acceptance Criteria:**

**Given** a client disconnects, reconnects or receives a revision gap
**When** it requests or receives synchronization data
**Then** it can resume from a valid revision or receive an explicit full-state synchronization response
**And** duplicate events are handled idempotently
**And** stale events cannot overwrite current state
**And** synchronization failures return a diagnosable shared error

### Story 3.4: 文件监听、Agent 和实时能力事件协调

As a user,
I want external file changes, Agent writes and live capability output to appear in a deterministic order,
So that the editor reflects the actual workspace.

**Requirements:** FR3, NFR2, NFR3

**Acceptance Criteria:**

**Given** file watchers, Agent operations, terminal output or LSP diagnostics produce concurrent events
**When** the backend publishes them to one or more clients
**Then** file watcher and Agent/file API updates do not create duplicate or conflicting state transitions
**And** terminal, LSP and Agent events carry the relevant workspace/session/revision metadata
**And** event ordering, loss and replay boundaries are documented and tested
**And** multiple clients observe the same final workspace state

## Epic 4: 可扩展的技能与语言能力

维护者可以新增技能来源或语言服务器，而不复制授权、传输和进程生命周期逻辑；用户能看到刷新、健康和失败状态。
**FRs covered:** FR4

### Story 4.1: 可配置的 Skill Source Registry

As a maintainer,
I want to register and inspect skill sources,
So that new project or user sources can be enabled without changing transport or Agent logic.

**Requirements:** FR4, NFR4

**Acceptance Criteria:**

**Given** the project has primary, legacy or explicitly enabled user skill directories
**When** a maintainer lists or refreshes skill sources
**Then** each source is handled through the same source-adapter contract
**And** `.agents/skills`, `.lapdev/skills` and user sources retain distinct source identity, enabled state, priority, version and refresh metadata
**And** same-name conflicts are reported instead of silently overwritten
**And** source registration does not require changes to transport or Agent authorization code

### Story 4.2: 技能解析、刷新与健康诊断

As a user,
I want skill parsing and refresh failures to be visible,
So that broken or stale skills do not silently disappear.

**Requirements:** FR4, NFR4

**Acceptance Criteria:**

**Given** a source contains valid, incomplete, malformed or stale skill entries
**When** the registry parses or refreshes the source
**Then** it reads `SKILL.md` and exposes optional references, scripts and assets without rewriting source files
**And** missing files, invalid format, refresh failures and duplicate identities have structured status and actionable diagnostics
**And** UI/API consumers can explain whether a skill is available, disabled, stale or failed and why
**And** a failed refresh does not erase the last known source metadata without an explicit policy decision

### Story 4.3: LSP Manager Workspace/Session 生命周期

As a developer,
I want language servers managed per workspace and session,
So that editor features start, stop and reconnect predictably.

**Requirements:** FR4, NFR5

**Acceptance Criteria:**

**Given** a workspace/session requests a language capability
**When** the backend starts or reuses a language-server process
**Then** workspace root, session, process and negotiated capabilities have an explicit association
**And** start, stop, cancel, reconnect and resource cleanup follow one Manager lifecycle
**And** the frontend uses language services only through the backend LSP capability
**And** process health and failure reasons are observable through the shared event/error contract

### Story 4.4: 语言 Adapter 健康与故障恢复

As a developer,
I want language-specific adapters to report health and recover from crashes,
So that adding a language does not duplicate lifecycle logic.

**Requirements:** FR4, NFR5

**Acceptance Criteria:**

**Given** a language adapter has different capabilities, diagnostics or failure behavior
**When** the LSP Manager invokes it or detects timeout, crash or capability mismatch
**Then** language-specific behavior remains in adapter/configuration rather than transport or authorization code
**And** diagnostics carry the applicable revision and stale results are ignored
**And** crashed or unhealthy servers can be restarted or explicitly degraded with an actionable status
**And** adding a language requires only adapter/configuration and focused tests, not a second lifecycle implementation

## Epic 5: 可信的交付与发布验证

维护者能在发布镜像前确认代码、测试、文档、版本、端口、产物路径和最小权限运行契约一致，并区分环境限制与真实回归。
**FRs covered:** FR5

### Story 5.1: 分层测试与环境限制分类

As a maintainer,
I want test failures classified by layer and environment,
So that sandbox restrictions are not confused with product regressions.

**Requirements:** FR5, NFR8

**Acceptance Criteria:**

**Given** the repository runs frontend, backend, API, E2E, Rust and container checks
**When** a test command completes in local or CI environments
**Then** the result identifies the applicable test layer and failure category
**And** shell subprocess restrictions such as `spawnSync /bin/sh EPERM` are adapted or explicitly classified
**And** React Compiler version/configuration assertions are deterministic
**And** CI distinguishes environment failure, test failure and product regression

### Story 5.2: 文档与运行时契约 Drift Gate

As a maintainer,
I want CI to check commands, ports, versions and artifact paths against source configuration,
So that documentation remains executable.

**Requirements:** FR5, NFR8

**Acceptance Criteria:**

**Given** README, architecture docs, BMAD config, manifests and CI workflows describe runtime behavior
**When** the documentation drift check runs
**Then** root, frontend and backend commands are checked against actual scripts
**And** documented ports and health-check endpoints are checked against runtime and CI configuration
**And** React, Vite, Deno and Playwright version claims are checked against their source manifests/configuration
**And** `_agile-output` and legacy artifact/skill path references are reported when inconsistent

### Story 5.3: 最小权限容器与部署健康门禁

As an operator,
I want release images tested under the intended permission profile,
So that a green build does not hide an unsafe or unusable deployment.

**Requirements:** FR5, NFR1, NFR7

**Acceptance Criteria:**

**Given** a release image starts the Deno backend and exposes the configured workspace
**When** the release pipeline runs its deployment gate
**Then** production startup does not use `-A` as the only application security boundary
**And** the container starts with the smallest tested Deno/container permissions for its selected profile
**And** workspace, environment-variable, network and subprocess permissions are verifiable
**And** layered tests, minimum-permission startup and the health check pass before image publication

### Story 5.4: 可观测性与审计质量门禁

As an operator,
I want correlated telemetry for HTTP, WebSocket, terminal, LSP, file, Agent and AI operations,
So that failures can be diagnosed without exposing secrets.

**Requirements:** FR5, NFR6

**Acceptance Criteria:**

**Given** a request or capability operation crosses transport, application and adapter boundaries
**When** it succeeds, fails, is denied or causes a restart
**Then** telemetry and audit data carry correlation/request/session/workspace context
**And** latency, errors, restarts, denials and relevant resource usage are observable
**And** API keys, sensitive command arguments and complete sensitive prompts are redacted
**And** audit and telemetry redaction rules have automated checks

## Epic 6: 一键安装与本地运行时发布

用户可以通过固定版本的 npm CLI 启动 Lapdev，而不需要 Docker、ACR、Deno 或 Rust 工具链；维护者可以为受支持平台构建、校验和发布 runtime，并保留源码安装路径。
**FRs covered:** FR6

### Story 6.1: CLI 命令与本地启动契约

As a Lapdev user,
I want a versioned npm CLI with web, doctor and version commands,
So that I can start or diagnose Lapdev through one predictable local entry point.

**Requirements:** FR6, NFR9, NFR13

**Acceptance Criteria:**

**Given** a clean Node.js installation and a packaged CLI tarball
**When** a user runs `npx --yes --package <cli-tarball> lapdev version`
**Then** the CLI prints its package version and supported command summary
**And** it does not require Docker, Podman, Deno or a Rust toolchain to execute the CLI itself

**Given** a valid local runtime fixture supplied through `--runtime-dir`
**When** a user runs `npx --yes --package <cli-tarball> lapdev web --runtime-dir <fixture> --no-open`
**Then** the CLI starts the runtime and prints the local HTTP URL
**And** the default bind address is `127.0.0.1`
**And** the process exits with a non-zero code and an actionable message if the fixture is missing or incomplete

**Given** the CLI is invoked with `doctor`
**When** the command checks the current platform, Node version, runtime directory and cache configuration
**Then** it reports each check as pass, warning or failure without exposing secrets or workspace contents

**Given** an unsupported command, option or platform
**When** the CLI parses the invocation
**Then** it prints concise usage guidance and a stable non-zero exit code
**And** it does not download, execute or modify an untrusted path

**Given** the existing source-install development path
**When** maintainers run the documented source commands
**Then** adding the CLI package does not change or break the source development entrypoints

### Story 6.2: Runtime Manifest、平台选择与缓存

As a Lapdev user,
I want the CLI to select and cache the runtime that matches my platform and CLI version,
So that installation is reproducible and does not mix incompatible native assets.

**Requirements:** FR6, NFR10, NFR11, NFR13

**Acceptance Criteria:**

**Given** a CLI version and a manifest containing supported platform, architecture, target, asset URL, size, checksum and build commit
**When** the CLI resolves a runtime
**Then** it selects only the entry whose version, `process.platform` and `process.arch` match
**And** it rejects an entry with a missing field, unsupported target or mismatched CLI version

**Given** a runtime download is required
**When** the CLI downloads the archive
**Then** it writes the response to a temporary file outside the workspace
**And** it verifies the declared size and SHA-256 before installation
**And** it atomically moves the verified archive or extracted runtime into a versioned user cache directory

**Given** a verified runtime already exists in the cache
**When** the user runs `web` again with the same CLI version and platform
**Then** the CLI reuses the cached runtime without downloading it again
**And** the cache lookup confirms the manifest identity and integrity before startup

**Given** a partial, corrupt, stale or incompatible cache entry
**When** the CLI resolves the runtime
**Then** it does not execute the entry
**And** it removes or quarantines the invalid entry and reports the reason

**Given** the user passes `--offline`
**When** no verified matching cache entry exists
**Then** the CLI fails without making a network request
**And** the error identifies the required version and platform

**Given** the user passes `--runtime-dir` for controlled development or testing
**When** the CLI validates that directory
**Then** it applies the same manifest/layout checks before startup
**And** it never treats arbitrary workspace files as a trusted runtime by default

### Story 6.3: Deno、Rust 与前端 Runtime Archive

As a release maintainer,
I want reproducible platform runtime archives containing all required Lapdev assets,
So that a supported user platform can run Lapdev without installing the project toolchain.

**Requirements:** FR6, NFR7, NFR10, NFR11, NFR13

**Acceptance Criteria:**

**Given** the release target is `linux-x64` or `darwin-arm64`
**When** the runtime build runs with the target-specific configuration
**Then** it produces an archive with a stable platform identifier and target triple
**And** the archive contains a runnable Deno/backend launcher, the built React/Vite assets, backend/shared runtime files and the target Rust FFI library

**Given** the Rust core is built for a release target
**When** the archive is assembled
**Then** the dynamic library uses the expected platform extension and ABI target
**And** the runtime layout allows Deno FFI to load it as a real file without relying on the caller's current working directory

**Given** the runtime archive is inspected before publication
**When** the packaging check runs
**Then** it includes `bin`, `lib`, `app`, manifest and license areas according to the runtime contract
**And** it contains no API keys, user workspace files, browser-persisted secrets, test fixtures or unrelated build caches

**Given** the archive is extracted into a clean temporary directory
**When** its local health command runs
**Then** the backend starts with the packaged frontend and shared assets
**And** the Rust FFI initialization succeeds for the target platform
**And** the health endpoint returns success without Docker, Podman, Deno or Rust being installed on the test host

**Given** a target build fails or produces an incomplete archive
**When** the packaging gate evaluates the result
**Then** it fails before any release asset is published
**And** the output identifies the target, missing asset or failed health check

### Story 6.4: Runtime 完整性与安全启动

As a Lapdev user,
I want downloaded runtime assets validated before execution,
So that a partial, corrupted or unexpectedly replaced release cannot silently become the local server.

**Requirements:** FR6, NFR6, NFR10, NFR13

**Acceptance Criteria:**

**Given** the CLI resolves a runtime manifest and asset
**When** the asset is downloaded
**Then** the CLI validates HTTPS response handling, declared size and SHA-256 before extraction or execution
**And** it rejects redirects or URLs that do not match the release source policy

**Given** checksum or archive validation fails
**When** the CLI handles the failure
**Then** it removes the temporary or invalid cache files
**And** it returns a stable non-zero exit code with the expected and observed integrity information
**And** it does not launch any runtime process

**Given** a verified runtime is started
**When** the backend process is launched
**Then** its executable, dynamic library and packaged application paths resolve inside the verified runtime directory
**And** the default listener is `127.0.0.1` rather than an externally reachable address
**And** the workspace path is supplied separately and remains subject to the existing workspace boundary policy

**Given** runtime startup fails after validation
**When** the CLI reports the failure
**Then** diagnostics include the version, platform, runtime path and process exit category
**And** diagnostics do not include API keys, environment secrets, complete prompts or arbitrary workspace contents

**Given** a runtime cache is replaced while a server is running
**When** the user starts or upgrades another version
**Then** the running process continues using its resolved versioned paths
**And** cache cleanup does not delete files still owned by an active process

### Story 6.5: GitHub Release 平台发布

As a release maintainer,
I want protected version tags to publish verified platform runtime assets,
So that users and the npm CLI can retrieve one traceable runtime for each supported target.

**Requirements:** FR6, NFR8, NFR10, NFR11, NFR12

**Acceptance Criteria:**

**Given** a pull request or a non-release branch push
**When** the CI workflow runs
**Then** it builds and tests the applicable runtime and health contract
**And** it does not create a GitHub Release or upload runtime assets

**Given** a protected `vX.Y.Z` tag points to a commit that passes the release gates
**When** the release workflow runs
**Then** it builds the configured platform target matrix
**And** it creates or updates the matching GitHub Release with the runtime archives, manifest, checksum file and license metadata
**And** every asset records the source commit and target identity

**Given** one target build or health check fails
**When** the release workflow evaluates the matrix
**Then** the release is not marked complete for that target
**And** failed targets cannot be represented as downloadable supported runtimes
**And** the workflow reports the target and failed gate clearly

**Given** a release asset already exists for the same tag and target
**When** the workflow is re-run
**Then** it either verifies the existing immutable content or fails without silently replacing it
**And** the manifest continues to resolve exactly one checksum-identified asset per target

**Given** a completed release
**When** the release verification job runs
**Then** it downloads each declared asset, recomputes its size and SHA-256 and checks the manifest
**And** the verification result is visible in the workflow summary

### Story 6.6: npm Trusted Publishing 与端到端安装验证

As a Lapdev maintainer,
I want to publish the CLI through trusted CI and verify the complete install path,
So that a user can install one pinned npm version and receive the matching verified runtime.

**Requirements:** FR6, NFR8, NFR10, NFR12, NFR13

**Acceptance Criteria:**

**Given** a pull request or non-tag push
**When** the npm/release workflow evaluates the event
**Then** it runs package, unit and install-path checks without publishing to npm
**And** it does not require a long-lived npm publish token

**Given** a protected `vX.Y.Z` tag has produced a verified GitHub Release
**When** the npm publish job runs
**Then** it publishes the matching `@lapdev/cli` version through GitHub Actions OIDC Trusted Publishing
**And** the CLI package version, Git tag and runtime manifest version are identical
**And** the job exposes no npm secret token in repository configuration or logs

**Given** a clean temporary user environment
**When** the pinned package is installed and `npx @lapdev/cli@X.Y.Z web --no-open` is executed
**Then** the CLI obtains the matching platform runtime, verifies it, starts Lapdev and passes the health check
**And** the test confirms the server binds to localhost and does not require Docker, Deno or Rust

**Given** an unsupported platform, missing Release asset, corrupted download or offline cache miss
**When** the end-to-end install test runs
**Then** it fails with a stable exit category and actionable remediation
**And** it does not execute an unverified runtime or publish a misleading success result

**Given** the published npm package is inspected
**When** the package contents and provenance are checked
**Then** only the CLI launcher, required metadata and documentation are included
**And** the package contains no runtime secrets, workspace data or unrelated build output
