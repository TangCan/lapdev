# Research brief

## Decision

选择并制定 Lapdev 的无容器 npm CLI + GitHub Release 平台运行时发布方案，替换当前受 ACR manifest 发布问题阻塞的镜像发布路径。

## Hard gates

- 不依赖 Docker Registry 才能安装或运行。
- 用户可通过单条命令启动本地 Web IDE。
- 保持 React/Vite、Deno、Rust 当前技术栈的可行迁移路径。
- 运行时按 OS/CPU 架构分发，并可固定版本、校验完整性。
- CI 发布不暴露长期凭据，不把 secrets 写入包、日志或运行时配置。

## Preferences

- 尽量减少对现有代码的重写。
- 支持 Linux、macOS、Windows 的渐进式扩展。
- 发布过程可复现、可回滚、可测试。
- 保留源码安装路径，npm CLI 作为快速入口。

## Candidates

1. 单体 npm 包，内含全部平台运行时。
2. npm CLI + GitHub Release 平台运行时。
3. npm CLI + 平台专用 npm optional packages。
4. 仅 GitHub Release 二进制，不提供 npm CLI。

## Evidence scope

研究 DeepSeek Harness 的 npm 启动方式、npm CLI 发布规范、GitHub Release 资产、Deno/Rust 跨平台运行时、GitHub Actions OIDC/provenance，以及这些模式迁移到 Lapdev 的工程风险。
