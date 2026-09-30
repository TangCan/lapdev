---
title: 'WebSocket 出站授权与订阅隔离'
type: 'bugfix'
created: '2026-09-30'
status: 'done'
baseline_commit: 'aea6d4e0e9fe21e1ca79fc453e95cf926ab2766e'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

静默客户端在权限撤回或会话失效后仍可能收到事件。文件广播忽略订阅。统一文件、Git、终端业务推送的即时授权，确保数据不流向当前无权的连接。

## Boundaries & Constraints

保留现有未提交改动、协议消息和会话绑定；复用现有能力策略及审计，连接原属 remote-shared 时不得因模式切换升级。文件事件须显式订阅。取消订阅无确认消息的契约保持不变。仅在下一次业务推送检查失效并清理，不新增即时撤销通知机制。

不扩大权限，不提交、推送或发布；不改终端进程归属、远程 interactive 策略、文件树边界、LSP 或部署。并发终端入站异步窗口另案处理。不得打印业务载荷或凭据。拒绝输出不新增重放/持久化，维持现有缓冲消费规则。

## I/O & Edge-Case Matrix

| 状态/输入 | 期望 | 拒绝处理 |
|---|---|---|
| 有效会话、授权且已订阅文件/Git | 收到原格式事件 | 无 |
| 文件未订阅或已取消 | 不收到文件事件 | 无副作用 |
| 已注册且合法绑定的终端 | 收到输出 | 未跟踪连接拒绝发送 |
| 无入站消息时撤销或过期 | 下一次业务推送不发送 | 清理全部映射并关闭连接 |
| 能力收紧但会话有效 | 对应推送停止，其他授权能力可用 | 移除对应订阅/终端映射，审计拒绝 |
| 能力恢复 | 不自动恢复被清理订阅 | 须重新订阅/注册 |
| 旧远程连接切换本地模式 | 不获得本地信任 | 保持远程拒绝策略 |
| 关闭、异常发送、无连接状态 | 不发送或停止后续发送 | 清理，不影响其他客户端 |

</frozen-after-approval>

## Code Map

- `backend/src/websocket/fileWatcher.ts`：ClientState、三类出站函数、subscribe/unsubscribe、cleanupClient；入站已有动态策略解析，提取复用并保留每连接 sessionStore。消息格式及心跳不变。
- `backend/src/security/capability.ts`：复用 resolveCapabilityContext、isCapabilityContextCurrent、authorizeCapability、auditCapabilityDecision；不得以缓存 capabilities 替代当前配置。
- `backend/src/security/authSession.ts`：已有可注入时钟和 revoke，测试无需真实凭据或等待。
- `backend/src/websocket/fileWatcher.test.ts`：已有模拟 socket、真实 onmessage 分发和依赖注入；保留全部上轮断言。
- `backend/src/handlers/terminalHandler.ts`：输出经 sendTerminalOutput，保持调用接口及终端缓冲逻辑。
- `frontend/src/context/GitContext.tsx`、`frontend/src/stores/gitStore.ts`、`frontend/src/components/Terminal/Terminal.tsx`：重连会重新订阅 Git 或注册终端；现有前端没有文件事件消费者，不新增 UI。依赖隐式文件广播的外部客户端须改发 subscribe。

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/websocket/fileWatcher.ts` — 复用当前会话/能力检查，持有每连接 store，增加文件订阅状态；业务发送紧邻 send 校验，拒绝/异常清理幂等；避免读取载荷作为授权信息。
- [x] `backend/src/websocket/fileWatcher.test.ts` — 覆盖矩阵，多连接隔离；撤销/过期后不发送任何新入站消息再调用三类推送，测试能力收紧、恢复、模式切换和异常清理；每例释放连接与定时器。
- [x] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md` — 追加本轮证据及范围，不覆盖历史失败；如重建实包，使用新目录和哈希。

**Acceptance Criteria:**
- Given 两个独立连接且仅一个失效，when 广播，then 有效订阅者收到事件、失效者无业务载荷，拒绝审计关联其身份且不包含载荷。
- Given 上轮核心验收基线，when 后端回归及新 Linux 实包验收，then 原有断言保持通过，不宣称完整远程终端或 macOS 已验证。

## Implementation Notes

主会话逐项检查新代码及矩阵测试，独立复跑后端 50 项（62 子步骤）、Node 32 项、权限门禁 4 项及最终 Linux 包 22/22，全部通过。23 个出站子用例实际执行，无跳过；覆盖本规格八行矩阵。

每连接记录 sessionStore、文件订阅及 wasRemote；入站与出站复用当前策略解析。出站拒绝不发送额外协议消息；能力拒绝仅移除对应映射，失效会话关闭并清理所有映射，发送异常立即幂等清理。原属远程且无上下文的连接也不因模式切换获得本地信任。终端处理器及其缓冲消费逻辑保持原样。

## Spec Change Log

## Review Triage Log

