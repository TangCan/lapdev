---
title: '发布运行时核心能力验收'
type: 'chore'
created: '2026-09-30'
status: 'done'
baseline_commit: 'aea6d4e0e9fe21e1ca79fc453e95cf926ab2766e'
route: 'dispatch'
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

问题：v1.0.3 发布验收仅证明安装、健康接口及首页可用，不能证明打包后的 IDE 核心能力可用。

方案：增加真实发布包核心能力验收，在隔离工作区验证文件、Git、终端、WebSocket、Codex 技能发现和 LSP 状态；记录缺失依赖及实际失败。复用现有发布冒烟入口，让构建包与公开 URL 安装采用同一验收标准。

## Boundaries & Constraints

始终：使用临时 HOME、工作区、缓存及回环监听；测试仅修改自己的夹具，设置超时并清理进程。保持现有权限和授权规则；远程安全测试使用独立实例及临时凭据，不输出凭据。区分平台能力、外部依赖与断言失败。

用户于 2026-09-30 批准范围扩展：先修复后端默认监听，HTTP、HTTPS 及回退分支默认绑定 `127.0.0.1`；允许部署通过明确的 `LAPDEV_HOST` 环境配置指定监听地址，保持授权策略不变。CLI 启动提示应反映实际配置，受限入口允许读取该变量；外部监听必须显式配置，不按远程 profile 自动扩大暴露。补充监听回归测试和部署说明。只能在修复后从新源码构建的归档中进行回环验收，旧 v1.0.3 包不冒充已修复包；不修改旧资产，不发布。

用户再次批准修复真实验收发现的两项缺陷：工作区边界对已存在的外部符号链接必须失败关闭，不可回退到父目录检查；只有真正不存在的普通新路径才检查最近存在的父路径。覆盖外部文件/目录、悬空链接及有效工作区内链接，兼容工作区根的 canonical 路径。技能项目来源使用显式 `WORKSPACE_PATH`，无配置时保留源码 cwd 兼容；`.agents/skills` 主来源和旧/全局来源优先级不变。不得注册任意外部目录绕过验收。保留全部既有真实包断言，修复后重建并复验；记录尚未验证的 macOS 与真实语言服务器能力，不擅自扩大平台修复范围。

用户于 2026-09-30 明确决策：旧 Docker Compose 部署停止支持。不得为兼容旧 Compose 自动恢复外部监听；当前安装推荐继续使用 GitHub Release 托管的 CLI `.tgz` 与平台运行时。保留历史资料和开发/构建所需文件，不停止或删除用户正在运行的容器、卷或工作区数据。

用户在真实包 20/22 失败证据后明确批准：修复 WebSocket 消息级生产能力授权并补充回归。此批准只收紧消息分发，使文件、Git、终端消息使用既有能力策略和当前有效会话；不增添授权、扩大监听或修改外部部署权限。覆盖 Git 订阅/取消、终端注册/输入/注销及文件订阅/取消，拒绝消息必须可观察且不得产生对应副作用；保留会话绑定与过期/撤销检查，并验证合法授权和 local-trusted 兼容。

禁止：发布新版本、提交或推送、修改既有 Release、注册 npm、调用真实 AI、安装语言服务器、扩展生产权限。新安装渠道和浏览器交互 E2E 不属于本次范围。发现实现缺陷时先记录，不通过跳过或放宽断言掩盖失败；需要扩大修复范围时单独报告。

## I/O & Edge-Case Matrix

