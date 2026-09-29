# Digest: npm CLI distribution pattern

## Findings

- DeepSeek Harness documents `npx @deepseek-ai/dsh web` as its quick-start path and separately supports source installation with `git clone`, dependency installation, build, and a local command. This is evidence for a two-lane distribution model: convenient package entry point plus source escape hatch. [1]
- The official DeepSeek repository describes the project as a developer preview with compatibility-breaking changes, so an npm-first model still requires explicit version pinning and release discipline rather than an unbounded `npx` latest workflow. [1]

## Relevance to decision

Lapdev should copy the user-facing command shape, not assume that its current Deno/Rust runtime can be represented by a JavaScript package without a packaging layer.

## Sources

- [1] DeepSeek AI, “deepseek-harness” repository, accessed 2026-09-29: https://github.com/deepseek-ai/deepseek-harness
