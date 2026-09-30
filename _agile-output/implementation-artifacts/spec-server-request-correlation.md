---
title: '请求关联标识不再接收原始客户端标签'
type: 'bugfix'
created: '2026-09-30'
status: 'done'
baseline_commit: 'ceb0e434a8bd3a4527b5dbbc77bda2a8185adb10'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

客户端可将认证凭据写入 X-Request-Id，当前解析器直接将其放入不脱敏的审计 correlation.requestId。阻断此输入到日志的路径，并保持入口、终端拒绝、握手及后续连接事件可关联。

## Boundaries & Constraints

保留 version 1 审计结构、安全 session 关联、身份、revision、HTTP 状态和认证/能力策略。已有拒绝响应的 header/body 与审计 requestId 必须一致；同一请求内上下文复用，不因处理层不同重新生成。只使用合成敏感值，不读取真实凭据或历史日志。

不扩大到任意客户端字段脱敏，不改变终端归属、异步授权、文件边界、部署或公开认证响应。不新增可回显原始标签的日志字段或持久映射；不修改历史包，不推送或发布，不扩展 CORS。

已确认决策 A：忽略入站 X-Request-Id，每次请求解析生成新的随机 UUID；同一请求上下文及 WebSocket 连接后续事件复用该 ID。仅保留现有拒绝响应中的 ID 出口，不增加成功 HTTP 或 WS 101 响应字段。客户端不能再预先指定日志 ID，可通过现有错误响应定位；不保存或回显原始标签。

## I/O & Edge-Case Matrix

| 输入/状态 | 期望行为 | 错误处理 |
|---|---|---|
| 无请求标签 | 非空服务端关联 ID | 原状态保持 |
| 标签为合成 bootstrap、Cookie/Bearer 凭据或普通 UUID | 无原值日志或响应回显 | 不以格式白名单放行 |
| 同会话连续请求、重复标签 | 同请求关联稳定，跨请求生成不同 ID | 不影响会话关联 |
| 匿名、撤销、过期、能力拒绝 | 安全请求关联和原拒绝码 | 不回显失效凭据 |
| 高风险终端请求 | 入口/拒绝审计及响应关联一致 | HIGH_RISK_COMMAND 不变 |
| 实际 WS 101/401、后续连接事件 | 安全握手关联在连接内延续 | 原认证/关闭行为保持 |

</frozen-after-approval>

## Code Map

- `backend/src/security/capability.ts`：resolveCapabilityContext 当前直接读取标签；capabilityError 和 auditCapabilityDecision 共用 context.requestId。只替换不可信 ID 来源，保持身份/权限函数。
- `backend/src/main.ts`：HTTP gate 已保存 requestContext 并传终端；WS 握手另行解析。保持路由拒绝和认证交换，不导出生产处理器供测试。
- `backend/src/handlers/terminalHandler.ts`：高风险拒绝复用 context，省略参数时调用解析器；不要重复生成 ID。
- `backend/src/websocket/fileWatcher.ts`：currentClientContext 保留连接原 requestId；保持安全会话关联及订阅隔离。
- `backend/src/security/capability.test.ts`、`backend/src/security/httpAudit.test.ts`：旧测试依赖入站标签查找事件，改为安全上下文/响应或独立请求边界定位，不降低 101/401/403 断言。

## Tasks & Acceptance

