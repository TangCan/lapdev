# 发布运行时核心验收：阶段结果

## 最新结果：服务端请求关联（2026-09-30）

**最终收尾：评审与独立复验通过。** 用户批准监听测试缓存加固后，在临时隔离 DENO_DIR 中异步预热一次依赖（180 秒独立期限），六种模式共享该缓存并用 cached-only 启动，原 20 秒服务启动限制及所有监听/健康/TLS 回退断言不变。缓存准备输出有界，失败/超时/启动失败直接报错并清理；独立补充检查无发现。

主会话完整复跑：后端 **55 项（69 子步骤）**、Node 四文件 **33 项**（0 failed/0 skipped，新增缓存失败隔离测试）、权限门禁 **4 项**及 git diff --check 全部通过。Linux 归档再次校验、安装/启动/健康/首页及原核心 **22/22** 通过，包内 capability.ts 与当前源码一致。仅测试缓存补丁，不重建或覆盖资产。完整供应链/工具链复现仍独立延期；macOS、公开安装及真实 LSP 功能仍未验证。没有推送或发布，测试归档不纳入源码提交。以下 31/32 失败及修订前 32/32 均为历史执行记录。

**历史复验阻碍（缓存加固前）：尚未最终收尾。** 评审补丁后主会话后端 55 项（69 子步骤）、权限门禁 4 项、差异检查与 Linux 实包 22/22 均通过，生产源码与包内一致。Node 四文件最终复跑为 31/32，失败是既有真实监听测试在隔离空 Deno 缓存下载依赖时超过启动等待；原环境两次及去代理一次未解决，去代理运行已通过 HTTP 模式但 HTTPS 冷下载超时。下面 32/32 为评审前历史，不是最终全绿。当时规格保持 in-review，未提交、推送或发布；需确认监听测试缓存加固后继续最终收尾。各评审测试补丁已核验，完整构建供应链快照风险单独延期。

`spec-server-request-correlation.md` 已实施：忽略所有入站 X-Request-Id，每次解析生成随机 UUID；入口、终端拒绝及 WebSocket 后续事件复用原 requestId。现有拒绝响应 header/body 与审计一致，成功 HTTP 和 WS 101 未新增 ID 出口。授权、version 1 信封、安全 session 关联及身份/revision 不变。客户端不能预设日志 ID，须通过现有错误响应定位；不保存原标签或持久映射。

后端 55 项（69 子步骤）、Node 四文件 32 项（0 skipped）、权限门禁 4 项及 git diff --check 通过。新独立 Linux 包安装、启动、健康、首页及原核心 22/22 通过；构建/归档校验/npm pack 成功。以下 HTTP 隔离结果是历史记录，其中 X-Request-Id 延期问题已由本轮解决。

资产目录：`_agile-output/runtime-archives/server-request-correlation-20260930/`。运行时 SHA-256：`5c188f965a441962126bf49df95f8d1ccaf4fa618fcc38b834520bb9abacd967`；CLI SHA-256：`a573144b85ec4d34dc44b1fbb171fa3819a5da60b1e132061935f16484045567`。版本仍为 1.0.3，manifest commit 为 `ceb0e434a8bd3a4527b5dbbc77bda2a8185adb10`，资产包含未提交修改；历史包未覆盖，未推送或发布。包内 `./app/backend/src/security/capability.ts` 提取后与当前源码 cmp 一致；唯一生产修改是该文件，其余生产源码来自基线。

源码快照：从仓库根执行 `git diff --binary --no-ext-diff --no-textconv ceb0e434a8bd3a4527b5dbbc77bda2a8185adb10 -- backend/src ':!backend/src/**/*.test.ts' | sha256sum`，结果 `be31e946d2ba6502020827753bbf29642761e479c6ce635d9d299a8da85911ba`。该差异不含测试和文档，避免文档哈希循环。

重建此生产源码快照：在独立目录检出基线 `ceb0e434a8bd3a4527b5dbbc77bda2a8185adb10`，从现有 `server-request-correlation-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz` 提取唯一修改的 `./app/backend/src/security/capability.ts`，覆盖该检出的同路径文件；不要覆盖现有归档。然后在该检出根执行上面的 code-only diff/hash 命令，应得到 `be31e946d2ba6502020827753bbf29642761e479c6ce635d9d299a8da85911ba`。先按本节 SHA-256 核对所用归档身份。其余 backend 生产源码，以及未修改的 frontend、Rust core、scripts 使用该基线。此方法是源码快照证据，不包含依赖锁定、安装产物、工具链和构建环境的完整恢复承诺，也不证明包可逐位复现。

评审修订交接：重复标签矩阵改在有效 remote-shared 会话下执行，并独立保留本地/无标签覆盖；每个合成标签分别通过 Cookie/Bearer 验证 HTTP 200、403 和 WS 101；401 明确验证完整 Content-Length JSON、UNAUTHENTICATED、响应/审计 ID 及 headers/body 不回显；连接测试产生两次真实握手后拒绝并验证稳定安全关联。本轮仅运行三个修改测试文件的针对性回归，完整验证和最终评审由主会话执行；规格保持 in-review，不重建或覆盖归档。

本轮定向结果：`npm run test:backend -- src/security/capability.test.ts src/security/httpAudit.test.ts src/websocket/fileWatcher.test.ts`，10 passed（30 steps）、0 failed；`git diff --check` 通过。首轮把全部后续允许事件也计入“两次拒绝”计数，修正为明确筛选两次 SESSION_MISMATCH 后同命令复跑通过；全部后续事件的安全 session 稳定性断言保留。未执行全量后端、Node 发布回归、权限门禁或实包验收；本节此前全量结果属于修订前运行记录。

```sh
RUNTIME_OUTPUT_DIR=_agile-output/runtime-archives/server-request-correlation-20260930 ./scripts/build-runtime-archive.sh linux-x64
./scripts/verify-runtime-archive.sh _agile-output/runtime-archives/server-request-correlation-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz linux-x64
npm pack ./cli --pack-destination _agile-output/runtime-archives/server-request-correlation-20260930
node scripts/smoke-release-cli.mjs _agile-output/runtime-archives/server-request-correlation-20260930/lapdev-cli-1.0.3.tgz _agile-output/runtime-archives/server-request-correlation-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz
```

