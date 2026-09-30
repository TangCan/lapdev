# 安装方式与独立实践核对

访问日期 2026-09-30；以下页面发布日期未标注。

- claim: uv 官方同时提供独立安装脚本、直接 GitHub Release 资产与 Homebrew 安装，且独立脚本支持固定版本。source: https://docs.astral.sh/uv/getting-started/installation/ ; publisher: Astral ; confidence: high ; class: landscape ; status: verified（与 GitHub 资产能力组合，证明该分发模式已实际采用，不证明 Lapdev 兼容性）。
- claim: gh release download 支持指定 tag、仓库和资产 pattern。source: https://cli.github.com/manual/gh_release_download ; publisher: GitHub CLI ; confidence: medium ; class: compatibility ; status: unverified（同一 GitHub 发布者，不能算独立复核）。
- claim: Homebrew 自建 tap 可由任何人建立，不要求先进入 core；用户通过完整 tap/formula 名安装，维护者负责更新。source: https://docs.brew.sh/How-to-Create-and-Maintain-a-Tap ; publisher: Homebrew ; confidence: medium ; class: landscape ; status: unverified。

本地适配记录（不是外部证据）：scripts/build-runtime-archive.sh 包含 bin/lapdev-runtime、bin/lapdev-server、lib 和 app；启动器由自己的目录定位根目录，说明安装必须保留完整布局。当前归档矩阵只含 linux-x64、darwin-arm64；没有 Windows 运行时，PowerShell 安装器不能补出平台支持。当前 workflow 独立发布 runtime，但 npm 发布是强制 tag job；需要改为可选渠道。未实施这些变更。

研究停止原因：候选渠道的硬约束与采用实践已覆盖；精确 npx 远程 URL 与真实用户安装仍需实现后验证。未找到 npm 注册故障归因证据。