| 场景 | 输入 | 期望 | 错误处理 |
|---|---|---|---|
| 文件 | 临时文本创建、读写、树查询 | 内容及树一致 | 明确能力断言失败 |
| Git | 临时仓库与修改文件 | 状态、差异能反映修改 | 缺少 Git 明确失败 |
| 终端 | 无害输出标记命令 | 创建、输出、关闭正常 | 超时失败并清理 |
| WebSocket | 本地订阅 | 收到协议确认 | 有界等待并关闭连接 |
| 技能 | 工作区 `.agents/skills` 夹具 | 加载、列表及匹配正确 | 禁止读取仓库自身技能冒充成功 |
| LSP | 状态查询及依赖检查 | 状态符合响应契约，缺失依赖清楚记录 | 不将状态查询冒充语言功能验证 |
| 越界路径 | 工作区外哨兵文件 | 读写被拒绝、哨兵不变 | 成功访问即失败 |
| 未授权 | 独立 remote-shared 实例 | API 与 WebSocket 无会话拒绝；有效会话仅允许配置能力 | 授权不一致即失败 |

</frozen-after-approval>

## Code Map

- `scripts/smoke-release-cli.mjs`：现有安装、随机端口、启动及进程组清理；扩展而不复制下载流程。
- `.github/workflows/runtime-release.yml`：Linux/macOS 构建与公开安装均调用上述入口。
- `backend/src/main.ts`、`backend/src/security/capability.ts`：路由、会话交换及既有能力授权；本轮复用策略进行消息级拒绝，不扩展权限或重写会话机制。
- `backend/src/handlers/{file,git,terminal,skill,lsp}Handler.ts`、`backend/src/websocket/fileWatcher.ts`：响应和消息契约。
- `backend/src/services/skillService.ts`：目前项目技能路径来自 `Deno.cwd()`，CLI 启动 cwd 是运行时目录；验收必须检查用户工作区。
- `backend/src/handlers/terminalHandler.ts`：目前固定 `/usr/bin/script -qc`，需实测平台兼容性。
- `scripts/build-runtime-archive.sh`：归档包含编译服务、FFI、前端；不包含 Git 和语言服务器。
- `docker-compose.yml`、`README.Docker.md`、`docs/user-guide.md`、`scripts/update-config.sh`：旧 Compose 默认入口、运行说明及自动配置更新；需要归档默认入口并停止推荐，不删除 Dockerfile、运行时 entrypoint 或构建依赖。
- `scripts/release-runtime-acceptance.mjs`、`tests/release-listener.test.mjs`：环境隔离、消息验证及监听测试；现有 18 项实包检查必须保留，补充项不能冒充已通过。

## Tasks & Acceptance

执行：

- [x] `scripts/release-runtime-acceptance.mjs`：提取可调用验收逻辑，准备夹具并运行核心及安全检查。
- [x] `backend/src/config/index.ts`、`backend/src/main.ts`、`cli/bin/lapdev.js`、`scripts/entrypoint.sh` 及监听测试：实现显式地址配置、回环默认值和真实提示；保持权限不扩大。
- [x] `scripts/smoke-release-cli.mjs`：健康检查后调用验收，隔离环境配置，复用清理，汇总结果。
- [x] `tests/release-runtime-acceptance.test.mjs`：覆盖断言失败、超时、拒绝检查及清理边界，不能以模拟测试替代真实包运行。
- [x] `.github/workflows/runtime-release.yml`：运行新增测试，明确核心验收步骤名称，沿用两平台矩阵。
- [x] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md`：记录真实包版本、命令、覆盖及缺口；视需要同步 `docs/release-installation.md` 的依赖说明。
- [x] `backend/src/security/workspaceBoundary.ts`、`backend/src/security/workspaceBoundary.test.ts`：修复 canonical 越界错误回退，增加文件/目录/悬空/内部符号链接及根路径回归。
- [x] `backend/src/services/skillService.ts`、`backend/src/services/skillSourceRegistry.test.ts`：从配置的用户工作区发现项目技能，测试 runtime cwd 与工作区分离下的 load/list/match；保留来源兼容性。
- [x] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md`：追加修复与重新构建归档的哈希、真实验收结果，不覆盖此前失败证据。

评审回环新增执行项（本轮用户明确要求实现）：