覆盖：生产 emitter 测试保留匿名、撤销、过期、本地、安全 session/身份/revision、能力拒绝及跨请求唯一性断言；真实 main.ts HTTP 200/401/403、WS 101/401 使用合成 bootstrap、Cookie/Bearer 凭据和普通 UUID 标签，隔离请求边界定位成功事件，拒绝使用服务端响应 ID，所有捕获输出无原标签。终端 supplied/fallback 及连接握手/后续生命周期关联亦回归通过。实包原 22 项为核心回归，不冒充新增标签矩阵覆盖。

本规格实现及评审修订已交接，完整验证与最终评审仍待主会话执行；macOS、公开安装、真实 LSP 功能未验证，前端既有大 chunk 警告保留。终端归属、入站异步窗口、递归树及路径竞态等其他风险未关闭。不宣称任意客户端字段或全应用日志已脱敏。未读取真实凭据或历史日志，未提交、推送或发布。

## 历史：HTTP 审计凭据隔离（2026-09-30）

三路评审及最小补丁完成，主会话独立执行后端 **55 项（69 子步骤）**、Node **32 项**（0 skipped）、权限门禁 **4 项**及 git diff --check，全部通过。真实 HTTP/WS 握手验证与远程终端处理器 supplied/fallback 回归已纳入全量测试。

`http-audit-isolation-20260930/` 的 Linux 归档再次校验、安装/启动/健康/首页及原核心 **22/22** 全部通过；五个修改的生产源码与包内文件逐一 cmp 一致，代码补丁 SHA-256 与末尾记录一致。评审补丁只改测试/文档，因此保留既有包，不冒充新的公开资产。生成归档不纳入源码提交，没有推送或发布。

本轮修复服务端认证 sessionId 被 HTTP/握手审计自动记录以及高风险终端拒绝日志回显 body 身份/命令的路径。客户端任意 X-Request-Id 可进入关联日志的问题仍延期，不能宣称任意日志已脱敏。macOS、公开安装和真实 LSP 功能的历史限制仍在。下列出站授权摘要是此前阶段历史，HTTP 最新验收与事件迁移说明见末尾。

## 主会话最终复验资产（2026-09-30，三路评审修订后）

归档目录：`_agile-output/runtime-archives/ws-outbound-review-final-20260930/`。运行时 SHA-256：`ae9916f588e2ec3e73943c57ee4e3ca1241eb633f0445dab2fcae693dfd17815`；CLI SHA-256：`a573144b85ec4d34dc44b1fbb171fa3819a5da60b1e132061935f16484045567`。版本仍为 1.0.3，manifest 基线未包含未提交改动；这些资产不是更新后的公开 Release。

复现：在该独立目录依次执行 build-runtime-archive、verify-runtime-archive、npm pack，再运行 `node scripts/smoke-release-cli.mjs _agile-output/runtime-archives/ws-outbound-review-final-20260930/lapdev-cli-1.0.3.tgz _agile-output/runtime-archives/ws-outbound-review-final-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz`。所有命令退出码 0，归档 fileWatcher.ts 与源码 cmp 一致。前端大 chunk 警告保持为已知构建提示。

主会话逐项核验三路 16 个发现，原实现代理完成最小补丁：独立非凭据审计关联 ID、异常关闭、终端确认前复验、绑定拒绝审计、本地能力动态回归及历史状态标注。补丁后主会话完整执行后端 50 项（69 子步骤，含 30 个出站子用例）、Node 32 项和权限门禁 4 项，全部通过，git diff --check 通过。新包原 22 项检查通过；静默撤销/过期的新行为由实际出站分发测试证明，不宣称原实包检查具备该覆盖。

出站授权与文件订阅目标已完成；仍需处理 HTTP 等非 WebSocket 审计记录可复用 session 凭据、终端输入 await 后重验、递归树边界及路径竞态等留存问题，详见 deferred-work.md。未验证 macOS、完整远程终端、公开新资产安装或真实 LSP 功能，不能宣称远程部署全面安全。没有发布或外部状态变更。

最新结果：出站授权三路评审补丁完成，主会话完整复验通过：后端 **50 项（69 子步骤）**、Node **32 项**、权限门禁 **4 项**。评审后源码重建 Linux 包，安装/健康/首页及原核心检查 **22/22 通过**。生成归档仍未跟踪，未提交、推送或发布。下列首轮及历史资产保留；最终资产和留存风险见本报告末尾。

## WebSocket 出站授权与订阅隔离验收（2026-09-30）

本节追加本轮结果，历史失败与资产保留。已完整读取 `spec-websocket-outbound-authorization.md`，frontmatter `context: []`。保留已有未提交改动；没有提交、推送或发布。

`fileWatcher.ts` 为每连接保存会话仓库、文件订阅状态及原属远程标记，复用现有动态能力解析与审计。文件、Git、终端业务推送紧邻 send 检查当前会话、配置和连接状态；终端另检查已跟踪连接及绑定。撤销/过期在下一次业务推送清理全部映射并关闭；能力收紧只移除对应订阅或终端映射，恢复后须重新订阅/注册。文件取消订阅仍无确认消息。异常发送立即幂等清理，不输出路径、业务载荷或异常正文。保持终端处理器接口、现有缓冲消费、心跳及业务消息格式；未改变终端归属、远程 interactive 策略、文件树、LSP 或部署。

全部上轮测试断言保留；新增 23 个实际分发/出站子用例，覆盖显式文件订阅/取消、合法绑定输出、未跟踪/错误绑定拒绝、三类推送各自首次发现静默撤销/过期、多连接隔离、三种能力收紧/恢复、原属远程连接（含无上下文）切换本地仍拒绝，以及三类推送遇到关闭/发送异常/onerror/无状态的清理。拒绝审计核对身份关联且不含载荷；每个子用例 finally 释放连接与心跳。

验证：

