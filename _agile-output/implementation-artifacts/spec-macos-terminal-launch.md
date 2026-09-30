---
title: 'macOS 终端启动参数兼容'
type: 'bugfix'
created: '2026-09-30'
status: 'in-progress'
baseline_commit: '0adf2948155761faec59da6a5e5c2dc131fc64ac'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** macOS Release 已成功安装、启动和通过健康检查，但终端验收返回 Session not found。当前 script 参数使用 Linux 的 -qc，Apple 实现不支持 -c，进程提前退出后删除会话。

**Approach:** 按运行平台选择固定的 script 启动参数，策略检查和实际 spawn 共用同一份配置；保留真正执行命令、读取输出并关闭会话的验收。

## Boundaries & Constraints

**Always:** Linux 保持原参数；macOS 使用固定 /usr/bin/script 与 /bin/bash 的原生参数。工作目录仍取配置工作区，stdin/stdout/stderr、现有终端环境、会话注册和清理语义不变。remote-shared 仍禁止交互终端，必须先策略授权再启动，策略与实际执行不得使用不同参数。Linux/macOS 验收均保留，不跳过终端；合成输出标记由 shell 构造，输入回显不算成功。

**Never:** 不扩大系统/Deno 权限、不引入新 PTY 依赖、不接受客户端指定 executable 或参数，不修旧 Docker，不修改远程终端归属、高风险命令策略或其他异步授权风险，不读真实凭据，不降低 CI 断言或延长等待掩盖启动失败。Windows 等新平台不属发布支持承诺。无标签、发布或自动推送；远端 macOS 实包验证需另行明确推送授权。

## I/O & Edge-Case Matrix

| 场景 | 输入/状态 | 预期 |
|---|---|---|
| Linux 本地 | local-trusted、linux | script 参数仍为 -qc、/bin/bash -i、/dev/null；可写入并读取真实标记 |
| macOS 本地 | local-trusted、darwin | 参数为 -q、/dev/null、/bin/bash、-i，不包含 -c；终端可执行命令并保持会话直到关闭 |
| 远程拒绝 | remote-shared | 现有 403/INTERACTIVE_DENIED，无进程启动 |
| 执行一致性 | 任一受支持平台 | 策略收到的 executable/args 与 spawn 相同，cwd 一致 |
| 正常关闭 | 创建并得到真实输出后关闭 | 原关闭成功及之后 Session not found 语义保留 |

</frozen-after-approval>

## Code Map

- `backend/src/handlers/terminalHandler.ts`：handleCreateTerminal 两处重复硬编码 -qc；process.status 删除 sessions，command/output 对丢失会话报错。集中固定启动配置，纯平台选择可测试；不要用延迟删除退出会话规避失败。
- `backend/src/handlers/terminalPolicy.test.ts`：已有高风险/远程拒绝与安全关联断言，保留；新 `terminalLaunch.test.ts` 覆盖参数及 handler 策略→spawn 链路，替身需清理流、writer 和 status，不污染其他测试。
- `backend/src/security/commandPolicy.ts`：remote interactive 先拒绝，本轮不修改规则。
- `scripts/release-runtime-acceptance.mjs`：terminal 创建→发送合成标记→轮询输出（10 秒）→finally 关闭→确认已关闭。保留全部真实行为；如补诊断只能是安全平台/阶段摘要，不打印环境/命令正文或凭据。
- 当前 finally close 错误可能覆盖 command/output 的首个异常，因此 CI 的 Session not found 不能精确定位首个失败阶段；参数不兼容由 Apple 源码与实际启动配置独立证实。本轮不改清理错误聚合或会话退出后保留机制；这些诊断改进单独留存，不以延长会话寿命掩盖错误参数。
- `.github/workflows/runtime-release.yml`：linux-x64 与 macos-14 darwin-arm64 已执行同一 smoke；不删除失败矩阵或验收。
- `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md`、`deferred-work.md`：追加根因、平台证据及 macOS 修复状态，原失败记录保留，未实际运行 macOS 不标通过。
- 根因来源：Apple 官方 `https://github.com/apple-oss-distributions/shell_cmds/blob/main/script/script.c` 的 getopt 不包含 c，输出文件后的 argv 传给 doshell；当前 CI `https://github.com/TangCan/lapdev/actions/runs/36694095609` 仅终端失败，其余 21 项通过。这是参数不兼容证据；本机 Linux 单测不能证明真实 macOS 成功。

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/handlers/terminalHandler.ts` — 集中平台启动配置并用于策略及 spawn — 消除 BSD/GNU 参数混用及两处配置漂移。
- [x] `backend/src/handlers/terminalLaunch.test.ts` — 测试 Linux/macOS 精确参数及共享执行配置；验证远程拒绝无 spawn，保留现有策略回归 — 不能只有字符串源码匹配。
- [x] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md`、`deferred-work.md` — 追加本地实包及待远端验证状态 — Linux 与真实 macOS 信号严格分开。

**Acceptance Criteria:**
- Given darwin 平台，when 创建本地终端，then 使用 Apple 支持的参数，无 Linux -c，策略与 spawn 一致。
- Given Linux 平台，when 创建/输入/输出/关闭，then 原实包验收全部通过。
- Given remote-shared，when 创建终端，then 仍拒绝且不启动进程，不增加任何授权能力。
- Given 真实 macos-14 构建包，when 经现有 CLI smoke 验收，then 真正输出标记且正常关闭，终端及其他 21 项全通过；未取得远端证据前只交接本地修复，不宣称该 AC 完成。

## Implementation Notes

平台配置统一供策略与进程构造使用；未修改权限或会话生命周期。主会话复验：后端 61 passed（87 steps）、Node 33 passed、权限门禁 5 passed、Linux 实包原 22/22 通过。Linux 实包覆盖真实输入/输出/关闭；Darwin 参数、策略与 spawn 一致性及远程零启动由替身测试覆盖，不能代替真实 macOS 终端验收。AC4 尚未完成，保持 in-progress，待明确推送授权后运行 macOS CI，再进入完成评审。

## Spec Change Log

- 2026-09-30：用户明确批准“提交并推送，继续验证 macOS CI”；仅授权提交到现有 main 并推送验证，不打标签或发布。原冻结约束中的远端验证授权条件现已满足，AC4 仍待实际结果。

## Review Triage Log

## Verification

- `npm run test:backend -- src/handlers/terminalLaunch.test.ts src/handlers/terminalPolicy.test.ts`，随后 `npm run test:backend`：通过。
- Node 发布四文件、`./scripts/release-permission-gate.sh`、`git diff --check`：通过，不降低断言。
- 新独立 Linux 归档构建/校验、npm pack、smoke-release-cli：原 22/22，包内源码一致及哈希记录；忽略目录下保留资产。
- 获得明确推送授权后，通过当前 Runtime Release 的真实 linux/macOS 构建与 CLI smoke 验证 macOS AC；无远端运行时记录验证待完成，不标规格 done。既有全单元技能发现 170/1 失败另案，不混入本次修复。