- [x] `docker-compose.yml`、`docs/legacy/docker-compose.yml`、`README.Docker.md`、`docs/user-guide.md`、`scripts/update-config.sh`：将默认 Compose 配置移至明确的历史归档，保留原内容并标注不受支持；移除当前指南中的 Compose 启动推荐和自动更新入口，链接 `docs/release-installation.md`。不操作任何实际容器、镜像、卷或数据。
- [x] `scripts/release-runtime-acceptance.mjs`、`tests/release-runtime-acceptance.test.mjs`：以运行必需的环境白名单替代继承后删前缀，保留 PATH/必要平台与代理设置并重建隔离目录；用合成供应商、云、GitHub 凭据验证运行时环境无真实账户凭据。若代理配置包含认证，只保留下载进程需要的配置，不把认证传给验收运行时或终端。
- [x] `backend/src/services/skillService.ts`、`backend/src/services/skillSourceRegistry.test.ts`：项目主/旧来源的目录与读取文件均限制于 canonical 项目根，外部及悬空链接失败关闭并产生诊断；测试来源根、技能目录、SKILL.md 链接及内部有效链接。保留显式全局来源及 cwd 兼容，不将全局技能错误归入项目边界。
- [x] `scripts/release-runtime-acceptance.mjs`、`tests/release-runtime-acceptance.test.mjs`：远程会话除握手外实际发送文件订阅和受限 Git/终端消息，分别验证允许及拒绝响应；若暴露既有后端权限缺陷，明确失败并报告，不能改断言、跳过或未经批准修改生产授权。
- [x] `scripts/smoke-release-cli.mjs`、`scripts/release-runtime-acceptance.mjs`、`tests/release-runtime-acceptance.test.mjs`：每个实例独立清理，全部尝试后汇总错误，覆盖第一个清理失败仍停止其余实例的回归；失败不得返回成功。
- [x] `tests/release-listener.test.mjs`：在真实 TLS 和 TLS 回退场景补充显式回环地址覆盖，与 HTTP 一样核对监听及健康请求；不扩大监听或生产 TLS 权限。
- [x] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md`、`docs/release-installation.md`：重建独立归档并记录资产身份、新增检查结果与剩余安全缺口；旧失败证据及既有竞态、macOS、公开 URL、真实 LSP 未验证状态不得删除。

本轮已批准的授权修复：

- [x] `backend/src/websocket/fileWatcher.ts`、`backend/src/security/capability.ts`（仅必要复用）：在每条能力消息进入分发或执行副作用前复用既有授权与审计；映射 files 的 subscribe/unsubscribe、git 的 subscribeToGit/unsubscribeFromGit、terminal 的 terminalRegister/terminalInput/terminalUnregister。未授权回应 error/CAPABILITY_DENIED，匿名远程失败关闭；保持当前会话有效性、终端会话绑定和心跳/未知消息语义，避免既有输入/注销分支绕过绑定。必要时重新读取当前服务端策略，不信任客户端给定能力。
- [x] `backend/src/websocket/fileWatcher.test.ts`：通过真实分发入口覆盖所有能力消息 files-only 拒绝 Git/终端、无副作用、合法 Git/终端授权、文件订阅、local-trusted 兼容、跨会话终端操作、缺失/撤销/过期远程会话；测试后清理心跳和连接，不用源代码正则冒充运行验证。
- [x] `scripts/release-runtime-acceptance.mjs`、`tests/release-runtime-acceptance.test.mjs`：保留当前 22 项及严格消息拒绝断言，按需要补充消息级用例，不以 SESSION_MISMATCH 或超时代替能力拒绝。独立目录重建 Linux 运行时并执行真实包复验，全部原有矩阵行必须通过。
- [x] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md`：追加修复、版本/哈希、主验证和真实包结果，保留 20/22 失败及所有其他历史证据；未完成主会话评审前规格不得标 done。

验收标准：