- `npm run test:backend`：最终 **50 passed（62 steps）、0 failed**。首次新增审计断言误读顶层字段，修正为既有 correlation/details 信封字段后完整回归通过；生产审计格式没有修改。
- Node 四文件发布回归：**32 passed、0 failed、0 skipped**（`release-runtime-acceptance`、`release-listener`、`release-packaging`、`cli-download`）。
- `./scripts/release-permission-gate.sh`：**4 passed**；`git diff --check` 通过。
- 最终源码 frontend build、Rust release、Deno compile、归档结构校验及 npm pack 成功；归档内 `fileWatcher.ts` 与最终源码逐字比较一致。前端仍有既有大 chunk 警告。
- 最终 Linux 实包安装、版本、健康、首页及原有 **22/22** 核心/安全检查全部通过，smoke 退出码 **0**。新的出站矩阵由后端分发测试证明，未把原 22 项实包检查描述为静默撤销覆盖。结束后未发现 smoke/listener 验收服务进程残留。

最终资产目录：`_agile-output/runtime-archives/ws-outbound-authorization-final-20260930/`。运行时 SHA-256：`0b4a9132e5bf9231e1b04c283a87f7cb932e2b0df1c4257f01a1490b0d24298d`；CLI SHA-256：`a573144b85ec4d34dc44b1fbb171fa3819a5da60b1e132061935f16484045567`。首轮独立目录 `ws-outbound-authorization-20260930/` 保留，首轮也是 22/22，通过后补强无上下文远程连接模式切换保护并重建最终包。版本仍为 1.0.3，manifest commit 仍为 `aea6d4e0e9fe21e1ca79fc453e95cf926ab2766e`，不包含本轮未提交改动，应按上述资产哈希识别。

```sh
RUNTIME_OUTPUT_DIR=_agile-output/runtime-archives/ws-outbound-authorization-final-20260930 ./scripts/build-runtime-archive.sh linux-x64
./scripts/verify-runtime-archive.sh _agile-output/runtime-archives/ws-outbound-authorization-final-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz linux-x64
npm pack ./cli --pack-destination _agile-output/runtime-archives/ws-outbound-authorization-final-20260930
node scripts/smoke-release-cli.mjs _agile-output/runtime-archives/ws-outbound-authorization-final-20260930/lapdev-cli-1.0.3.tgz _agile-output/runtime-archives/ws-outbound-authorization-final-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz
```

覆盖边界：未验证完整远程终端、macOS、新公开 URL 安装或真实 LSP 语言功能；并发终端入站异步窗口及既有终端归属问题依规格留待另案。外部客户端若依赖隐式文件广播，须显式发送 subscribe。会话撤销没有新增即时通知；拒绝输出没有新增重放或持久化。当前环境没有子代理能力，本实现会话未宣称独立多代理评审；规格保持 in-progress 供主会话评审交接。

## 历史：消息级补丁后资产与评审结论（出站授权实施前）

本节及后续历史章节保留当时结论和失败证据，不代表当前待办或最终源码状态。出站授权及文件订阅目标已由后续规格实施；最新评审修订见本报告末尾。以下旧资产不包含本轮评审修订。

新归档目录：`_agile-output/runtime-archives/core-acceptance-ws-review-patch-20260930/`。Linux 运行时 SHA-256：`7bc302474e2807d659c67fcb73ef02e1d39a306a8ed1aae4a4b494dfb46a62b3`；CLI `.tgz` SHA-256：`a573144b85ec4d34dc44b1fbb171fa3819a5da60b1e132061935f16484045567`。版本字段仍是 1.0.3，资产不同于旧公开 Release，未发布；manifest 基线 commit 不包含本轮未提交改动。

复验命令：`node scripts/smoke-release-cli.mjs _agile-output/runtime-archives/core-acceptance-ws-review-patch-20260930/lapdev-cli-1.0.3.tgz _agile-output/runtime-archives/core-acceptance-ws-review-patch-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz`。归档验证和实包验收退出码均为 0。

主会话组织三路正式评审并逐项归类；三项最小补丁修正 Git 拒绝后的订阅清理、旧远程连接跨模式切换回归及报告当前摘要。五组既有问题记入 `deferred-work.md`：远程终端归属/正向验收、出站授权/静默会话撤销、文件订阅广播、递归树边界和异步副作用校验窗口。macOS、路径检查/I-O 竞态及同步外部命令超时为此前留存问题，未宣称修复。LSP 仅验证状态契约，未安装或验证真实语言功能。

历史实包结果（2026-09-30，出站授权实施前）：消息级授权和正式评审补丁全部完成后，主会话从新源码构建独立 Linux 归档并复验，**22/22 通过，退出码 0**；files-only Git/终端消息严格返回 `CAPABILITY_DENIED`。后端 49 项（39 子步骤）、Node 32 项及权限门禁 4 项通过。当时规格已完成已批准范围，但仍有出站授权与递归树边界等既有风险留待处理，不表示远程部署全面安全。本轮未提交、推送或发布；历史补丁后资产身份见对应章节。

## 历史阶段记录（以下保留当时结论，不代表当前状态）

历史状态（2026-09-30，消息级授权修复前）：评审修订已实现并从新源码重建独立 Linux 归档；新增完整检查为 **20 passed、2 failed，退出码 1**。files-only 远程会话实际收到未授权的 `gitSubscribed` 和 `terminalRegistered`，发布验收不通过。规格保持 in-progress，当时生产授权未修改。以下此前的 12/18、18/18 及评审暂停文字均作为历史证据保留。

历史独立复验（2026-09-30，消息级授权修复前）：评审修订后的 Linux 新归档经主会话独立复验，20/22 检查通过、退出码 1；files-only 会话仍收到未授权 gitSubscribed 与 terminalRegistered。后端 48 项、Node 32 项及权限门禁 4 项通过。下文 12/18 与 18/18 为保留的历史证据。

历史授权暂停：上一轮评审中的环境隔离、项目技能链接、多实例清理、TLS 显式监听验证已落实修订；旧 Compose 已停止支持并归档。新增消息级检查暴露生产授权缺陷，当时尚未获准修复，不进入完成状态。详见规格的 Review Triage Log；当时未提交或发布，不能宣布发布就绪。

日期：2026-09-30。基线：`aea6d4e0e9fe21e1ca79fc453e95cf926ab2766e`。
规格的 frontmatter `context: []` 已核对，规格全文已加载。

验收工具与批准的最小监听修复已实现。真实 Linux 包验收退出码为 **1**：
18 项检查中 12 项通过、6 项失败；不能宣布核心能力与安全验收整体通过。
没有提交、推送、修改 Release、发布、调用真实 AI 或安装语言服务器。

