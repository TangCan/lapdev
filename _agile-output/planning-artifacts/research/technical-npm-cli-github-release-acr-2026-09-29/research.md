---
title: 'technical research: npm CLI + GitHub Release 平台运行时替换 ACR 发布方案'
type: 'technical'
topic: 'npm CLI + GitHub Release 平台运行时替换 ACR 发布方案'
decision: '选择并制定 Lapdev 的无容器 npm CLI + GitHub Release 平台运行时发布方案'
source: 'native web research'
status: complete
preset: 'standard'
validation: 'normal'
created: '2026-09-29'
updated: '2026-09-29'
---

# technical research: npm CLI + GitHub Release 平台运行时替换 ACR 发布方案

## 执行摘要

建议采用“轻量 npm CLI + GitHub Release 平台运行时”的两层发布方案：用户执行 `npx @lapdev/cli@<version> web`，CLI 选择平台、获取对应 Release 运行时、校验清单并启动本地 Lapdev；源码安装继续保留给贡献者和开发环境。

这个方向与 DeepSeek Harness 的 npm 快速启动模式一致，但不照搬其实现：DeepSeek Harness 官方同时提供 `npx` 启动和源码构建路径。[1] Lapdev 当前由 React/Vite、Deno 和 Rust FFI 组成，Deno 的动态库加载要求 Rust 库作为真实文件显式随运行时分发，因此单一纯 JavaScript npm 包会增加体积和跨平台风险。[7]

推荐方案的核心拆分如下：

```text
npm registry
  @lapdev/cli
      │ 版本解析 + 平台选择 + 校验 + 缓存 + 启动
      ▼
GitHub Release vX.Y.Z
  lapdev-runtime-linux-x64.tar.gz
  lapdev-runtime-linux-arm64.tar.gz
  lapdev-runtime-darwin-arm64.tar.gz
  lapdev-runtime-darwin-x64.tar.gz
  lapdev-runtime-win32-x64.zip
  checksums.txt / manifest.json / signature
```

最大的 caveat 是：第一阶段仍需为 Rust FFI 定义并验证平台矩阵；Deno `compile` 可以跨目标生成可执行文件，但不能替 Lapdev 自动解决所有 native library、动态路径和操作系统签名问题。[2][7][9]

## 决策与约束

本研究服务的决策是：移除 ACR 镜像发布作为主交付路径，建立不依赖 Docker Registry 的本地安装和运行方式。

硬门槛：

- `npx @lapdev/cli@<version> web` 能启动本地 Web IDE。
- Docker、Podman、Deno 和 Rust 工具链不应成为最终用户的必需安装项。
- 运行时必须按 OS/CPU 架构选择，并拒绝不匹配的平台。
- 下载内容必须版本固定并经过 SHA-256，后续加入签名验证。
- CI 不使用长期 npm token；发布权限限制在版本标签和专用 workflow。
- 默认只绑定本机地址，不能因为 CLI 安装而扩大网络暴露面。

偏好：保留源码开发路径、最小化后端重写、先支持 Linux x64 与 macOS arm64，再扩展其他目标。

## 候选方案比较

评分：5 分最好；权重体现 Lapdev 当前决策优先级。

| 方案 | 一键体验 25% | 跨平台 25% | 迁移成本 20% | 安全/可验证 20% | 运行维护 10% | 加权分 | 结论 |
|---|---:|---:|---:|---:|---:|---:|---|
| 单体 npm 包 | 4 | 2 | 2 | 3 | 2 | 2.70 | 体积和 native 资产耦合过高 |
| npm CLI + GitHub Release | 5 | 4 | 4 | 5 | 4 | 4.45 | 推荐 |
| npm CLI + optional packages | 5 | 4 | 3 | 4 | 3 | 3.95 | 可作为后续优化 |
| 仅 GitHub Release | 2 | 4 | 3 | 5 | 4 | 3.55 | 缺少 DeepSeek 式入口 |

评分是基于本项目约束的工程判断，不是外部市场数据；决定性证据是 npm 对 `bin`/`files`/`optionalDependencies` 的支持、GitHub Release 的资产模型，以及 Deno/Rust 的平台和 FFI 约束。[5][6][7][9][10]

## 研究发现

### 1. npm CLI 用户体验

DeepSeek Harness 将 `npx @deepseek-ai/dsh web` 作为快速体验入口，同时保留源码安装流程。[1] 这个模式适合 Lapdev：npm 包负责命令入口、版本和启动编排，而不是把所有交付资产都当成普通 JavaScript 依赖。

