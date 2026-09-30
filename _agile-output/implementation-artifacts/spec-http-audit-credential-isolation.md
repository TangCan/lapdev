---
title: 'HTTP 审计凭据与关联标识分离'
type: 'bugfix'
created: '2026-09-30'
status: 'done'
baseline_commit: 'd1feb45e30b74d16dd4c556f82e132cd05397d4f'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

HTTP 能力审计和 WebSocket 握手把可复用认证 sessionId 写入日志。分离认证凭据与服务端审计关联标识，消除这条泄露路径，保留同一会话跨请求可追踪性。

## Boundaries & Constraints

Cookie/Bearer、认证、撤销、过期和能力策略不变。审计保留 version 1 及 correlation 字段结构，sessionId 字段只容纳非凭据 ID。同一有效认证会话的 HTTP 请求关联稳定，不同会话不同；关联 ID 不可认证，也不由请求头或 body 决定。既有 WebSocket 连接级安全关联不退化。匿名/本地/旧内部 context 缺少审计 ID 时不得退回原 sessionId。

本轮不推送或发布，不改终端归属、入站异步窗口、文件边界、部署、外部身份体系或历史日志文件。只用合成凭据测试；不读取或展示真实凭据。保持 HTTP 状态、响应和权限边界。高风险终端拒绝日志不得回显未经验证的 body.sessionId 或命令内容。

## I/O & Edge-Case Matrix

| 输入/状态 | 期望 | 错误处理 |
|---|---|---|
| 同一会话 Cookie/Bearer、多请求允许/拒绝 | 审计关联相同，身份/请求/revision 保留 | 不出现认证凭据 |
| 不同认证会话 | 不同审计 ID | 不串联身份 |
| 将审计 ID 作 Cookie/Bearer | 认证失败 | 401，能力不放行 |
| 匿名、撤销或过期请求 | 原有拒绝行为 | 不记录已失效凭据 |
| 本地或内部旧 context 无审计 ID | 安全 fallback 关联 | 不回退到原 sessionId |
| WebSocket 握手及后续推送 | 无凭据日志、原安全行为保持 | 原拒绝/关闭不变 |
| 高风险终端命令，body.sessionId 填入测试凭据 | 拒绝且日志不含该值或命令 | 原错误码保持 |

</frozen-after-approval>

## Code Map

- `backend/src/security/authSession.ts`：exchangeBootstrapToken 生成/存储会话；resolveRequest/resolveSession 返回复制。认证索引仍用原 sessionId；增独立审计 ID，不将其加入认证索引。
- `backend/src/security/capability.ts`：resolveCapabilityContext 传递服务端关联，auditCapabilityDecision 只发安全审计 ID；兼容旧 context 的 fallback。权限及 isCapabilityContextCurrent 仍使用真实凭据。
- `backend/src/security/audit.ts`：version 1 信封仅 details 脱敏；不改公共字段结构。
- `backend/src/main.ts`：handleRequest 在 HTTP gate 与 WS upgrade 调用通用审计；terminal command 路由需复用入口请求上下文。
- `backend/src/handlers/terminalHandler.ts`：handleTerminalCommand 的 high-risk 日志当前直接使用 body.sessionId；改用安全上下文关联，保留响应语义。
- `backend/src/websocket/fileWatcher.ts`：auditContext 已用连接级 UUID；适配新增内部关联字段，不再使用认证 sessionId 日志。

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/security/authSession.ts`、`backend/src/security/capability.ts` — 分离凭据/关联 ID，安全 fallback，不增公共认证渠道。
- [x] `backend/src/main.ts`、`backend/src/handlers/terminalHandler.ts`、`backend/src/websocket/fileWatcher.ts` — 入口到拒绝事件共享安全上下文，保持已有 WS 脱敏；不以 body 身份作审计真值。
- [x] `backend/src/security/authSession.test.ts`、`backend/src/security/capability.test.ts`、`backend/src/handlers/terminalPolicy.test.ts`、`backend/src/websocket/fileWatcher.test.ts` — 实际捕获日志验证矩阵；不得用手工 JSON 代替生产 emitter。
- [x] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md` — 追加新证据与范围，保留历史，归档使用新目录。