## 实现范围

- 新增 `scripts/release-runtime-acceptance.mjs`：隔离 HOME、缓存、临时目录、Git 配置、工作区及凭据，生成独有 Codex 技能、临时 Git 仓库、外部哨兵和符号链接夹具。每项检查独立报告，断言失败汇总为非零退出。
- `scripts/smoke-release-cli.mjs` 保留同一下载/安装流程，在健康和首页检查后调用验收；独立回环 remote-shared 实例使用随机凭据且只授权 files；清理退出后的启动器遗留进程组。
- HTTP、HTTPS、TLS 回退显式使用 `LAPDEV_HOST`，默认 `127.0.0.1`；CLI 显示配置地址、IPv6 方括号和 TLS 协议。受限入口允许读取此变量，未增加能力授权、子进程或网络权限。
- 新增失败、超时、拒绝契约、资源隔离与清理测试，以及配置和实际 HTTP/HTTPS/回退监听回归测试。
- CI 两平台构建包、公开 URL 安装仍调用同一冒烟入口，步骤名明确核心与安全验收；安装文档补充监听和外部工具依赖。

## 真实包身份与复现命令

Linux x64；Node.js 24.16.0、Deno 2.8.2。本次工作树源码构建，CLI 与运行时版本
字段仍为 `1.0.3`，不是旧公开 v1.0.3 Release；manifest 的 commit 为上述基线，
不代表未提交改动已进入该 commit。以此次构建和以下哈希识别资产。

```sh
./scripts/build-runtime-archive.sh linux-x64
./scripts/verify-runtime-archive.sh _agile-output/runtime-archives/lapdev-runtime-1.0.3-linux-x64.tar.gz linux-x64
npm pack ./cli --pack-destination _agile-output/runtime-archives
node scripts/smoke-release-cli.mjs _agile-output/runtime-archives/lapdev-cli-1.0.3.tgz _agile-output/runtime-archives/lapdev-runtime-1.0.3-linux-x64.tar.gz
```

资产 SHA-256：

- CLI：`fa3ed59d7aa65e1ce17b7fe65ccef0f1564644349477f6beb62c6c21847dbba5`
- Linux 运行时：`93b432cca7e2b8964269635caf70790195bac37f11374dbb9f26b549fdbe710b`

构建、归档结构校验与 CLI 安装成功。前端构建有大 chunk 警告，但成功完成。

## 真实包检查结果

| 检查 | 结果 | 证据与覆盖边界 |
|---|---|---|
| 安装、健康、首页 | 通过 | 已安装 CLI 版本一致；真实打包服务 `/health` 和 HTML 首页返回成功 |
| files | 通过 | API 创建、读取、更新、树节点及磁盘内容一致 |
| git | 通过 | 临时已提交夹具修改后，状态包含 modified，diff 包含 `-baseline` 与 `+modified-release-fixture` |
| websocket | 通过 | 实际连接 `/ws`，订阅收到 `subscribed` |
| terminal | 通过 | 创建 session、执行分段拼接 printf 标记、轮询获得实际标记、关闭成功；关闭后 output 返回 400 / Session not found |
| skills-load/list/match | 三项失败 | load 的 skills=[]、projectCount=0、codex-primary available=false；list 与 match 都找不到独有工作区夹具 |
| lsp-status | 通过（仅状态） | status=success、running=false；未请求 completion/hover 等语言功能 |
| 外部绝对路径、两种 traversal 读写 | 六项通过 | read 返回 404 / Invalid workspace path；write 返回 403 / error |
| 外部符号链接读写 | 两项失败 | `/workspace/outside-link.txt` 的 read 和 write 均返回 **200** |
| 哨兵不变 | 失败 | 原内容 `outside-40c3920b-41b1-4cfa-b661-2101b49189dd` 被改为 `must-not-write`，仅影响测试自己创建的临时夹具 |
| remote-authorization | 通过 | 八类能力无会话均 401 / UNAUTHENTICATED；无会话实际 WS Upgrade 401；交换临时会话后 files 和 WS Upgrade 成功，其余七类 API 403 / CAPABILITY_DENIED |

汇总原始错误：

```text
Release acceptance failed: skills-load, skills-list, skills-match,
workspace-boundary-read-3, workspace-boundary-write-3, workspace-boundary-sentinel
```

LSP 依赖检查：`typescript-language-server`、`pylsp`、`gopls` 缺失；
`rust-analyzer --version` 探测失败，不能视为可用。工具存在或状态通过均不证明
实际语言服务器功能。没有安装这些依赖。

## 缺陷证据与未完成项

1. **工作区技能发现失败**：`SkillService` 构造时从 `Deno.cwd()` 查找 `.agents/skills`；
   安装 CLI 将 cwd 设为 runtime root，而夹具位于显式 WORKSPACE_PATH。
   未注册其他目录或用仓库自身技能绕过失败。修复不在本次批准范围。
2. **符号链接工作区边界漏洞**：`WorkspaceBoundary.resolve()` 对已存在、canonical
   路径在工作区外的文件，仍可在父目录位于工作区内时返回 candidate。
   因此 file read/write 实际访问工作区外哨兵。需要另行安全修复；本次仅记录，
   不修改授权或边界实现。既有后端边界单元测试全绿，不能替代此次真实失败证据。
3. macOS 未实测，特别是 `/usr/bin/script -qc` 参数兼容性未解决。
4. 公开 URL 安装此次未运行：旧公开资产不包含监听修复，禁止用于回环修复验收。
   新版本未发布；只更新了未来 CI 的共同验收入口。
5. 核心全通过与越界哨兵不变两项标准仍未满足。规格保持 in-progress，不能标记 done。

## 回归与清理

- `node --test tests/release-runtime-acceptance.test.mjs tests/release-listener.test.mjs tests/release-packaging.test.mjs tests/cli-download.test.mjs`：最终 27 passed，0 failed。
  真实 HTTP、HTTPS、TLS 失败回退默认监听回环，
  显式 `127.0.0.2` 配置实际生效；配置测试验证 remote profile 不自动扩大监听。
- `npm run test:backend`：45 passed（39 steps），0 failed。
- `git diff --check`：通过。
- 真实包失败后检查：没有遗留 lapdev-server、测试 CLI、`script -qc` 进程，
  `/tmp/lapdev-release-smoke-*` 和 `/tmp/lapdev-listener-test-*` 临时资源已删除。