2026-09-30 三路全部返回后逐项核验：

| ID | verdict | 路由 | 证据 |
|---|---|---|---|
| B1 | high | patch | 新出站审计把认证 sessionId 原样放入 correlation，authSession 接受其作为 bearer；需独立非凭据关联 ID，并移除 WebSocket 其他原始会话日志。其他服务既有审计风险另案。 |
| B2 | high | defer | 终端输入 await loader 后不重验是基线已有窗口，冻结意图明确另案，本轮不改变入站执行边界。 |
| B3 | medium | patch | 新异常处理删除状态和心跳但不关闭 socket，后续入站因无状态静默返回；应关闭失败连接。 |
| B4 | medium | defer | macOS script -qc 参数及其必需验收门禁来自此前工作，本轮没有改变终端或平台实现，仍未验证。 |
| B5 | medium | defer | 终端进程 UUID 与认证 UUID 不同是既有归属问题，remote interactive 禁止也未改变。 |
| B6 | medium | defer | 实包仅确认订阅，终端通过 HTTP 验证；实际 WS 事件输送集成证据仍不足，本轮明确以真实分发单测证明新矩阵，不冒充实包覆盖。 |
| B7 | high | defer | fileService 递归子路径不重新验证边界，既有漏洞未因本轮改变；冻结意图排除树修复。 |
| B8 | high | defer | 路径检查与后续 I/O 分离，既有替换竞态未改变；本轮不修改文件/技能路径操作。 |
| B9 | medium | defer | 先前 skillService.projectPath 对普通缺失源也记录 error，普通工作区可触发；本轮没有修改技能发现。 |
| B10 | low | patch | 报告此前“当前最终”及后续工作条目仍像未解决；标明历史并追加本轮解决证据，保留原记录。 |
| E1 | medium | patch | 新 sendTerminalOutput 可在 flush 中移除注册，后续 terminalRegistered 无映射仍发送；确认前检查现存映射和当前能力。 |
| E2 | high | defer | 同 B2，既有输入异步窗口，不因新的出站检查而宣称消除。 |
| E3 | medium | patch | 同 B3，JSON 异常可达，无状态开放 socket 无心跳。 |
| E4 | medium | defer | projectPath 后 stat 位于外层 try，一目录消失会中止后续发现，既有加载路径，本轮未动技能代码。 |
| E5 | medium | patch | 新终端出站绑定拒绝仅删除映射，但此前已发 allowed 能力审计；须补绑定拒绝审计，不记录载荷。 |
| V1 | medium | patch | 信任验证审证据：动态收紧矩阵全是 remote，新 local 连接仅在无 allowlist 下测试，缺 local 收紧/恢复出站回归。 |

分组：B3/E3 同异常连接根因，B2/E2 同入站异步窗口，其余分别处理。补丁不新增公共接口，不修改冻结意图；先前其它问题在本轮仍属既有风险。无 intent_gap/bad_spec。

评审收尾：原实现代理完成 B1、B3/E3、B10、E1、E5、V1 最小补丁。主会话检查代码及新增断言；WebSocket 审计仅用独立稳定关联 UUID，原凭据不出现在捕获日志中；异常关闭与终端确认前复验覆盖实测状态。八组既有问题及 HTTP 审计凭据风险追加至 deferred-work.md，未扩大本轮修复。

最终独立复验：后端 50 项（69 子步骤，包括 30 个出站子用例）、Node 32 项、权限门禁 4 项、git diff --check 全部通过。从评审补丁后源码重建 ws-outbound-review-final-20260930，归档源码 cmp 一致，Linux 安装/健康/首页及原 22/22 实包验收通过，退出码 0；本规格矩阵每行由实际执行的出站分发测试覆盖。已批准范围完成，仍不代表整个应用日志、文件树或远程终端全面安全。遵循冻结意图，未提交、推送或发布。

## Verification

2026-09-30 实施验证：后端 50 passed（62 steps），其中新增出站矩阵 23 子用例；Node 四文件 32 passed；权限门禁 4 passed；git diff --check 通过。最终独立 Linux 包结构及源码一致性校验通过，安装/健康/首页及原 22 项实包验收通过，退出码 0。资产哈希、复现命令、首轮审计断言修正和覆盖边界见 [本轮验收记录](release-runtime-core-acceptance.md)。没有完整远程终端或 macOS 验证，没有提交、推送或发布；保持 in-progress 交主会话评审。

- `npm run test:backend` — 全部通过。
- `node --test tests/release-runtime-acceptance.test.mjs tests/release-listener.test.mjs tests/release-packaging.test.mjs tests/cli-download.test.mjs` — 全部通过。
- `./scripts/release-permission-gate.sh`、`git diff --check` — 通过。
- 从本轮源码在独立目录 build-runtime-archive、verify-runtime-archive、npm pack 后运行 smoke-release-cli；安装、健康、首页及原 22 项通过，新出站行为由分发测试证明。