npm 的 `bin` 字段可以将命令安装到 PATH，`files` 字段可以控制 tarball 内容；`optionalDependencies` 能表达平台依赖，但缺失 optional package 时必须由应用自行处理。[5][10] 因此 CLI 应包含明确的 `doctor`、`version`、`runtime list` 和错误诊断，而不是依赖 npm 安装失败来解释平台问题。

### 2. Deno 与 Rust 运行时

Deno `compile` 能生成包含 Deno runtime 的独立可执行文件，并支持 Linux、macOS、Windows 的多个目标。[2][3] 这可以消除最终用户单独安装 Deno 的要求。

但 Lapdev 使用 Deno FFI 加载 Rust 动态库。官方说明动态库需要作为真实文件显式包含，运行时由操作系统 loader 加载；它不会因为 JavaScript 被编译就自动消失。[7] 因此每个平台运行时至少需要：

- 对应平台的 Lapdev 启动器或 Deno 可执行文件；
- 对应平台的 Rust `.so`、`.dylib` 或 `.dll`；
- `frontend/dist`、backend、shared 和必要的 BMAD/skill 资源；
- 版本清单、平台标识、校验摘要和许可文件。

Deno 对动态 import、worker 和额外文件存在显式包含要求；发布构建不能只依赖静态入口推断。[2][8] Cargo 支持显式 target triple，因此 Rust 构建必须和 CLI 的平台识别保持同一份 target 映射。[9]

### 3. GitHub Release 与 npm 发布

GitHub Release 以 Git tag 为版本锚点，并支持下载二进制资产。[6] 这适合承载大型平台运行时，避免 ACR manifest、Docker daemon 和镜像层发布问题。

npm Trusted Publishing 使用 GitHub Actions OIDC，避免长期 npm token，并可为公开包生成 provenance。[4] 发布 workflow 应只允许版本 tag 触发，并将 `id-token: write` 限定在发布 Job。

### 4. 迁移现实

当前项目不是纯 Node 包：根 package 主要承载测试脚本，前端单独使用 Vite，后端使用 Deno，Rust 位于 `core/`。因此第一阶段不应修改整个运行时架构，而应新增一个独立的 `packages/cli` 或 `cli/` 发布边界，先把现有生产启动逻辑包装起来。

## 推荐架构 Spine

### 发布时

1. 版本 tag `vX.Y.Z` 触发 release workflow。
2. 矩阵构建目标：先 `linux-x64`、`darwin-arm64`，再扩展 `linux-arm64`、`darwin-x64`、`win32-x64`。
3. 构建前端静态资源。
4. 为目标编译 Rust dynamic library。
5. 生成 Deno/Node 启动器，固定权限和资源相对路径。
6. 组装 `lapdev-runtime-<platform>-<arch>` 归档。
7. 生成 `manifest.json`、`checksums.txt`，后续加入签名。
8. 上传 GitHub Release assets。
9. 使用 npm Trusted Publishing 发布 `@lapdev/cli`。

### 用户运行时

1. npm 安装 `@lapdev/cli`，执行 `web`。
2. CLI 读取自身版本和 `process.platform/process.arch`。
3. 解析匹配的 Release manifest，默认使用 CLI 版本对应的 tag。
4. 下载到用户缓存目录的临时文件。
5. 校验大小和 SHA-256；失败时删除临时文件并给出可诊断错误。
6. 原子移动到版本化缓存目录。
7. 校验 Rust 动态库存在，并使用绝对/模块相对路径启动后端。
8. 绑定 `127.0.0.1`，打印 URL；只有显式 `--host` 才允许改变绑定地址。
9. `--offline` 只使用已有缓存；`doctor` 检查平台、缓存、权限和端口。

## 实现计划

### Phase 0：发布契约与平台基线

目标：不改变用户功能，先固定可交付格式。

- 定义平台 ID 到 Rust target triple 的单一映射。
- 定义 runtime archive 目录结构、manifest schema、版本规则和退出码。
- 确定 `@lapdev/cli` 包名、Node engine、缓存目录和默认监听地址。
- 明确第一阶段支持矩阵：建议 Linux x64、macOS arm64；Linux arm64 和 Windows x64 作为第二批。
- 增加架构文档和 threat model。

验收：文档能让另一位开发者在不阅读实现代码的情况下组装并验证一个 runtime archive。

### Phase 1：CLI 最小垂直切片

