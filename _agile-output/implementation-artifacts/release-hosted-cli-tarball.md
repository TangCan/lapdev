# Release 托管 CLI tarball 实施记录

日期：2026-09-30。依据：`../planning-artifacts/research/technical-npm-free-github-release-distribution-2026-09-30/research.md`。

已实现：CLI `.tgz` 与两平台运行时共同进入草稿 Release；公开前校验版本、包名、长度与 SHA-256；SHA256SUMS 同时覆盖 CLI、运行时和 manifest；拒绝修改已公开 Release；npm registry job 仅在仓库变量 `NPM_PUBLISH_ENABLED=true` 时运行。

CI 增加：打包完整性正反例测试、实际构建运行时的 CLI 安装启动检查，以及 tag 发布后的 Linux/macOS 匿名资产下载、公开 URL 安装、自动运行时下载、健康接口与首页验证。

文档：README、cli/README、docs/release-installation.md、可选 npm bootstrap、架构 Spine 已统一主渠道与可选渠道。

本地证据：node Release 测试 6/6；Deno CLI 与 release 合约测试 10/10；工作流 YAML 与依赖检查通过；从 GitHub run 36655023822 下载真实 Linux x64 运行时，安装本次 CLI tarball 并检查 /health 与首页成功。

限制：没有创建版本 tag 或公开 Release；公开 URL 的真实下载安装及 macOS 实际启动依赖相应 CI。此次未增加平台、安装器或服务端权限。预先存在的 Rust 格式修改及研究产物保持原状。

## 后续正式发布结果（2026-09-30）

版本准备与研究记录提交：`ddd2e5c`；旧 tag 未改动，新增 `v1.0.2` 指向该提交。
main 验证 run 36658312128 成功；正式发布 run 36658637492 全绿，Linux x64 和
macOS arm64 均完成匿名资产校验、公开 URL CLI 安装、自动运行时下载、健康接口
及首页检查。npm registry job 按预期跳过。

正式 Release：https://github.com/TangCan/lapdev/releases/tag/v1.0.2 。包含 CLI tgz、
两个运行时归档、manifest、SHA256SUMS 和 LICENSE。

本机 npm 12.0.2 默认 allow-remote=none，URL 安装最初报 EALLOWREMOTE；单次命令
加入 --allow-remote=all 后安装通过。验证脚本现按 npm 主版本为 URL 安装加入此参数，
文档及 Release notes 已补充说明，不改全局 npm 配置。本机自动运行时下载未在
120 秒启动检查窗口内完成；manifest 下载成功，不能把本机等待超时当作 CI 下载
验证失败，也不声称本机端到端通过。可按安装文档手动下载校验后指定 runtime-dir。