- Given 隔离工作区和真实 Linux 发布包，when 执行安装验收，then 每项核心能力有明确成功或带证据的失败结果，而非只报告健康接口成功。
- Given 越界路径或无会话远程请求，when 访问能力接口，then 请求被拒绝且工作区外数据不变。
- Given 任一断言失败或超时，when 验收结束，then 非零退出且测试进程和临时资源被清理。
- Given 两平台发布流程，when 构建或公开 URL 验证运行，then 调用同一验收入口；本机不伪称完成 macOS 实测。
- Given 当前安装指南和仓库默认配置，when 用户选择安装，then 指向 Release CLI/运行时而不是受支持的 Compose；历史 Compose 仅可显式访问归档。
- Given 合成账户凭据及项目外技能链接，when 准备验收环境或加载项目技能，then 凭据不进入服务/终端、项目外内容不出现在 load/list/match 中。
- Given 远程 files-only 会话或多个待清理实例，when 发送受限消息或遇到一次清理异常，then 未授权成功被明确报错、所有实例仍被尝试停止，测试保持非零失败信号。

## Implementation Notes

- 2026-09-30 主会话独立复验：后端 49 项（39 steps）、Node 32 项、权限门禁 4 项均通过；首轮与最终 ws-auth 独立归档均重新执行全部 22 项实包检查，退出码 0。已核对基线差异和全部任务；八行矩阵均由实际通过的实包检查覆盖，七类消息的拒绝、副作用、合法授权、会话生命周期与绑定由实际分发回归覆盖。转 in-review，等待本轮三路正式评审，不提交或发布。

- 2026-09-30：完整读取规格（context 为空），完成已批准的消息级授权修复；七类能力消息在副作用前复用当前服务端策略、授权和审计，终端输入及注销补齐会话绑定。真实分发回归验证拒绝无注册/订阅/输入转发副作用、允许授权、动态策略及缺失/撤销/过期会话；后端 49 项（39 steps）、Node 32 项、权限门禁 4 项通过。最终独立 Linux 归档真实包 22/22 通过，退出码 0，版本和哈希见阶段报告。保留全部历史失败证据和既有暂存状态；未进行主会话独立评审，status 保持 in-progress，不标 done，不提交、推送或发布。

- 2026-09-30 实现交接：主会话依据规格要求实现代理停止在生产授权边界，此要求不是用户的新授权指令。后端授权未修复；status 保持 in-progress，交回主会话独立复验并请求下一步批准。最后完整后端 48 项（39 steps）、Node 32 项及权限门禁 4 项通过，真实包退出码 1；实现代理报告无验收进程或 smoke/listener 临时目录残留。

- 2026-09-30 主会话独立核验：重新运行后端 48 项（39 steps）、Node 四文件 32 项、权限门禁 4 项，全部通过；新归档真实包验收再次为 20/22、退出码 1，明确收到未授权 gitSubscribed 与 terminalRegistered。冻结矩阵的远程有效会话仅允许配置能力一行未满足，因此停留 step-03，不进入新一轮正式评审或 done。其余修订任务完成不消除该失败；生产消息授权修复须用户另行批准。不提交、推送或发布。

- 2026-09-30：按用户本轮明确实现指令完成七项评审修订；context 列表为空，完整规格已读取。保留冻结意图、跨轮暂存改动、旧失败证据和原归档。后端 48 项（39 steps）、Node 32 项及权限门禁 4 项通过；新独立 Linux 归档真实复验为 20/22 通过、退出码 1。files-only WebSocket 实际收到未授权 gitSubscribed 与匹配会话的 terminalRegistered，按规格报告而不修改生产授权。任务完成不代表安全验收通过，状态保留 in-progress；详细资产哈希、命令、证据和覆盖缺口见 [阶段报告](release-runtime-core-acceptance.md)。

- 2026-09-30：用户批准保留完整规格并继续（已告知约 7 千 tokens 的估算及上下文风险）；重读磁盘规格无外部变更，恢复评审修订实现。基线保持原完整提交，跨轮既有改动和历史归档不整体回退。

- 2026-09-30：实现代理报告新归档 18/18 通过；主会话将状态保留为 in-progress，等待独立复验和正式差异评审后再决定完成状态。