目标：本机可运行 `npm pack` 产物。

- 新增 `cli/package.json`，配置 `bin`、`files`、`engines` 和版本读取。
- 实现 `web`、`version`、`doctor`、`--no-open`、`--offline`。
- 实现平台选择、缓存目录、临时下载、SHA-256 校验和原子安装。
- 先支持本地 `--runtime-dir`，避免第一阶段同时引入远程下载调试复杂度。
- 通过 `npm pack` + 临时目录测试，不依赖全局安装。

验收：`npx --yes --package ./cli-package.tgz lapdev web --no-open` 能启动本地健康端点；错误平台和损坏 checksum 有明确失败信息。

### Phase 2：生产运行时打包

目标：将现有 Docker 生产内容转换为平台 archive。

- 抽取生产启动所需文件清单，禁止把 secrets、测试产物和工作区内容打包。
- 构建前端 dist。
- 为每个支持目标构建 Rust dynamic library。
- 选择 Deno compile 作为第一版后端载体；明确静态 import、worker、FFI library 和额外资源的 include 清单。
- 生成统一目录布局，例如 `bin/lapdev-server`、`lib/lapdev_core.*`、`app/frontend`、`app/backend`、`manifest.json`。
- 在每个平台运行本地 `/health` 冒烟测试。

验收：Linux x64 和 macOS arm64 archive 在干净机器/干净临时目录启动成功，Rust FFI 可加载，健康端点返回成功。

### Phase 3：GitHub Release 自动化

目标：版本 tag 可独立产生可下载运行时。

- 新增 `release.yml`，仅响应 `v*` tag 或受保护的手动 dispatch。
- 使用矩阵构建平台 archive，上传 Release assets。
- 生成并发布 manifest、checksums 和 SBOM/许可证清单。
- 保留构建/健康检查为发布前门禁；删除 ACR 登录和发布依赖。
- 失败时不创建“可安装但缺资产”的 npm 版本。

验收：一个 tag 产生完整资产集合，重复运行不会静默覆盖不同内容；资产摘要可由本地脚本重算一致。

### Phase 4：npm Trusted Publishing

目标：提供 DeepSeek Harness 式入口。

- 配置 npm trusted publisher，绑定仓库和专用 workflow。
- 发布 `@lapdev/cli`，使用 OIDC，不保存长期 npm token。[4]
- 将 CLI 的版本与 Release tag 绑定；CLI 默认拒绝不存在或不匹配的 runtime manifest。
- 文档统一使用 `npx @lapdev/cli@X.Y.Z web`，避免默认 latest 带来的不可控升级。

验收：从公开 npm registry 安装指定版本，能够下载对应 GitHub Release 并启动；provenance 可见；发布 workflow 权限最小化。

### Phase 5：扩展平台与迁移收尾

- 增加 Linux arm64、macOS x64、Windows x64。
- 加入 Windows DLL 路径、macOS quarantine/signing、Linux libc 基线的专门测试。
- 为已有 Docker 用户保留手动构建文档，但不再把 Docker 发布作为主 CI 成功条件。
- 将 README、安装文档、Release notes、health/deployment 文档切换到 npm CLI 入口。
- 增加版本回滚、缓存清理、离线运行和 runtime 诊断文档。

## CI 与安全控制

- `pull_request` 只构建和测试，不上传 Release 或 npm。
- `v*` tag 才有发布权限；发布 Job 使用 GitHub Environment 审批保护。
- npm 使用 OIDC trusted publishing，不在仓库 secrets 中保存长期 npm publish token。[4]
- 所有 runtime 下载先写临时文件，再验证 checksum，最后原子移动。
- manifest 必须包含版本、平台、架构、下载 URL、大小、SHA-256、构建 commit。
- 默认 localhost 绑定和现有 workspace 路径边界必须保持；CLI 不能因为下载 runtime 而开放任意路径或网络能力。
- 运行时包不包含 API keys、用户数据、工作区文件或浏览器持久化 secrets。
- 第一版可使用 SHA-256；正式发布建议加入 Sigstore/GitHub artifact attestation 或签名清单，并在 CLI 中校验签名。