- 保留本次新构建归档与 CLI tgz 在 `_agile-output/runtime-archives/`，便于复验；
  没有使用或覆盖旧 Release 资产。

## 主会话复核

主会话审阅含新增文件的基线差异后，再次运行完整 Node 四文件回归：27 passed、0 failed、0 skipped；重新运行同一新源码 Linux 包验收，仍为 12 passed、6 failed、退出码 1。确认失败不是单次抖动；未进入 bmad-build 的通过后评审阶段。

`./scripts/release-permission-gate.sh` 通过：运行时契约一致，4 项部署权限测试通过。`bash -n scripts/entrypoint.sh` 通过。

监听兼容性补充：既有镜像 CI 健康检查显式传递 `LAPDEV_HOST=0.0.0.0`，使容器内部监听与既有端口映射兼容；既有端口映射和权限不变。未启动该 CI、构建镜像或重新启用镜像发布。

## 批准修复后的重新构建与验收（2026-09-30）

本节追加最终结果，前文 12/18 与哨兵被改写的失败证据保持原样。

- `WorkspaceBoundary` 使用 `lstatSync` 区分真正不存在的路径和悬空链接；已存在的目标只允许 canonical 路径位于 canonical 工作区根内，失败后不再回退父目录。只有 NotFound 才向最近存在的父路径检查；其他错误拒绝访问。工作区根为有效符号链接时仍支持内部路径。
- `SkillService` 项目来源使用显式 `WORKSPACE_PATH`，未配置时回退 cwd。未注册外部目录；Codex、旧项目来源和全局来源的现有优先级未改动。
- 新增外部文件/目录、悬空链接及其子路径、内部文件/目录链接、新建深层路径、canonical 工作区根回归；技能测试把 runtime cwd 与工作区分开，验证 load/list/match、重复来源及无配置兼容。

新资产由此次未提交工作树构建，版本字段仍为 `1.0.3`，manifest commit 仍为基线
`aea6d4e0e9fe21e1ca79fc453e95cf926ab2766e`，不代表该提交包含此次改动。
原失败归档保留，新文件位于 `_agile-output/runtime-archives/core-acceptance-fixed/`。

```sh
RUNTIME_OUTPUT_DIR=_agile-output/runtime-archives/core-acceptance-fixed ./scripts/build-runtime-archive.sh linux-x64
./scripts/verify-runtime-archive.sh _agile-output/runtime-archives/core-acceptance-fixed/lapdev-runtime-1.0.3-linux-x64.tar.gz linux-x64
npm pack ./cli --pack-destination _agile-output/runtime-archives/core-acceptance-fixed
node scripts/smoke-release-cli.mjs _agile-output/runtime-archives/core-acceptance-fixed/lapdev-cli-1.0.3.tgz _agile-output/runtime-archives/core-acceptance-fixed/lapdev-runtime-1.0.3-linux-x64.tar.gz
```

SHA-256：

- Linux 运行时：`c6ed1a9ba0f616b0d44a040542a001f148c8da7ec2eea0c6a35c022672856202`
- CLI：`fa3ed59d7aa65e1ce17b7fe65ccef0f1564644349477f6beb62c6c21847dbba5`

构建、归档校验、CLI 安装、版本、健康和 HTML 首页检查成功。
真实核心与安全检查 **18 passed、0 failed，退出码 0**：files、Git、WebSocket、
terminal、skills-load/list/match、lsp-status、全部八项越界读写、哨兵不变和
remote-authorization 均通过。之前失败的外部文件链接读返回 404、写返回 403，
哨兵内容保持不变。远程无会话 API/WS 拒绝，会话仅授权 files 的检查仍通过。
验收矩阵八行均由真实包检查覆盖；失败、超时与进程组清理另有 Node 回归覆盖。

验证：`npm run test:backend` 为 47 passed（39 steps）、0 failed；Node 四文件发布
回归为 27 passed、0 failed、0 skipped；release permission gate 为 4 passed；
`git diff --check` 与 `bash -n scripts/entrypoint.sh` 通过。
结束后未发现测试 CLI、服务、`script -qc` 进程或 smoke/listener 临时资源残留。

剩余覆盖与风险：macOS 未实测，`script -qc` 平台兼容性仍未知；新公开 URL 安装未运行；
LSP 仅验证状态契约，typescript-language-server、pylsp、gopls 缺失，rust-analyzer
版本探测失败，真实语言功能未验证。前端构建保留大 chunk 警告。
本次边界修复处理检查时已存在的链接，不宣称消除了路径检查与实际 I/O 之间的并发替换竞态。
审阅了本次及既有实现差异；当前环境没有子代理工具，未进行独立多代理评审。
没有发布、提交、推送、修改旧 Release、调用真实 AI 或安装语言服务器。

## 评审修订实现与真实复验（2026-09-30）

本轮完整读取规格，frontmatter `context: []` 没有额外文件。保留跨轮暂存改动、既有归档和全部 18 项真实包检查；新增四项检查，没有放宽失败断言。

实现：

- 默认 `docker-compose.yml` 移至 `docs/legacy/docker-compose.yml`，只追加不受支持的归档说明，原正文逐字核对一致。`README.Docker.md` 指向 Release 安装和历史资料，旧全文保存在 `docs/legacy/README.Docker.md`。用户指南移除 Compose 启动推荐，历史 Docker 示例明确标注；更新脚本移除 Compose 和历史部署文档的自动更新。不操作实际容器、镜像、卷或数据，Dockerfile/entrypoint/构建依赖保留。
- 验收环境从必要变量白名单构建，仅保留 PATH、平台/语言/终端变量和无认证代理；重建 HOME、缓存、临时目录、npm/Git 配置和 KV 路径。合成供应商、云、GitHub 及任意密码验证不进入运行时子进程。真实终端仅在上述凭据变量为空时输出拼接标记，避免输入回显冒充成功。
- 认证代理仅传给 npm 安装和独立 CLI 下载进程；CLI 增加 `web --download-only`，复用现有下载、完整性校验和缓存安装，在启动服务前返回。服务/终端使用独立白名单环境；下载失败日志不外泄代理凭据。公开 URL 路径仍采用相同冒烟和验收入口，但本轮未实际下载旧公开包。
- 项目主/旧技能来源根、技能目录与读取文件逐层限制于 canonical 项目根，外部及悬空链接失败关闭并产生诊断；内部有效链接和符号链接工作区根可用。项目外显式全局来源、cwd 兼容及来源优先级保留。真实包 load/list/match 拒绝外部 SKILL.md 链接。
- 使用带 Cookie 的真实 RFC 6455 掩码消息验证文件订阅、Git 订阅和终端注册。终端探针使用已认证会话自身标识，避免只触发 SESSION_MISMATCH 掩盖能力缺口；不输出会话标识或凭据。
- 每个实例独立尝试关闭，全部清理后汇总异常并保持非零退出；回归覆盖第一及中间实例关闭失败后最后实例仍被尝试。实例成功关闭后不会重复向旧进程组发信号。
- HTTP、真实 TLS 和证书缺失回退分别运行默认回环与显式 `127.0.0.2`，核对实际监听日志和健康请求，未扩大生产监听或 TLS 权限。