- 2026-09-30：完成追加批准的两项修复；后端 47 项测试（39 子步骤）与 Node 27 项回归全部通过。新归档保存在独立 `core-acceptance-fixed/` 目录，真实 Linux 安装验收 18/18 通过、退出码 0。保留之前失败证据；macOS、公开 URL 和真实 LSP 功能仍未实测，按规格记录为覆盖缺口，不宣称验证完成。
- 2026-09-30：用户确认继续，记录完整基线提交并进入实现。前置检查发现后端所有 `Deno.serve` 分支均未传入 `hostname`；本机 Deno 2.8.2 的 `deno types` 明确其默认值为 `0.0.0.0`。CLI 的回环 URL 仅是输出文字，不影响监听。为遵守已批准的回环监听约束，未启动真实包或远程测试实例。需要用户批准单独修复监听行为，或提供可用的网络隔离运行方式后继续；不修改冻结规格和生产权限。
- 2026-09-30：主会话再次复核 Node 27 项回归通过，真实 Linux 包仍 12/18 通过；技能与符号链接边界矩阵行失败，因此暂停于实现验收，不标记完成。既有镜像 CI 健康检查增加显式容器监听地址，仅保持入口兼容，不改变既有端口映射，不重启镜像发布。

## Spec Change Log

- 2026-09-30：用户明确批准 WebSocket 消息级能力授权修复；仅追加该授权决策和对应实现/运行回归任务。已证实 files-only 下 Git/终端成功响应为本轮目标，不扩大监听、策略授权或会话部署范围；保留全部既有验收、隔离、历史证据及不发布约束。其他既有缺口仍单独记录，不擅自修复。

- 2026-09-30：发现未指定监听地址默认暴露全部接口，用户明确批准最小监听修复后继续验收。保留原核心能力、安全断言及不发布约束；技能目录与终端平台风险仍仅验收记录，不扩大修复范围。
- 2026-09-30：用户批准继续修复符号链接工作区边界与项目技能发现两项缺陷；增加对应任务和回归边界，保留其他既有约束、基线及失败断言。
- 2026-09-30：用户解决 B1 intent_gap，选择停止旧 Compose 支持；冻结区只追加该明确决策。非冻结区新增归档及指南任务，不通过补设 0.0.0.0 继续维护旧 Compose。B3/E3、B5/E1、B7 触发规格修订，补齐必要环境白名单、项目技能 canonical 边界、WebSocket 消息级真实失败验证，并纳入 B9/E5、V1 的清理/监听测试补丁。KEEP：全部现有真实包断言、静态工作区边界修复、主/旧/全局来源优先级、默认回环与显式配置、隔离夹具、历史证据、不发布约束。已暂存改动跨轮保存，不整体回退用户工作；批准后只按上述任务重做有问题的实现。

## Review Triage Log

- 2026-09-30：真实新源码 Linux 包验收发现工作区技能 load/list/match 失败，符号链接越界读写返回 200 且临时哨兵被改写。保留失败断言及非零退出；未扩大技能或边界修复范围。实现任务完成，但安全验收标准未满足，保持 in-progress。macOS 与新公开 URL 安装尚未实测。详见 [阶段报告](release-runtime-core-acceptance.md)。

## Verification

- `node --test tests/release-runtime-acceptance.test.mjs tests/release-packaging.test.mjs tests/cli-download.test.mjs`：新增与既有发布测试通过。
- `node scripts/smoke-release-cli.mjs <CLI_TGZ_OR_PUBLIC_URL> [RUNTIME_ARCHIVE]`：真实打包服务验收；如发现缺陷保留失败证据，不发布。
- `git diff --check`：无空白错误。
- `npm run test:backend`：技能来源及工作区安全回归通过。
- `node --test tests/release-runtime-acceptance.test.mjs tests/release-listener.test.mjs tests/release-packaging.test.mjs tests/cli-download.test.mjs`：环境、清理、消息验证及真实监听回归通过。
- `./scripts/release-permission-gate.sh` 与修改脚本的 `bash -n`：权限门禁及语法通过；若 Compose 文档变更影响运行时契约，纠正与当前 Release 路径不符的检查，不删除仍有效的安全要求。