## 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| Rust target/ABI 不匹配 | 启动失败 | target 映射、矩阵构建、每平台 FFI health test |
| Deno compile 漏掉动态资源 | 运行时找不到文件 | 显式 include 清单和 archive 内容测试 |
| GitHub Release 下载受限 | 无法首次启动 | 缓存、`--offline`、镜像下载入口作为后续扩展 |
| npm latest 破坏性升级 | 用户环境不稳定 | 文档和 CI 使用固定版本；CLI 版本绑定 Release |
| 下载包被替换 | 供应链风险 | checksum 起步，签名/provenance 后续强制 |
| 包体积过大 | 安装慢、缓存浪费 | CLI 薄包，平台运行时拆分；不把所有平台打进 npm |
| Windows/macOS 签名缺失 | 用户信任或执行受阻 | 第二阶段明确签名与 notarization 任务，不假装跨平台已完成 |

## 反向证据与边界

本次未启用 red-team pass。已有证据仍显示两个重要边界：第一，Deno 独立编译并不自动解决 Lapdev Rust 动态库的真实文件和平台 ABI 问题；第二，GitHub Release 下载依赖 GitHub 可达性，不能被描述为所有网络环境下的无条件替代。因此“npm CLI + GitHub Release”是当前最小可行主方案，不是对所有部署场景的终局保证。

## 推荐结论

选择方案 2：npm CLI + GitHub Release 平台运行时。

第一实现切片应是 Linux x64 + macOS arm64 的本地垂直闭环，而不是一次性覆盖所有平台：先完成 `npm pack`、本地 runtime-dir、Deno/Rust FFI 加载、checksum、health test，再接入 GitHub Release 和 npm trusted publishing。这样可以把“CLI 体验”“运行时打包”“远程下载”“npm 发布”四个故障域分开验证，并保留回滚到源码运行的路径。

## 开放问题

- Rust core 当前实际需要哪些系统库和最低 libc/macOS 版本？需要从构建产物和 CI 试运行中确认。
- 是否必须支持 Windows？如果必须，需尽早验证 DLL 复制、路径和签名，不应推迟到发布前。
- GitHub Release 在目标用户网络环境下是否稳定？需要真实用户/部署环境试下载，而不是仅在 GitHub runner 中验证。
- 是否要求离线安装？若是，应提供可下载的完整 archive 和 CLI `--runtime-dir`/离线安装入口。
- 运行时是否可以改为单个 Deno compiled binary，还是必须保留外置 frontend/backend/Rust 文件？需以 FFI 和动态资源实验决定。

## 来源附录

| 编号 | 支持的结论 | 发布者 | 发布/访问日期 | 置信度 |
|---|---|---|---|---|
| [1] | DeepSeek Harness 的 npm 快速启动和源码安装 | [DeepSeek AI GitHub](https://github.com/deepseek-ai/deepseek-harness) | 访问 2026-09-29 | 高 |
| [2] | Deno standalone compile、跨平台 target、动态资源限制 | [Deno Docs](https://docs.deno.com/runtime/reference/cli/compile/) | 访问 2026-09-29 | 高 |
| [3] | Deno 部署和最小权限建议 | [Deno Docs](https://docs.deno.com/runtime/deploy/) | 访问 2026-09-29 | 高 |
| [4] | npm Trusted Publishing、OIDC、provenance | [npm Docs](https://docs.npmjs.com/trusted-publishers/) | 访问 2026-09-29 | 高 |
| [5] | npm `bin`、`files`、`optionalDependencies` | [npm Docs](https://docs.npmjs.com/files/package.json/) | 访问 2026-09-29 | 高 |
| [6] | GitHub Release tag 与下载资产 | [GitHub Docs](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) | 访问 2026-09-29 | 高 |
| [7] | Deno FFI 动态库必须作为真实文件处理 | [Deno Docs](https://docs.deno.com/runtime/fundamentals/ffi/) | 访问 2026-09-29 | 高 |
| [8] | Deno compile 动态 import/worker/include 限制 | [Deno Docs](https://docs.deno.com/runtime/reference/cli/compile/) | 访问 2026-09-29 | 高 |
| [9] | Cargo target triple 和跨目标构建 | [The Cargo Book](https://doc.rust-lang.org/cargo/reference/config.html) | 访问 2026-09-29 | 高 |
| [10] | npm package 元数据和 optional dependency 行为 | [npm Docs](https://docs.npmjs.com/files/package.json/) | 访问 2026-09-29 | 高 |

## 新鲜度地图

本研究的版本/兼容性结论应在 1 个月内复核；安全发布结论应在 3 个月内复核；架构模式应在 2 年内复核。机械 staleness 检查显示当前没有过期 claim，最早复核日期为 2026-10-29，最早对象是 Deno、Cargo target 和 Deno FFI 的兼容性行为。
