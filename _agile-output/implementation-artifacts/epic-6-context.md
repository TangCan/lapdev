# Epic 6 Context: 一键安装与本地运行时发布

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

让用户通过固定版本的 npm CLI 在本机启动 Lapdev，而不需要 Docker、ACR、Deno 或 Rust 工具链；同时让维护者能够为明确支持的平台构建、校验并通过 GitHub Release 发布 runtime，并保留源码安装路径。

## Stories

- Story 6.1: CLI 命令与本地启动契约
- Story 6.2: Runtime Manifest、平台选择与缓存
- Story 6.3: Deno、Rust 与前端 Runtime Archive
- Story 6.4: Runtime 完整性与安全启动
- Story 6.5: GitHub Release 平台发布
- Story 6.6: npm Trusted Publishing 与端到端安装验证

## Requirements & Constraints

- CLI 必须提供 `web`、`doctor`、`version`，支持固定版本的 `npx` 调用。
- 运行时 manifest 必须绑定 CLI 版本、Git tag、平台、架构、target、asset、大小、SHA-256 和构建 commit。
- 首批平台为 Linux x64 与 macOS arm64；Rust FFI 必须以目标平台真实动态库文件交付。
- runtime 下载必须在执行前完成大小和 SHA-256 校验，并原子安装到 workspace 外的用户缓存。
- 默认监听 `127.0.0.1`；发布归档不得包含 secrets、workspace 数据、测试 fixture 或无关构建缓存。
- PR/普通 push 只执行构建、测试和健康检查；受保护的 `vX.Y.Z` tag 才能发布 GitHub Release 和 npm。
- npm 发布使用 GitHub Actions OIDC Trusted Publishing，不使用长期 npm token。
- Docker/ACR 不是发布成功门禁；源码安装路径必须继续可用。

## Technical Decisions

- npm CLI 是本地发布边界；CLI 负责命令解析、manifest 选择、下载、校验、缓存和启动。
- CLI 与 runtime 通过版本化 manifest 绑定，禁止执行未验证、过期或不兼容的缓存条目。
- runtime 布局稳定包含 `bin`、`lib`、`app`、manifest 与 license；Deno backend launcher、React/Vite 构建产物、共享资源和 Rust FFI 均由归档提供。
- GitHub Release 是 runtime 资产的权威来源；tag、manifest、包版本与 commit 必须可追溯。
- 本地运行时和 workspace 路径分离，诊断不能泄露 secrets、完整 prompt 或 workspace 内容。

## Cross-Story Dependencies

6.1 建立 CLI 命令和本地启动契约；6.2 提供 manifest、平台选择和缓存；6.3 生成可运行归档；6.4 加固完整性与安全启动；6.5 发布并验证 GitHub Release 资产；6.6 完成 npm Trusted Publishing 和端到端安装验证。源码安装不依赖这些新增发布入口。