## Review Triage Log

2026-09-30：三路独立评审全部返回后逐项核实；尚未合并结论或执行修复。以下 B 为盲审、E 为边界审、V 为验证审。`reject` 表示驳回，不进入修复路由。

| ID | 问题 | verdict | 路由 | 核实证据及用户影响 |
|---|---|---|---|---|
| B1 | Compose 未配置监听地址 | medium | intent_gap | `docker-compose.yml` 仅映射端口，不传 `LAPDEV_HOST`；新默认回环会阻断容器网卡访问。尚未决定保留容器部署还是退出旧部署路径；不能擅自恢复外部监听。 |
| B2 | macOS 终端参数 | medium | defer | 终端固定 Linux `script -qc` 是基线既有实现；新门禁会暴露平台失败。批准的意图要求记录 macOS 缺口，不扩大平台修复，不能宣称跨平台发布就绪。 |
| B3 | 验收环境继承供应商密钥 | high | bad_spec | 使用合成值复现 `isolatedEnvironment` 保留 `OPENAI_API_KEY`；新验收启动的运行时及终端会继承，违背凭据隔离承诺。未读取或输出真实密钥。 |
| B4 | 路径校验与 I/O 竞态 | high | defer | resolver 仍返回词法路径，后续 I/O 重新打开；基线已经如此。本次只修复静态链接失败开放，不能证明抵御并发链接替换。 |
| B5 | 工作区技能跟随外部链接 | high | bad_spec | 独立临时夹具将项目 `SKILL.md` 链接至工作区外文件，实际 `loadSkills()` 返回其内容。加载器行为虽已存在，但本次切换用户工作区暴露了新的项目来源；需要项目来源 canonical 边界，不能把正常加载测试当隔离证明。 |
| B6 | 未配置工作区时来源不一致 | medium | defer | 技能 cwd 与文件 cwd/workspace 的差异在基线已存在；此次按批准意图保留无配置 cwd 兼容，CLI 验收明确传工作区，未新增默认差异。 |
| B7 | 远程 WebSocket 仅检查升级 | medium | bad_spec | 当前检查只证明 401/101；`fileWatcher.ts` 的消息分发另处理 Git 订阅和终端注册，未证明 files-only 会话在消息层无法使用其他能力。既有权限实现不在此项下擅改，但验收与报告需准确揭示缺口。 |
| B8 | 无 runAcceptance 模拟回归 | low | reject | 真实新归档已独立执行全部 18 项，能发现错误接口和响应；模拟覆盖缺少删除检查的防回归能力，但目前没有确认错误断言。大量模拟分支的收益不足以在此轮扩大代码。 |
| B9 | 单个 close 失败阻断其余清理 | medium | patch | 新增多个实例后串行 close，`stopProcessGroup` 对非 ESRCH 错误抛出；首个异常会跳过后续实例而仍删除临时树。应独立尝试全部清理并汇总失败。 |
| E1 | 项目技能外部符号链接 | high | bad_spec | 与 B5 相同夹具复现；此条先独立判定，后按同一根因分组。 |
| E2 | 校验后替换路径 | high | defer | 与 B4 相同既有 check/use 竞态；静态 canonical 校验不能提供原子 I/O 保证。 |
| E3 | 验收继承云账户凭据 | high | bad_spec | 合成 `AWS_SECRET_ACCESS_KEY` 也被继承；仅删除 Lapdev/供应商前缀无法兑现完整凭据隔离，需要明确必要环境白名单。 |
| E4 | npm/CLI 版本与 tar 无超时 | medium | defer | 三个同步调用确实未设超时；在基线冒烟脚本中也未设超时，并非本次新增。需后续为安装前后所有外部命令设置期限。 |
| E5 | cleanup 抛错留下实例 | medium | patch | 与 B9 同根因：异常中断循环，finally 仍删除树；应确保每组都被尝试停止。 |
| V1 | 显式地址的 TLS/回退缺少运行验证 | medium | patch | 信任验证审证据：真实 TLS/回退只测试默认地址，显式地址仅测试 HTTP；两分支改成恒定回环仍可通过现有验证。补充既有运行测试矩阵即可。 |