资产由本轮未提交工作树构建，版本仍为 `1.0.3`；manifest commit 为
`aea6d4e0e9fe21e1ca79fc453e95cf926ab2766e`，不能据此认为该提交含本轮实现。
独立目录：`_agile-output/runtime-archives/core-acceptance-review-20260930/`。

```sh
RUNTIME_OUTPUT_DIR=_agile-output/runtime-archives/core-acceptance-review-20260930 ./scripts/build-runtime-archive.sh linux-x64
./scripts/verify-runtime-archive.sh _agile-output/runtime-archives/core-acceptance-review-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz linux-x64
npm pack ./cli --pack-destination _agile-output/runtime-archives/core-acceptance-review-20260930
node scripts/smoke-release-cli.mjs _agile-output/runtime-archives/core-acceptance-review-20260930/lapdev-cli-1.0.3.tgz _agile-output/runtime-archives/core-acceptance-review-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz
```

SHA-256：

- 运行时：`66b70e2c799e68992068660e5077d9dd476ea1aee2f94825d31fde6b7903dcda`
- CLI：`a573144b85ec4d34dc44b1fbb171fa3819a5da60b1e132061935f16484045567`

构建、归档结构校验、CLI 安装、版本、健康与 HTML 首页成功。全部既有 18 项真实包检查通过；新增项目技能边界和远程文件消息两项通过。新增 Git/终端拒绝两项失败，合计 **20/22 通过，退出码 1**。

| 新增检查 | 最终结果 | 证据 |
|---|---|---|
| skills-project-boundary | pass | 外部 SKILL.md 不出现在 load/list/match 中，load 有错误诊断 |
| remote-ws-files | pass | files-only 会话实际收到 subscribed |
| remote-ws-git-denied | fail | 应拒绝但收到 gitSubscribed |
| remote-ws-terminal-denied | fail | 匹配会话注册应拒绝但收到 terminalRegistered |

首次终端探针使用不匹配标识，返回 `SESSION_MISMATCH`，同样未满足能力拒绝断言；最后改为匹配会话后确认实际返回 `terminalRegistered`。Git 未授权成功两次复验一致。终端注册确认绕过能力检查，不等同于已证明能够创建进程或执行终端输入。

后端 `backend/src/websocket/fileWatcher.ts` 的 `subscribeToGit` 无 Git 能力检查；`terminalRegister` 仅检查会话绑定，没有 terminal 能力检查。按规格保持明确失败并报告，未改生产授权、未跳过检查，不能宣布安全验收或发布就绪。

验证：

- `npm run test:backend`：48 passed（39 steps），0 failed；来源根、技能目录、SKILL.md 外部/悬空链接和内部有效链接、全局来源及 canonical 根测试均实际运行。
- Node 四文件发布回归：32 passed、0 failed、0 skipped；最后消息探针调整后验收辅助回归再次 12/12 通过。
- `./scripts/release-permission-gate.sh`：4 passed；`git diff --check`、`bash -n scripts/update-config.sh scripts/entrypoint.sh` 通过。
- 初次新增全局夹具误用基线不支持的全局文件链接导致 1 项测试失败；修正为真实全局普通文件验证项目边界不影响全局来源，后端完整复跑通过。初次新增原始 WebSocket mock 未结束服务端半关闭连接而挂住；补齐测试夹具关闭并停止该次测试进程，完整 Node 复跑通过。

剩余：上述消息级能力缺口需要单独批准生产授权修复；macOS、公开 URL 和真实 LSP 功能未实测；typescript-language-server/pylsp/gopls 缺失，rust-analyzer 版本探测失败。原有路径检查与实际 I/O 竞态、无工作区配置的来源差异及旧同步安装/版本/tar 命令期限缺口仍未修复；前端构建仍有大 chunk 警告。本轮没有子代理能力，未进行独立多代理评审。历史失败证据均保留，没有发布、提交、推送、修改旧资产、调用真实 AI 或安装语言服务器。

### 主会话独立复验

上述“没有子代理能力”只描述实现代理的运行环境。主会话已独立重跑后端 48 项（39 子步骤）、Node 32 项及权限门禁 4 项，全部通过；真实 Linux 包再次为 20/22、退出码 1，两项失败响应一致。`bash -n scripts/update-config.sh scripts/entrypoint.sh` 与 `git diff --check` 通过。安全矩阵不满足，按 bmad-build 停在实现验收，不进入本轮正式三路评审或完成状态；下一步须批准 WebSocket 消息级生产能力授权修复。默认 Compose 配置已迁至历史目录，原配置可恢复，没有删除实际容器、卷或用户数据。

最终交接：用户明确要求停止在生产授权边界，后端授权没有修复。最后完整复跑后端为 48 passed（39 steps），Node 四文件为 32 passed、0 skipped，权限门禁为 4 passed；shell 语法与差异空白检查通过。真实包最后结果仍为 20/22、退出码 1。结束后未发现验收服务进程，`/tmp` 中 smoke/listener 临时目录列表为空；所有历史及本轮归档保留。规格维持 in-progress，交回主会话独立复验及请求下一步批准，不进入通过后的正式评审或发布。

## 已批准消息级授权修复与最终实包验收（2026-09-30）

