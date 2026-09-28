# External practices digest — round 1

## Scope

Compared the local audit against primary documentation retrieved on 2026-09-28. Sources are official Deno, OpenAI, Microsoft, MDN, React, and OpenTelemetry documentation.

## Findings

### Security and deployment

- Deno is designed around explicit permissions; `--allow-all` removes the meaningful runtime permission boundary and should be treated as equivalent to running without Deno's sandbox. Production guidance favors granting only permissions required by the service and isolating untrusted subprocesses with an additional OS/container boundary. Source: [Deno security fundamentals](https://docs.deno.com/runtime/fundamentals/security/), [Deno permissions reference](https://docs.deno.com/runtime/reference/permissions/).
- Lapdev's terminal, file, Git, and agent operations make permission scope a product boundary, not only a deployment detail. The current `-A` entrypoint therefore needs a capability inventory, least-privilege profiles, and an explicit trust model for local versus remotely exposed workspaces. This is an inference from the local audit plus Deno's permission model.
- WebSocket origin checks help defend browser cross-site WebSocket hijacking, but Origin can be forged by non-browser clients; authentication and session binding are still required. Source: [MDN WebSocket server security](https://developer.mozilla.org/docs/Web/API/WebSockets_API/Writing_WebSocket_servers).

### Agent Skills and BMAD/Codex integration

- OpenAI's Skills guidance treats a skill as a directory containing `SKILL.md`, with optional references, scripts, and assets. A runtime can discover skill directories and inject their names/descriptions into the agent context; local runtimes need an explicit local path configuration. Source: [OpenAI Skills guide](https://developers.openai.com/api/docs/guides/tools-skills).
- OpenAI's current guidance also warns that too many skills can force shorter descriptions and reduce useful context. Skill discovery should therefore be explicit, observable, and concise rather than scanning every possible directory indiscriminately. Source: [Rethinking skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).
- For Lapdev, the most robust integration is a canonical skill registry with adapters for `.agents/skills` (Codex/BMAD), `.lapdev/skills` (legacy Lapdev), and optional user-level paths. The registry should expose source, version, enabled state, and refresh errors so the UI can explain why a skill is or is not visible. This is a design recommendation derived from the local path mismatch and the Skills contract.

### Editor and runtime architecture

- LSP standardizes editor-language-server communication over JSON-RPC and allows the same language server to be reused across tools. Source: [Language Server Protocol specification](https://microsoft.github.io/language-server-protocol/).
- Lapdev should make LSP process lifecycle, workspace root, cancellation, diagnostics freshness, crash recovery, and capability negotiation first-class state. This is more durable than adding language-specific handlers ad hoc and follows the protocol's reusable-server model.
- Deno documents built-in OpenTelemetry support for metrics, traces, and logs, including automatic spans for server/fetch paths and custom instrumentation through the OpenTelemetry API. Source: [Deno OpenTelemetry](https://docs.deno.com/runtime/fundamentals/open_telemetry/).

### Frontend compatibility

- React 19 is stable, React 19.3 is documented as stable as of 2026-09-09, and the React Compiler can be adopted incrementally; compiler diagnostics are surfaced through `eslint-plugin-react-hooks`, and components with violations can be skipped while the rest are optimized. Sources: [React 19](https://react.dev/blog/2024/12/05/react-19), [React 19.3](https://react.dev/blog/2026/09/09/react-19-3), [React Compiler installation](https://react.dev/learn/react-compiler/installation), [React Compiler configuration](https://react.dev/reference/react-compiler/configuration).
- The local failure in `react-compiler-eslint.test.ts` should be treated as a compatibility-contract failure until the expected compiler diagnostic and installed lint/compiler versions are made explicit. It is not enough to update the assertion to make the test pass.

## Implications for the roadmap

1. Secure the execution boundary and WebSocket/session boundary before expanding remote or multi-user capabilities.
2. Establish a canonical skill registry and migrate BMAD/Codex discovery to it, with legacy compatibility and diagnostics.
3. Make test, documentation, and version contracts generated or checked in CI so runtime drift is caught before deployment.
4. Add structured observability around HTTP/WebSocket sessions, terminal commands, LSP processes, file operations, and AI calls, with secret redaction.
5. Refactor LSP and agent execution around explicit lifecycle/capability abstractions before adding more providers or languages.

## Evidence limits

- External sources establish practices and protocol expectations, not Lapdev-specific defects beyond the local audit.
- No competitor or user-voice research was used; product-market prioritization should be a separate research run if needed.