分组：B3/E3 为环境隔离；B5/E1 为项目技能链接；B4/E2 为既有竞态；B9/E5 为清理。B1 的 intent_gap 优先于 bad_spec 与 patch，后者待部署选择明确后继续处理；本轮不将尚未处理的条目记作修复完成。

### 评审暂停与保存现场

待用户决定旧 Compose 路径：退出容器部署支持，还是保留并另行评审显式监听配置（不能静默恢复公网暴露）。后续还需补齐验收环境隔离、项目技能链接边界与消息层授权验证，再处理清理及 TLS 测试补丁。

遵循工作区保存规则，不对跨轮已暂存代码执行整体回退；当前尚未提交的改动及归档均保留，规格维持 in-review，不能标记完成。独立复跑后端 47 项（39 子步骤）、Node 27 项及权限门禁 4 项通过；Linux 新归档 18/18 通过仅证明现有检查，不消除上述评审风险。

2026-09-30 续记：用户已明确停止旧 Compose 支持，B1 的部署意图缺口解决，以上暂停原因保留为历史记录。规格现转 draft，修订任务尚待 checkpoint 批准；本轮仅更新计划，未修改运行代码、默认 Compose 文件或真实部署。保留完整规格及逐项评审记录，以免丢失跨轮约束。

### 授权修复后的正式评审（2026-09-30）

三路全部返回后逐项判定。本表先独立判定再按根因分组；RB 为盲审、RE 为边界审、RV 为验证审。