- [x] `backend/src/security/capability.ts`（必要时 `backend/src/main.ts`）——按兼容性决策生成并传递服务端 ID，不改变授权。
- [x] `backend/src/security/capability.test.ts`、`backend/src/security/httpAudit.test.ts`、`backend/src/handlers/terminalPolicy.test.ts`、`backend/src/websocket/fileWatcher.test.ts`——生产 emitter 和真实路由捕获日志，覆盖矩阵及连接内关联。
- [x] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md`、`_agile-output/implementation-artifacts/deferred-work.md`——记录行为迁移及验证，追加解决记录，保留其他风险。

Given 合成凭据在认证字段及请求标签，when 真实 HTTP/WS 允许或拒绝，then 所有捕获审计无标签原值、状态不变且请求关联符合决策。

Given 已有发布基线，when 完整回归及独立目录 Linux 实包验收，then 原安全断言全部通过，不宣称跨平台或全应用日志已脱敏。

## Implementation Notes

用户已批准额外加固 `tests/release-listener.test.mjs` 的依赖缓存，然后继续完整验证并提交。只改变测试准备：隔离环境中预热一次临时 Deno 缓存，六种监听模式共享该缓存并用 cached-only 启动；预热失败显式失败，保留全部监听、健康与 TLS 回退断言，不扩大生产策略。

context: []，已全文读取。生产改动仅替换 resolver 的 ID 来源；main/terminal/fileWatcher 既有传递保持原样。握手与后续事件共享 requestId，保留既有各自安全 session 关联。客户端标签不保存、不回显、不增加映射。仅使用合成凭据。

## Spec Change Log

## Review Triage Log

缓存加固追加检查：独立代理读取新增测试准备流程及环境/进程清理实现，返回无发现；主会话核对缓存为临时独立目录、预热与启动依赖图相同、cached-only、失败不跳过，六种地址/协议/健康/TLS 回退断言保留。原请求关联评审补丁全部完成，B6 供应链复现单独延期。

2026-09-30：首次启动部分成功后线程上限失败；清理旧代理并补齐，收齐两个盲审、两个边界审及验证审（无缺口）后逐项核验。

| ID | verdict | route | 核验 |
|---|---|---|---|
| B1 | medium | patch | 重复标签循环确实在本地模式及过期后运行；移至有效远程会话并显式验证认证。 |
| B2 | medium | patch | 新网络矩阵缺少原 Bearer 200/101 及 Cookie 403；恢复两种认证传输全部正反向路径。 |
| B3 | medium | patch | WS reader 无 Content-Length 时视为空，正文断言可跳过；对拒绝要求明确完整 framing 和非空 JSON。 |
| B4 | medium | patch | 后续事件集合大小 1 可仅含一个拒绝，不能证明多次稳定；生成两次实际拒绝并断言关联。 |
| B5 | false | reject | git ls-files runtime-archives 为空；差异含本地未跟踪资产摘要，不会纳入源码提交，报告已标明新旧目录。 |
| B6 | medium | defer | 完整依赖/工具链构建输入与 bit-for-bit 复现缺口在基线发布脚本已有；本轮提供基线、唯一生产差异摘要和包内源码，不宣称完整可重复构建。 |
| E1 | medium | patch | chunked/缺少 length 可未捕获拒绝正文；与 B3 共因，至少要求本服务拒绝的明确 Content-Length 并完整读取。 |
| E2 | medium | patch | if(body) 允许空正文通过，与 B3 共因，强制正文及错误码/ID。 |
| E3 | medium | patch | 实际 Bearer 成功路径覆盖被删除，与 B2 共因。 |
| R1 | medium | patch | 第二盲审同样核实远程重复标签循环只在本地执行，与 B1 共因。 |
| R2 | medium | patch | 第二盲审核实 Bearer 200/101 缺失，与 B2 共因。 |
| R3 | medium | patch | 第二盲审核实缺失/分块正文可漏断言，与 B3 共因。 |
| R4 | medium | patch | HTTP 401 未检查 UNAUTHENTICATED reason/错误码及响应泄漏，补直接断言。 |
| R5 | false | reject | 同 B5，归档未跟踪且不暂存，不存在将数百 MB 加入 Git 历史的行为。 |
| R6 | low | patch | 文档仅有差异 hash，但唯一改动源码在包内；补从基线及包内文件重建差异的命令，明确不承诺二进制逐字重建。 |
| E4 | medium | patch | 第二边界审发现空拒绝正文可通过，与 B3 共因。 |

按共因分组后补测试及直接证据说明；无需新增生产接口或改动冻结决策。B6 为既有不同发布供应链目标，单独延期。

## Verification

最终收尾（2026-09-30）：用户批准缓存加固后，主会话独立复跑后端 **55 passed（69 steps）**、四文件 Node 发布回归 **33 passed（0 failed/0 skipped）**、权限门禁 **4 passed** 及 git diff --check，全部通过。新增缓存准备失败/超时/启动失败与隔离测试实际执行；真实 HTTP/HTTPS/回退及显式地址六种监听模式通过。Linux 归档再次校验、安装/启动/健康/首页与核心 **22/22** 通过，包内 capability.ts 与源码一致；缓存改动仅属测试，不覆盖或重建包。下列 31/32 为此前冷下载失败历史，已解决，不是当前状态。没有推送或发布。

主会话评审补丁后复验：后端 55 项（69 子步骤）、权限门禁 4 项及 Linux 实包原 22/22 通过；包内生产 capability.ts 与当前源码一致。补丁逐项核验通过，B6 完整供应链复现单独延期。

最终 Node 四文件复跑为 31 passed / 1 failed，0 skipped：tests/release-listener.test.mjs 的真实监听启动等待在临时空 Deno 缓存下载依赖时超时（20 秒）。原环境重跑及移除代理后重跑均失败；无代理时 HTTP 模式已成功，随后 HTTPS 模式仍在下载未启动。不是本轮请求标签断言失败，但不将其算作通过。评审前曾 32/32 通过，不能代替补丁后最终结果。规格保持 in-review，尚未创建本轮提交；需要用户确认是否单独加固监听测试依赖缓存后继续收尾。

2026-09-30 实测：后端 55 passed（69 steps）、Node 四文件 32 passed（0 skipped）、权限门禁 4 passed、git diff --check 通过。新独立 Linux 包构建/校验/npm pack 和安装、健康、首页、核心 22/22 通过。资产、SHA-256 与源码快照见 release-runtime-core-acceptance.md 最新章节。新增握手捕获使旧测试将两种安全 session 关联误计为一种，已分别验证握手关联与后续稳定关联并全量复跑通过；生产 session 行为未修改。

- `npm run test:backend`；四文件 Node 发布回归；`./scripts/release-permission-gate.sh`；`git diff --check`：全部通过。
- 新独立目录构建/校验 runtime、npm pack、smoke-release-cli：安装、健康、首页及核心 22 项通过；记录哈希和源码快照，不覆盖旧资产。