本轮完整读取 169 行规格，`context: []`。沿用全部既有改动及失败断言，没有修改冻结区、旧归档或此前 20/22 失败证据。

`fileWatcher.ts` 在七类能力消息分发前调用既有 `resolveCapabilityContext`、`authorizeCapability` 和 `auditCapabilityDecision`，每条消息重新读取服务端 allowlist，不使用消息携带的能力或连接时缓存的授权。文件订阅/取消映射 files，Git 订阅/取消映射 git，终端注册/输入/注销映射 terminal；拒绝发送 `error/CAPABILITY_DENIED` 后立即返回。保持过期/撤销会话关闭和清理、终端绑定、心跳及未知消息语义，补齐输入和注销的绑定检查。没有改变 capability 策略、监听或部署授权。

新增 `fileWatcher.test.ts` 从实际 `handleWebSocket` 的 onmessage 入口运行全部七类消息。验证 files-only 拒绝 Git/终端，拒绝注册不会覆盖原连接、拒绝注销不会删除映射、拒绝 Git 取消不会移除订阅、拒绝输入不调用转发且拒绝注册不刷新输出；验证合法 Git/终端、文件消息、当前 allowlist 收紧/放开、不信任缓存能力、跨会话操作、匿名及缺失/撤销/过期远程会话、local-trusted 和未知消息。服务端会话仓库及终端刷新/转发允许注入隔离测试替身，生产默认仍使用既有仓库和真实处理器；所有测试连接和心跳在 finally 清理。终端处理器调用回归使用替身，真实进程输出和关闭由实包 terminal 检查覆盖。

主验证（本实现会话执行，非独立评审）：

- `npm run test:backend`：49 passed（39 steps）、0 failed；最终修改后完整复跑通过。
- `node --test tests/release-runtime-acceptance.test.mjs tests/release-listener.test.mjs tests/release-packaging.test.mjs tests/cli-download.test.mjs`：32 passed、0 failed、0 skipped。原有严格拒绝断言及全部 22 项实包检查保持不变。
- `./scripts/release-permission-gate.sh`：4 passed；`bash -n scripts/update-config.sh scripts/entrypoint.sh scripts/build-runtime-archive.sh`、`git diff --check` 通过。
- 前端生产构建、Rust release 和 Deno compile 通过；归档结构校验通过；归档中 fileWatcher.ts 与最终源码逐字比较一致。

最终资产来自未提交工作树，版本仍为 1.0.3，manifest commit 仍为 `aea6d4e0e9fe21e1ca79fc453e95cf926ab2766e`，该提交本身不包含本轮改动。独立目录：`_agile-output/runtime-archives/core-acceptance-ws-auth-final-20260930/`。

```sh
RUNTIME_OUTPUT_DIR=_agile-output/runtime-archives/core-acceptance-ws-auth-final-20260930 ./scripts/build-runtime-archive.sh linux-x64
./scripts/verify-runtime-archive.sh _agile-output/runtime-archives/core-acceptance-ws-auth-final-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz linux-x64
npm pack ./cli --pack-destination _agile-output/runtime-archives/core-acceptance-ws-auth-final-20260930
node scripts/smoke-release-cli.mjs _agile-output/runtime-archives/core-acceptance-ws-auth-final-20260930/lapdev-cli-1.0.3.tgz _agile-output/runtime-archives/core-acceptance-ws-auth-final-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz
```

SHA-256：运行时 `8713026acf97ec01ce39076332ab773c6496a75a98ace9518d3864b4511b4701`；CLI `a573144b85ec4d34dc44b1fbb171fa3819a5da60b1e132061935f16484045567`。

最终真实包 **22/22 通过，退出码 0**。原八行矩阵均实际运行通过：文件创建/读写/树、Git 状态/差异、终端输出/关闭、WebSocket 确认、工作区技能 load/list/match、LSP 状态与依赖记录、越界读写拒绝及哨兵不变、远程无会话 API/WS 拒绝及 files-only 消息能力拒绝。`remote-ws-git-denied` 和匹配会话的 `remote-ws-terminal-denied` 均收到严格 `CAPABILITY_DENIED`，没有用 SESSION_MISMATCH 或超时代替。此前首轮独立目录 `core-acceptance-ws-auth-20260930/` 的包也为 22/22，通过后补强终端副作用回归并重建最终归档；首轮归档保留。

剩余覆盖与风险：主会话独立复验和正式评审尚待执行，规格保持 in-progress。macOS、公开 URL 安装及真实 LSP 语言功能未实测；typescript-language-server/pylsp/gopls 缺失，rust-analyzer 版本探测失败。既有路径校验与 I/O 竞态、无工作区配置来源差异、旧同步安装/版本/tar 命令期限缺口仍保留；前端大 chunk 警告仍存在。本环境无子代理工具，未宣称完成独立多代理评审。没有发布、提交、推送、修改旧 Release、操作用户容器或数据、调用真实 AI 或安装语言服务器。

## 出站授权评审修订（2026-09-30，最新源码）

每个连接生成稳定的非凭据审计 session 关联 ID，仅替换 WebSocket 能力/生命周期审计的 session 字段；认证上下文与公共审计信封不变。移除 WebSocket 控制台原始会话 ID，绑定拒绝另发 `SESSION_MISMATCH` 拒绝审计。解析、处理器、业务发送失败先幂等清理再关闭；终端 flush 后在注册确认前重新检查授权与当前映射，失效不发虚假成功。terminalInput 已延期异步窗口未修改。

针对性回归：`npm run test:backend -- src/websocket/fileWatcher.test.ts`，**2 passed（30 steps）、0 failed**。新增全部 console 捕获，断言无认证凭据/业务载荷，同时核对稳定关联、身份/工作区/请求关联及绑定拒绝；覆盖实际畸形消息、处理器/发送异常关闭和其他客户端隔离、flush 移除/撤销/能力拒绝/发送失败、本地 Git 能力收紧及恢复须重订阅。发送替身抛出的错误包含原始业务消息，验证日志不会泄漏异常正文。新增夹具首轮有字符串引号语法错误，修正后针对性测试通过。

旧“最终”摘要已标为历史，后续工作记录仅追加两项已实施目标的解决说明，原条目原样保留。没有运行更广测试、重新构建实包、提交、推送或发布；全量验证及独立评审由主会话执行，历史包不含本轮修订。