**Acceptance Criteria:**
- Given 合成认证会话，when 执行允许/拒绝的生产解析及审计函数，then 捕获日志无 bootstrap、Cookie/Bearer 凭据，仍保留 principal/workspace/request/revision；匿名及缺失审计字段也不泄露。
- Given 已有安全基线，when 回归及新 Linux 包验收，then 原断言全部通过，握手和终端拒绝仍生效；不宣称全应用任意业务日志已脱敏。

## Implementation Notes

服务端会话存储生成独立 auditSessionId，exchange 返回复制；HTTP context 传递该 ID，旧 context 用 WeakMap 稳定回退。main 将入口 context 传给终端拒绝处理，WebSocket 继续使用连接级 UUID。主会话读完整统一差异，逐项核对任务与七行矩阵；生产函数日志捕获和既有出站测试实际执行。独立复跑后端 53 项（69 子步骤）、Node 32 项、权限门禁 4 项及 Linux 新实包 22/22，通过且无跳过。归档 capability.ts 与源码 cmp 一致，资产哈希已核验；尚待正式评审。

## Spec Change Log

## Review Triage Log

2026-09-30：三路全部返回后逐项核验；边界审返回空列表。

| ID | verdict | 路由 | 证据 |
|---|---|---|---|
| B1 | high | defer | X-Request-Id 仍原样进入 correlation，客户可将任意凭据放入该标签；该行为在基线已有，本轮只分离认证 sessionId，不宣称任意客户端字段脱敏。需单独定义请求标签安全策略。 |
| B2 | medium | patch | HTTP/握手形状测试确实只调用生产函数，未进 handleRequest；补真实服务 HTTP/WS 升级回归，核对安全审计与状态。 |
| B3 | medium | patch | 终端新测试依赖环境且只传显式 context；补显式本地/已认证远程及省略 context 的安全 fallback，核对响应 ID、身份和拒绝，不改认证策略。 |
| B4 | low | patch | terminal_command_denied 改成 version 1 security_audit，事件监控契约确有迁移；全仓搜索没有消费旧类型的代码，需记录 type/reason/correlation 查询迁移。 |
| B5 | false | reject | 统一评审差异按流程包含未跟踪资产摘要；git ls-files runtime-archives 为空，未暂存包。报告已分别记录新目录、哈希及旧资产不含修改，没有把它们加入源码提交。 |
| B6 | medium | patch | manifest 仅含基线 commit，未提交源码状态不能单凭 commit 重建；补代码补丁摘要及归档携带源文件的复现说明，不覆盖旧包或冒充公开版本。 |
| V1 | medium | patch | 信任验证审证据：删掉 main 传入 requestContext 仍可通过直接处理器测试，真实无 X-Request-Id 的终端拒绝会失去入口关联；增加根脚本执行的 HTTP 路由回归。 |

分组：B2/V1 为实际入口验证缺口，其他分别处理。补丁只添加示范过状态的回归与直接说明，不新增公共接口；B1 为既有不同日志路径，留存不冒充已修复。无 intent_gap/bad_spec。

## Verification

评审补丁完成并由主会话独立复验：后端 **55 项（69 子步骤）**、Node **32 项**（0 skipped）、权限门禁 **4 项**全部通过；真实 HTTP/WS 握手和远程处理器回归包含在全量后端执行中。Linux 归档校验及安装/启动/健康/首页与核心 **22/22** 通过。五个生产文件逐个从归档提取与当前源码 cmp 一致，code-only diff SHA-256 与报告一致，无需为仅测试/文档补丁重建包。

B2/B3/B4/B6/V1 补丁已核验；B5 拒绝，B1 已写入延期账本。无规格回退、意图变更或额外生产策略修改。上述 Implementation Notes 的 53 项为评审前历史；本段为最终结果。

- `npm run test:backend` — 全部通过，日志防泄漏测试实际执行。
- `node --test tests/release-runtime-acceptance.test.mjs tests/release-listener.test.mjs tests/release-packaging.test.mjs tests/cli-download.test.mjs` — 全部通过。
- `./scripts/release-permission-gate.sh`、`git diff --check` — 通过。
- 新 Linux 独立目录构建/验证归档、npm pack、smoke-release-cli；安装、健康、首页及原 22 项通过。新关联矩阵由生产函数回归证明，不冒充完整网络/跨平台验收。
