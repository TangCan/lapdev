# Release 托管 CLI tarball 实施记录

日期：2026-09-30。依据：`../planning-artifacts/research/technical-npm-free-github-release-distribution-2026-09-30/research.md`。

已实现：CLI `.tgz` 与两平台运行时共同进入草稿 Release；公开前校验版本、包名、长度与 SHA-256；SHA256SUMS 同时覆盖 CLI、运行时和 manifest；拒绝修改已公开 Release；npm registry job 仅在仓库变量 `NPM_PUBLISH_ENABLED=true` 时运行。

CI 增加：打包完整性正反例测试、实际构建运行时的 CLI 安装启动检查，以及 tag 发布后的 Linux/macOS 匿名资产下载、公开 URL 安装、自动运行时下载、健康接口与首页验证。

文档：README、cli/README、docs/release-installation.md、可选 npm bootstrap、架构 Spine 已统一主渠道与可选渠道。

本地证据：node Release 测试 6/6；Deno CLI 与 release 合约测试 10/10；工作流 YAML 与依赖检查通过；从 GitHub run 36655023822 下载真实 Linux x64 运行时，安装本次 CLI tarball 并检查 /health 与首页成功。

限制：没有创建版本 tag 或公开 Release；公开 URL 的真实下载安装及 macOS 实际启动依赖相应 CI。此次未增加平台、安装器或服务端权限。预先存在的 Rust 格式修改及研究产物保持原状。