| ID | 问题 | verdict | 路由 | 证据 |
|---|---|---|---|---|
| RB1 | 认证 session 与终端进程 ID 不一致 | medium | defer | 注册绑定在基线已如此；输入/注销收紧不能据此放开跨会话操作。创建终端另生 UUID，远程 CommandPolicy 又拒绝 interactive，真实远程终端归属/可用性是既有问题，不把替身测试当完整远程终端功能。 |
| RB2 | 出站推送未重新授权 | high | defer | 基线 broadcastGitStatus/sendTerminalOutput 已只检查连接或映射，没有当前能力检查；本轮目标是入站消息，不证明订阅后的持续推送安全。 |
| RB3 | 静默客户端撤销/过期仍接收推送 | high | defer | 基线只在 onmessage 查有效会话，出站未查；新检查没有引入该状态，需要单独出站生命周期修复。 |
| RB4 | 文件广播不使用订阅状态 | high | defer | 基线所有 clients 接收事件，handleUnsubscribe 空实现；本轮新增入口拒绝不能解决既有广播分发。 |
| RB5 | 实包未测试远程合法终端全过程 | medium | defer | 当前实包 terminal 是 local-trusted，远程只测试 files 与严格拒绝；现有策略禁止远程 interactive，且基线认证/终端 ID 归属不同。合法分发用替身与实际本地终端覆盖，不宣称完整远程终端；需随 RB1 单独设计实包正向用例。 |
| RB6 | macOS script 参数 | medium | defer | carried：与 B2 同位置同问题，仍为基线 Linux 参数，批准意图只记录平台缺口，本机不宣称 macOS 通过。 |
| RB7 | 路径检查/I-O 竞态 | high | defer | carried：与 B4/E2 同问题；词法返回及随后重开路径未变化，已明确限制为静态链接修复。 |
| RB8 | 树递归跟随外部目录链接 | high | defer | fileService.readDirRecursive 子路径直接 Deno.stat/readDir，无 sanitizePath；基线相同，入口边界修复未造成子树跟随。不得将直接读写验收当递归边界证明。 |
| RB9 | 归档进入普通 Git 跟踪 | false | reject | git ls-files _agile-output/runtime-archives 输出为空；二进制未暂存或跟踪，统一差异按评审要求包含未跟踪文件摘要，不代表提交授权。 |
| RB10 | 报告开头 latest 仍为失败旧状态 | low | patch | 已读取报告：开头 20/22 与文末 22/22 冲突，直接改当前摘要并标历史即可，不删除旧失败证据。 |
| RE1 | 动态 import 等待期间权限/会话失效 | high | defer | 基线初始会话校验与 await import 之间已有相同窗口；增加入口能力校验不提供跨 await 原子保证。需在实际副作用前再次校验或统一执行边界，不能宣称本轮已消除竞态。 |
| RE2 | 新拒绝取消留下旧 Git 订阅 | high | patch | 与 RB2 原有出站缺少校验不同：基线 unsubscribeFromGit 可移除，新授权分支提前返回使已收紧权限的客户端取消失败后仍保留；现有实际分发测试可重现。最小修复是在 Git 拒绝时移除该连接的旧订阅及状态，拒绝仍可观察。 |
| RE3 | 原始探针不支持分片文本帧 | low | reject | 自有后端 ws.send 输出短 JSON，未发现实际分片发送路径；通用导出探针确实不支持 continuation，但本次不实现通用 WebSocket 客户端，少见情形需额外解析状态，不扩展。 |
| RE4 | 超长/不可序列化探针导致 callback 异常 | false | reject | 已追溯全部实包调用：固定短 type 与服务端 crypto.randomUUID 会话组成普通 JSON，序列化小于 126 字节，无调用接受用户探针对象。现有长度断言正确限制仅用于此夹具的 helper；未证明当前调用会触发所述输入。 |
| RE5 | 同步安装/版本/tar 无期限 | medium | defer | carried：与 E4 同位置同问题，仍是基线三个外部命令缺少 timeout。 |
| RE6 | contextless 匿名远程连接继续广播 | false | reject | main.ts /ws 升级先 resolve context/authorize files，未认证 401，不会调用 contextless handleWebSocket；直接内部测试构造并非生产可达连接。基线广播问题单独作为 RB4 记录。 |
| RV1 | profile 切换后旧远程连接缺少回归 | medium | patch | 信任验证审证据：当前测试切换后只创建新 local 连接，未保留有效 remote 连接并再次发送消息；删掉 origin profile 判断会漏测升级。补充既有分发测试即可。 |

分组：RB1/RB5 为既有远程终端归属与正向验证；RB2/RB3 为出站授权/生命周期；RB4 为文件订阅分发；RB8 为递归边界；RE1 为异步副作用窗口；RE2、RV1、RB10 分别作本轮最小补丁。没有新的 intent_gap 或 bad_spec；不扩大权限，不重置工作树，所有留存问题必须写入后续工作记录并在最终结论中说明。

### 正式评审收尾与独立复验（2026-09-30）

RE2、RV1、RB10 已由原实现代理以最小补丁完成，并经主会话检查：Git 拒绝清理旧订阅，保留有效远程连接跨 profile 切换仍拒绝 Git/终端，新本地连接继续可用；报告保留历史失败并优先展示当前结果。新增五组既有问题写入 `deferred-work.md`；carried 问题保留已有记录，不重复登记。

主会话独立复验：后端 49 项（39 子步骤）、Node 32 项、权限门禁 4 项通过，shell 语法及 git diff --check 通过。从补丁后源码重建 `core-acceptance-ws-review-patch-20260930` Linux 归档，归档验证及 CLI 安装、运行时启动、健康、首页通过，核心实包 22/22 通过，退出码 0。八行验收矩阵在其声明范围内通过；macOS、真实 LSP 功能和完整远程终端正向路径未验证。此 done 仅代表已批准范围完成，不表示远程部署全面安全或公开 Release 已更新。

遵循冻结的用户约束，本轮未提交、推送或发布；生成归档仍未跟踪，不将历史已暂存改动自动提交。
