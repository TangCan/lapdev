# 后续工作记录

- source_spec: `spec-release-runtime-core-acceptance.md`
  summary: 明确远程认证会话与终端进程的归属模型，并补齐真实远程终端正向验收。
  evidence: RB1/RB5，medium；现有终端创建生成独立 UUID，而注册绑定认证 session，远程策略禁止 interactive；本次替身分发测试与本地实包终端不能证明远程终端全过程。
- source_spec: `spec-release-runtime-core-acceptance.md`
  summary: 在 Git/终端出站推送前重新检查当前能力与会话有效性，处理静默客户端撤销和过期。
  evidence: RB2/RB3，high；broadcastGitStatus/sendTerminalOutput 的既有实现没有出站授权，onmessage 检查不能覆盖无入站消息的连接。本轮 Git 拒绝清理仅覆盖收到拒绝消息的连接。
- source_spec: `spec-release-runtime-core-acceptance.md`
  summary: 实现文件事件订阅状态及出站授权，不向全部连接无差别广播。
  evidence: RB4，high；既有文件广播遍历 clients，handleUnsubscribe 空实现；握手和入站 files 授权不等同于持续事件分发授权。
- source_spec: `spec-release-runtime-core-acceptance.md`
  summary: 在文件树递归遍历中验证每个子路径的工作区边界。
  evidence: RB8，high；fileService.readDirRecursive 子路径直接 stat/readDir，可跟随外部目录链接；本轮直接路径静态边界修复未覆盖递归树。
- source_spec: `spec-release-runtime-core-acceptance.md`
  summary: 在终端异步加载后、实际副作用执行前再次校验权限和会话。
  evidence: RE1，high；既有 await import 窗口允许初始校验后撤销或权限变化，本轮入口授权不是跨 await 原子执行保证。

## 后续解决记录（2026-09-30，保留以上原始条目）

- source_spec: `spec-websocket-outbound-authorization.md`
  resolves: 上述“在 Git/终端出站推送前重新检查当前能力与会话有效性，处理静默客户端撤销和过期”目标。
  status: implemented，待主会话独立验证和评审。
  evidence: Git/终端每次业务发送前重新验证当前策略和会话；静默撤销/过期清理全部映射并关闭，能力拒绝仅清理对应映射；回归覆盖多连接隔离。本轮评审修订增加非凭据审计关联、异常关闭、终端注册确认前复验及绑定拒绝审计。原条目仅为历史发现，不再作为尚未实施的出站目标；终端归属及 terminalInput 异步窗口仍单独待办。
- source_spec: `spec-websocket-outbound-authorization.md`
  resolves: 上述“实现文件事件订阅状态及出站授权，不向全部连接无差别广播”目标。
  status: implemented，待主会话独立验证和评审。
  evidence: 文件推送仅发给显式订阅且当前获授权的连接；取消订阅无确认，收紧后的订阅不会因能力恢复而自动恢复。对应分发测试覆盖；原条目保留历史证据，不再作为尚未实施的订阅目标。

## 出站授权评审留存（2026-09-30）

- source_spec: `spec-websocket-outbound-authorization.md`
  summary: 在终端入站异步加载后重验会话、能力和连接状态。
  evidence: B2/E2，high；terminalInput 授权后 await loader，期间撤销或关闭仍可能执行 forwardTerminalInput，既有窗口，本轮冻结意图明确另案。
- source_spec: `spec-websocket-outbound-authorization.md`
  summary: 验证并修复 macOS 终端执行参数与发布门禁兼容。
  evidence: B4，medium；现有 script -qc 是 Linux 参数，但 darwin 发布矩阵也要求终端验收，本机仅验证 Linux，不能宣称 macOS 通过。
- source_spec: `spec-websocket-outbound-authorization.md`
  summary: 明确远程认证会话与实际终端进程的归属并补正向验证。
  evidence: B5，medium；既有进程 UUID 与认证 UUID 不同，绑定比较不能实现真实远程终端；interactive 策略仍拒绝，未放宽。
- source_spec: `spec-websocket-outbound-authorization.md`
  summary: 为打包运行时增加实际 WebSocket 事件交付和取消订阅的集成验收。
  evidence: B6，medium；实包检查确认订阅，终端输出经 HTTP 轮询；本轮真实分发单测不是已打包服务的完整事件交付证明。
- source_spec: `spec-websocket-outbound-authorization.md`
  summary: 在递归文件树中防止外部目录链接泄露目录内容。
  evidence: B7，high；readDirRecursive 对子项直接 stat/readDir，根路径验证不能涵盖跟随链接的子树，本轮未改路径操作。
- source_spec: `spec-websocket-outbound-authorization.md`
  summary: 加固文件及技能 canonical 校验后至实际 I/O 的路径替换竞态。
  evidence: B8，high；当前 realPath 校验与随后的读写独立，工作区进程可替换链接或父路径，静态链接验收不证明并发安全。
- source_spec: `spec-websocket-outbound-authorization.md`
  summary: 区分可选技能源缺失与真实权限/边界错误。
  evidence: B9，medium；projectPath 对普通不存在的技能源也记录 source-unavailable/error，会在普通空工作区产生误导诊断。
- source_spec: `spec-websocket-outbound-authorization.md`
  summary: 单个技能目录消失时继续发现后续合法技能。
  evidence: E4，medium；canonical 解析后 stat 位于外层 try，路径消失会终止本次遍历，需单项错误隔离测试。
- source_spec: `spec-websocket-outbound-authorization.md`
  summary: 将 WebSocket 之外的认证凭据与审计关联标识分离。
  evidence: B1 核验扩展，high；AuthSessionStore sessionId 可作 bearer，通用 auditCapabilityDecision/audit.ts 仍原样记录 HTTP CapabilityContext.sessionId。本轮仅修正 WebSocket 审计调用与日志，不能宣称整个应用日志已无凭据。

## 主会话验证收尾

2026-09-30：上述出站授权及文件订阅两项目标通过三路评审补丁与独立复验，状态为 done。后端 50 项（69 子步骤）、Node 32 项、权限门禁 4 项及评审后 Linux 实包 22/22 通过；资产见 release-runtime-core-acceptance.md。原发现与 implemented 交接记录保留为历史，当前尚未解决的是“出站授权评审留存”中的独立问题。
