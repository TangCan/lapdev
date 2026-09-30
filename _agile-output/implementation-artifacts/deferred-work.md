# 后续工作记录

- source_spec: `spec-server-request-correlation.md`
  summary: 为运行时归档记录完整构建输入、依赖和工具链快照，验证可重复构建。
  evidence: B6，medium；基线构建脚本仅记录 HEAD，执行现有 frontend/node_modules、Cargo 与 Deno 编译，没有完整工具链/依赖证明。本轮源码差异 hash 与包内源码核对只证明生产源码快照，不证明二进制 bit-for-bit 可重建；需独立发布供应链改进与验证。

## 请求标签风险解决记录（2026-09-30）

- source_spec: `spec-server-request-correlation.md`
  resolves: “为客户端请求关联标签制定安全输入策略，防止任意敏感值经 X-Request-Id 进入日志”。
  status: done
  evidence: 忽略入站标签，每次请求解析生成随机 UUID；上下文和连接后续事件复用该 requestId，现有拒绝响应与审计一致，不新增成功响应出口。生产 emitter、真实 HTTP 200/401/403 和 WS 101/401 捕获验证合成 bootstrap/Cookie/Bearer/UUID 标签无日志或响应回显；匿名、撤销、过期、终端 supplied/fallback 和连接生命周期回归通过。后端 55 项（69 子步骤）、Node 32 项、权限门禁 4 项、独立 Linux 实包 22/22 通过，资产见 release-runtime-core-acceptance.md。以下原发现和历史解决记录保留；终端归属、异步窗口、递归树边界、路径竞态、macOS 等其他风险仍未关闭，也不宣称任意客户端字段或全应用日志已脱敏。

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

- source_spec: `spec-http-audit-credential-isolation.md`
  summary: 为客户端请求关联标签制定安全输入策略，防止任意敏感值经 X-Request-Id 进入日志。
  evidence: B1，high；resolveCapabilityContext 在基线及当前均保留该请求头，审计 correlation.requestId 不脱敏。客户端主动填入合成认证凭据时可回显。此轮仅分离服务端认证 sessionId 与审计 ID，未宣称任意请求字段安全；需明确兼容性和关联策略后单独修复。

## HTTP 审计目标解决记录（2026-09-30）

先前“将 WebSocket 之外的认证凭据与审计关联标识分离”目标已由 `spec-http-audit-credential-isolation.md` 完成：独立服务端关联 ID、真实 HTTP/WS 握手及高风险终端拒绝回归通过。主会话复验后端 55 项（69 子步骤）、Node 32 项、权限门禁 4 项和 Linux 实包 22/22。原发现保留为历史；此记录不关闭上述 X-Request-Id 标签风险或其他独立延期项。

## 请求标签目标最终收尾（2026-09-30）

`spec-server-request-correlation.md` 已完成评审补丁、获批监听测试缓存加固及主会话独立复验：后端 55 项（69 子步骤）、Node 33 项、权限门禁 4 项、Linux 实包 22/22 全部通过。此前冷下载导致的 Node 31/32 失败保留为历史，当前阻碍已解决。X-Request-Id 标签风险关闭；完整构建输入/工具链复现及其他独立风险不关闭。

## 终端输入加载窗口解决记录（2026-09-30）

- source_spec: `spec-terminal-input-revalidation.md`
  resolves: 上述“在终端异步加载后、实际副作用执行前再次校验权限和会话”及“在终端入站异步加载后重验会话、能力和连接状态”目标。
  status: done
  evidence: loader 恢复后同步重验开放且受管理的连接、会话、动态 terminal 能力和既有绑定；无新增 await 插入有效复验至调用之间。13 个可控 Promise 窗口用例验证零转发拒绝、一次有效转发、未注册仍可输入、映射清理/其他连接隔离、关闭/错误和安全审计无合成凭据/输入/异常正文。后端 56 项（82 子步骤）、Node 33 项、权限门禁 4 项及独立 Linux 实包原 22/22 通过；源码快照和新资产哈希见 release-runtime-core-acceptance.md。原发现保留为历史；分发替身用例不冒充真实远程终端正向验收。
- source_spec: `spec-terminal-input-revalidation.md`
  summary: 终端处理器内部 stdinWriter.write 的异步窗口继续延期。
  evidence: 本次仅在 forwardTerminalInput 调用前重验，未改变处理器或进程归属，也不保证原子取消已开始的写入；需独立规格与验证。既有远程认证会话与实际进程归属问题仍未关闭。

- source_spec: `spec-terminal-input-revalidation.md`
  summary: 统一隔离已退休 WebSocket 异步处理器的异常，避免关闭后重复关闭或误清理替换状态。
  evidence: B3，medium；基线外层 catch 按 ws 无条件 closeFailedClient，loader 在 onclose/onerror 后拒绝可重复 close，重初始化后旧拒绝也可能清理新状态。本轮只保护 loader 成功恢复后的授权和身份检查；需覆盖所有异步消息异常与状态归属后独立修复。