## HTTP 审计凭据隔离验收（2026-09-30）

完整读取 `spec-http-audit-credential-isolation.md`，frontmatter 为 `context: []`。认证仓库生成独立 auditSessionId，认证索引仍只使用原 sessionId；exchange 返回复制，避免调用方修改服务端关联。HTTP/WS 握手审计使用安全 ID；匿名、本地及旧内部 context 缺失字段时生成 UUID fallback，绝不回退凭据。终端高风险拒绝复用入口 context 和 version 1 生产 emitter，不记录 body.sessionId 或命令。WebSocket 后续事件保留连接级 UUID；认证、撤销、过期、绑定、公共认证响应、权限及审计 correlation 结构不变。

生产函数日志捕获覆盖同会话 Cookie/Bearer 允许/拒绝、不同会话、audit ID 不能认证（401）、匿名/撤销/过期、本地及旧远程 context fallback、握手形状及后续 WebSocket 推送、终端拒绝关联和内容不泄露。仅用合成凭据，未读取真实凭据或历史日志。

- `npm run test:backend`：53 passed（69 steps），0 failed，最后测试补强后完整复跑通过。首次新增测试的 HeadersInit 联合类型推导错误已修正。
- Node 四文件发布回归：32 passed，0 failed，0 skipped。
- `./scripts/release-permission-gate.sh`：4 passed；`git diff --check` 通过。
- 新 Linux 前端构建、Rust release、Deno compile、归档校验及 npm pack 通过；smoke-release-cli 安装、启动、健康、HTML 首页及原 22 项实包检查全部通过，退出码 0。

新目录 `_agile-output/runtime-archives/http-audit-isolation-20260930/`，版本 1.0.3，manifest commit `d1feb45e30b74d16dd4c556f82e132cd05397d4f`；资产含本轮未提交修改，该提交本身不含本轮实现。历史资产未覆盖。

```sh
RUNTIME_OUTPUT_DIR=_agile-output/runtime-archives/http-audit-isolation-20260930 ./scripts/build-runtime-archive.sh linux-x64
./scripts/verify-runtime-archive.sh _agile-output/runtime-archives/http-audit-isolation-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz linux-x64
npm pack ./cli --pack-destination _agile-output/runtime-archives/http-audit-isolation-20260930
node scripts/smoke-release-cli.mjs _agile-output/runtime-archives/http-audit-isolation-20260930/lapdev-cli-1.0.3.tgz _agile-output/runtime-archives/http-audit-isolation-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz
```

SHA-256：运行时 `a6b70d784ed19f807554ebd970e73c727c32cafe01afe9ee0d8af6cde47d384d`；CLI `a573144b85ec4d34dc44b1fbb171fa3819a5da60b1e132061935f16484045567`。

范围限制：关联矩阵由生产函数回归证明，不冒充完整网络矩阵、跨平台验收或任意业务日志脱敏。macOS、公开 URL 安装及真实 LSP 功能未实测；语言服务器缺失及 rust-analyzer 版本探测失败，实包只证明 LSP 状态契约。前端仍有大 chunk 警告。未改变终端归属、入站异步窗口、文件边界、部署、外部身份或历史日志；未提交、推送或发布。本规格范围内无剩余实现项。

### 审计评审最小补丁（2026-09-30）

终端拒绝监控事件从 `type: terminal_command_denied` 迁移到 `type: security_audit, version: 1, outcome: denied, reason: high-risk-command`。旧顶层 `requestId` 对应新 `correlation.requestId`；旧顶层 `sessionId` 来自未经验证的 body，已移除，不能作为新标识延续；新 `correlation.sessionId` 是服务端安全审计关联 ID。`correlation.principalId/workspaceId/revision` 来自入口上下文及服务端 revision。命令内容不进入事件。监控方应更新事件筛选及字段路径；搜索 backend/frontend/scripts/tests 未找到仓库内 `terminal_command_denied` 消费者。

新增 `backend/src/security/httpAudit.test.ts` 由 backend 测试发现，启动真实 main.ts 子进程，清空环境并显式白名单配置、临时工作区、回环监听、合成凭据、请求/启动/关闭限时及 finally 清理。覆盖无 X-Request-Id 终端 HTTP 拒绝的入口/拒绝事件、响应 body/header 共享请求 ID 和安全关联，Cookie/Bearer 允许/拒绝 HTTP、实际 WS 101/401 握手审计及全部子进程输出不含凭据/命令。终端直接测试显式隔离/恢复策略环境，验证认证远程 supplied-context 及 omitted-context fallback。未改生产路由、公共 export、策略或执行权限。

代码快照补充：基线为 `d1feb45e30b74d16dd4c556f82e132cd05397d4f`。以下从仓库根执行的 code-only diff 字节流 SHA-256 为 `31d564428e19991fa519544f2204b7024d33f1028ccbe5a3e485bd5eedf3ae66`，排除 docs/tests，避免文档哈希循环：

```sh
git diff --binary --no-ext-diff --no-textconv d1feb45e30b74d16dd4c556f82e132cd05397d4f -- backend/src ':!backend/src/**/*.test.ts' | sha256sum
```

该差异只含 `backend/src/main.ts`、`backend/src/security/authSession.ts`、`backend/src/security/capability.ts`、`backend/src/handlers/terminalHandler.ts`、`backend/src/websocket/fileWatcher.ts`。其余未改 backend/src 生产源码来自基线。上述五个修改文件在已有 `http-audit-isolation-20260930/lapdev-runtime-1.0.3-linux-x64.tar.gz` 的 `./app/backend/src/` 对应路径中，逐个提取与当前源码字节比较一致。基线加此代码差异描述未提交生产代码快照；manifest commit 单独不能重建本轮代码。未宣称发布或从提交重建，本次未构建或覆盖资产；新增测试不在旧运行时包中。

本次仅执行 `npm run test:backend -- src/security/httpAudit.test.ts src/handlers/terminalPolicy.test.ts`：4 passed，0 failed；`git diff --check` 通过。夹具初次误用文件树路径，修正为既有 `/workspace` 句柄，未降低状态码断言。未运行全量测试或发布验收，交由主会话执行。
