---
title: '终端输入异步加载后重新校验授权'
type: 'bugfix'
created: '2026-09-30'
status: 'draft'
baseline_commit: '7943d45157101e9ede1de180a814a82f7765cfb3'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

terminalInput 在入口授权后等待加载终端处理器；等待期间发生撤销、过期、关闭或能力收紧，恢复后仍可能调用 forwardTerminalInput。紧邻该调用重新验证当前连接、会话、能力及既有会话绑定，阻断这段异步窗口中的未授权输入。

## Boundaries & Constraints

保留现有消息、初始授权和安全审计关联；有效输入仍恰好转发一次。关闭或已清理连接不调用处理器、不尝试回复；撤销/过期沿用会话清理与关闭；能力拒绝移除本连接终端映射，开放连接收到 CAPABILITY_DENIED；既有绑定规则拒绝时使用 SESSION_MISMATCH。复验至调用之间不引入新的 await。

不更改认证会话与真实终端进程归属，不新增“必须注册后才可输入”的产品规则，不放宽远程 interactive/命令权限，不改变出站/订阅或其他消息。终端处理器内 stdinWriter.write 的异步窗口不在本轮，不宣称原子取消已开始的写入。不改递归文件树、路径竞态、部署、公开响应或历史日志；不推送或发布。测试只用合成凭据和输入，拒绝审计不输出认证 ID、输入内容或异常正文。

## I/O & Edge-Case Matrix

| loader 等待期间状态 | 期望行为 | 副作用/错误 |
|---|---|---|
| 连接和会话有效，能力及绑定不变 | 继续现有输入 | 恰好调用一次，参数不变 |
| 会话撤销或过期 | 清理并关闭 | 调用次数为零，安全拒绝审计 |
| readyState 不开放或 onclose/onerror 清理 | 不转发、不回复 | 调用次数为零，幂等清理 |
| terminal 能力收紧 | 拒绝本次输入 | CAPABILITY_DENIED，其他连接不受影响 |
| 原属远程连接切换本地模式但无 terminal 授权 | 保留远程限制 | 不以模式切换放行 |
| 既有绑定规则不再成立 | 拒绝 | SESSION_MISMATCH，不影响他人映射 |
| loader 抛错或后续处理器抛错 | 维持异常清理/关闭 | 不泄漏异常或输入正文 |

</frozen-after-approval>

## Code Map

- `backend/src/websocket/fileWatcher.ts`：terminalInput 分支 await loadTerminalHandlers 后直接转发；复用 currentClientContext、validateClientSession、authorizeCapability、removeCapabilityMappings、isSessionBound 和安全审计上下文。canSendBusiness 已有开放状态/会话/能力重验，但它是出站函数，避免为入站引入误导语义或重复拒绝副作用。
- `backend/src/websocket/fileWatcher.test.ts`：handleWebSocket 的第四参数已有 loader 注入；socket、合成 AuthSessionStore、自定义 now、策略环境恢复及日志捕获均可复用，用可控 Promise 精确暂停而非 sleep。
- `backend/src/security/capability.ts`：当前动态能力、会话有效性及安全 request/session 关联；保持生产规则。
- `backend/src/handlers/terminalHandler.ts`：forwardTerminalInput 查进程后写 stdin；本轮不修改其接口或进程归属。

## Tasks & Acceptance

- [ ] `backend/src/websocket/fileWatcher.ts`——在 terminalInput loader 恢复后重验，拒绝零转发且保留既有清理/错误行为。
- [ ] `backend/src/websocket/fileWatcher.test.ts`——确定性暂停/恢复 loader，实际执行矩阵，断言调用次数、映射、关闭/错误、跨连接隔离与日志无敏感值，保留原断言。
- [ ] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md`、`_agile-output/implementation-artifacts/deferred-work.md`——追加验证与解决记录，不关闭终端归属或处理器内部异步风险。

Given 已通过入口授权的输入，when loader 等待中授权或连接失效，then 恢复后不会调用 forwardTerminalInput，且拒绝行为和审计符合矩阵。

Given 有效连接及现有发布基线，when 执行正常输入和完整回归，then 参数和一次转发保持、所有原安全断言通过；不以替身测试冒充真实远程终端正向验收。

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

- `npm run test:backend -- src/websocket/fileWatcher.test.ts`：新增可控异步窗口用例全部实际执行。
- `npm run test:backend`；四文件 Node 发布回归；`./scripts/release-permission-gate.sh`；`git diff --check`：全通过。
- 独立新目录构建/校验 Linux runtime、npm pack、smoke-release-cli：安装/健康/首页及原 22 项通过。新增窗口矩阵由分发测试证明，不宣称原实包具备该覆盖；保留历史资产并记录新源码和哈希。