# 2026-09-30 终端输入评审最终复验补充

主会话确认评审补丁后后端 57 项（85 子步骤）、Node 发布测试 33 项、权限门禁 4 项及最终 Linux 实包核心 22/22 全通过；新资产目录为 `terminal-input-review-final-20260930/`，源码与包内一致。加载成功恢复后的授权窗口已关闭；既有异常生命周期隔离 B3、处理器内部写入窗口及终端归属仍按各延期条目保留，未因此扩大生产权限或修改异常处理目标。

## 递归文件树边界解决记录（2026-09-30）

- source_spec: `spec-recursive-file-tree-boundary.md`
  resolves: RB8/B7 递归文件树外部链接绕过入口工作区边界的发现。
  status: done
  evidence: 每个可见子项及 .gitignore 在跟随读取前复用 WorkspaceBoundary；越界、悬空及无法安全解析子项跳过，合法内部链接保留逻辑路径；canonical 祖先集合仅截断当前分支循环。临时合成夹具覆盖真实/alias root、外部文件/目录、前缀相似兄弟、外部/内部规则链接、重复内部分支、普通元数据与排序、隐藏项、深度零/一及 20 层上限、根拒绝和普通 I/O 失败；stat/readDir/readTextFile 观察证明静态外部链接未被跟随读取。定向 5 项（2 steps）、全后端 58 项（87 steps）、Node 33 项、权限门禁 4 项、独立 Linux 实包原 22/22 均通过，源码与归档一致；证据见 release-runtime-core-acceptance.md。以上原发现与历史资产保留。

B8 canonical 校验至 I/O 的路径替换竞态保持开放，本次未提供原子 I/O 保证。macOS、公开安装及真实 LSP 功能未验证；新增递归链接矩阵由服务测试证明，原实包 22 项不是该矩阵的端到端覆盖。

递归树首轮 done/58 项记录是评审前实现交接历史；字面名称问题触发第二轮重新实现，当前待主会话复验及评审。最终关闭以随后追加的收尾记录为准。

- source_spec: `spec-recursive-file-tree-boundary.md`
  summary: 为文件树添加宽度/节点或响应预算，防止合法别名分支造成重复展开膨胀。
  evidence: 第一轮 B2 medium；原递归已跟随内部链接且没有节点预算，当前祖先循环截断不限制合法不同分支，需独立可用性策略。
- source_spec: `spec-recursive-file-tree-boundary.md`
  summary: 验证非有限深度及非法 API 参数，防止 NaN 绕过递归深度 clamp。
  evidence: 第一轮 B3 medium；基线与本轮均 Math.min(Math.max(0, depth), MAX_DEPTH)，NaN 使终止比较失效，未由此次边界修复引入。
- source_spec: `spec-recursive-file-tree-boundary.md`
  summary: 用原子目录/文件句柄解决递归子项与规则文件校验后的路径替换竞态。
  evidence: 第一轮 E3/E4、第二轮 E2-1 high；基线校验与路径 I/O 分离，当前仅静态链接保护，合法路径或祖先可被工作区进程替换；B8 继续开放。
- source_spec: `spec-recursive-file-tree-boundary.md`
  summary: 明确 POSIX 字面反斜杠路径在文件树至读写 API 之间的无歧义往返契约。
  evidence: 第二轮 B2-1 high；基线树已返回字面名称但共享外部 resolve 规范化反斜杠，a\\b 和 a/b 同时存在可能导致读写另一文件；本轮只修内部遍历身份，不改变外部入口语义。
- source_spec: `spec-recursive-file-tree-boundary.md`
  summary: 测量逐项同步 canonical 校验对文件树请求及后端事件循环响应的影响。
  evidence: 第二轮 B2-2 medium unverified；每项新增同步 realPath 会增加调用成本，但未测量实际阻塞；需大树、慢文件系统及并发健康请求指标后确定严重程度及异步方案。

## 递归文件树最终收尾（2026-09-30）

- source_spec: `spec-recursive-file-tree-boundary.md`
  resolves: RB8/B7 静态递归边界及规则文件越界读取目标。
  status: done
  evidence: 第二轮三路评审及覆盖补丁完成；主会话最终后端 59 项（87 子步骤）、Node 33 项、门禁 4 项及新 Linux 实包 22/22 全通过，两个生产文件 cmp 一致。字面名称内部遍历、root null 拒绝、子树路径、嵌套外部规则和嵌套迭代失败均已核验。第一轮 done/58 项及 pending 说明是历史，当前以本记录为准；新包路径与哈希见验收报告。独立延期项不关闭。
