---
title: "Lapdev 项目实现与文档完善调研"
type: technical
topic: "lapdev project implementation and documentation"
decision: "确定 Lapdev 下一阶段最值得投入的完善方向"
source: native
status: final
preset: standard
validation: normal
created: 2026-09-28
updated: 2026-09-28
---

# Lapdev 项目实现与文档完善调研

## Executive Summary

### 决策

下一阶段应按以下顺序投入：

1. **统一运行时与工程契约**：统一 `_agile-output`、`.agents/skills`、旧 `.lapdev/skills` 的兼容边界，补齐根目录启动命令、端口、版本和文档校验。
2. **建立安全执行边界**：移除生产入口的 Deno `-A`，为终端、文件、Git、LSP、AI 和 WebSocket 设计最小权限、认证、会话绑定和审计策略。
3. **提高验证与交付确定性**：修复前端测试环境耦合及 React Compiler 断言，统一测试入口，把测试、文档和容器健康检查纳入 CI 质量门禁。
4. **把技能和 LSP 做成可观测的平台能力**：技能注册表、来源/版本/刷新状态、LSP 生命周期管理、统一遥测和错误诊断应先于更多技能或语言扩展。
5. **最后扩展产品能力**：在上述基础稳定后，再投入远程协作、多工作区、多用户和更多 AI 提供商等能力。

### 为什么现在做这些

Lapdev 已经不是单一前端项目，而是由 React/Vite、Deno/TypeScript、Rust core、终端、文件监听、LSP、Git、AI provider、Agent 操作、BMAD 与技能市场组成的多表面系统。它的主要风险不在“缺少一个功能”，而在于多个边界的契约不一致：运行命令和文档不一致，React 版本和旧文档不一致，技能目录有两套约定，BMAD 产物目录与历史状态文件分离，后端又拥有高权限和网络执行能力。

本地前端测试为 673/684 通过，后端测试 7 个测试文件、39 个步骤通过；失败主要暴露了 shell 权限耦合和 React Compiler 版本/断言契约问题。生产入口使用 Deno `-A`，且服务包含终端执行、文件写入、Git 和 WebSocket，安全边界应作为产品基础设施处理。Deno 官方明确建议生产环境只授予必要权限，并警告 `--allow-all` 会移除有效的权限隔离。[1][2]

## Findings

### 1. 实现现状：能力面广，但边界契约尚未收敛

- 代码结构覆盖 `frontend/`、`backend/`、`core/`、`shared/`、`server/`、`tests/`、`scripts/` 和多套项目文档，能力面已经足够支撑“本地 AI Web IDE / Agent 工作台”的定位。
- 测试分散在 Deno、Vitest、Playwright、shell 和容器流程中。广度不错，但统一入口、隔离策略和失败分类还不足以让 CI 结果稳定地代表生产质量。
- 根 `package.json` 没有 `dev` 或 `start`，而 README 仍按根目录直接执行这两个命令；前端和后端实际各有自己的启动方式。
- `frontend/package.json` 已使用 React 19.2.0 和 Playwright 1.60.0，但 README、架构文档和 epics 文档仍写 React 18 或“React 19 尚未正式发布”。React 19 已稳定，React 19.3 也已有官方稳定版说明，因此这不是普通措辞问题，而是版本契约失真。[8][9]

### 2. 文档现状：信息量足够，但缺少单一事实来源

- README、架构、epics、设计文档和实现代码对端口、启动命令、React 版本、Playwright 版本和技能路径存在漂移。
- README 中的 PORT=8080 与后端默认 3333 不一致；部署和 CI 健康检查又使用 3333。
- 文档仍描述 Deno 扫描 `~/.lapdev/skills` 与 `.lapdev/skills`，但当前 Codex/BMAD 安装使用 `.agents/skills`。安装目录、运行时发现目录和项目文档没有形成同一条链路。
- BMAD 当前配置使用 `_agile-output`，但历史 sprint status 在根目录 `implementation_artifacts/sprint-status.yaml`，而 `_agile-output/planning-artifacts` 与 `_agile-output/implementation-artifacts` 为空。

### 3. 安全与部署：当前是最高风险项

- `scripts/entrypoint.sh` 使用 `deno run --no-lock -A backend/src/main.ts`；测试和部分脚本也使用 `--allow-all`。
- 后端具有终端进程、文件读写、Git、Agent 文件操作、AI 配置、WebSocket 和 LSP 能力，权限过宽会把任意后端漏洞或错误配置放大为主机/工作区级风险。
- 当前审计未看到明确的统一认证中间件覆盖主路由和 WebSocket；因此不应假设网络暴露实例已具备多用户安全边界。
- AI key 在前端 `sessionStorage` 中管理，且后端接受 AI 配置。应明确“仅本地可信模式”与“远程/共享工作区模式”的不同威胁模型。
- WebSocket 的 Origin 检查只能作为辅助控制；非浏览器客户端可以伪造 Origin，连接仍需要认证、会话绑定和权限检查。[3]

### 4. 技能与 BMAD/Codex：应从目录扫描升级为注册表

OpenAI 的 Skills 模型以包含 `SKILL.md` 的目录为基本单元，并允许附带 references、scripts 和 assets；运行时需要明确技能目录并发现其描述。[4] 同时，技能过多会压缩可用描述和上下文，因此不宜无限扫描所有目录，应保持发现路径、启用状态和描述可控。[5]

建议 Lapdev 建立 `SkillRegistry`，至少支持：

- `.agents/skills`：Codex/BMAD 当前规范入口；
- `.lapdev/skills`：旧 Lapdev 项目兼容入口；
- 用户级技能目录：仅在配置中显式启用；
- 每个技能的来源、版本、启用状态、解析错误、最近刷新时间；
- 旧目录到新目录的迁移提示，而不是静默复制或重复加载；
- UI/API 中可查询“为什么看不到这个技能”。

### 5. LSP 与可观测性：应抽象生命周期，而非继续堆 handler

LSP 通过 JSON-RPC 标准化编辑器与语言服务器通信，并支持多个工具复用同一语言服务器模型。[6] Lapdev 下一步应把 workspace root、服务器启动/停止、能力协商、请求取消、诊断新鲜度、崩溃恢复和缓存失效做成统一生命周期状态。

Deno 已提供 OpenTelemetry 支持，可覆盖 traces、metrics、logs，并允许自定义 instrumentation。[7] Lapdev 应优先观测 HTTP 请求、WebSocket 会话、终端命令、LSP 进程、文件操作和 AI 调用的延迟/错误/用量；日志必须默认脱敏，不能记录 API key、命令敏感参数或完整提示词。

### 6. 前端质量：React Compiler 问题需要澄清契约

React Compiler 支持渐进式采用，相关诊断可由 `eslint-plugin-react-hooks` 暴露，即使暂时不让所有组件进入编译也可以先建立规则和报告。[8] 当前一个 React Compiler lint 测试失败，应该先固定 compiler、eslint plugin、React 和配置版本，再决定测试期待“必须报错”还是“允许跳过不安全组件”。不建议简单修改断言以消除红灯。

## Contrary Evidence / 反证与限制

- 后端测试全部通过，说明现有核心 API 流程并非不可用；安全建议针对权限和暴露边界，不等于已证明存在可利用漏洞。
- 前端 11 个失败中有 10 个受到当前 sandbox 禁止 shell 子进程的影响，因此不能直接把它们等同于产品回归；但测试依赖 shell 且没有隔离适配，本身仍是可交付性问题。
- 当前没有做真实用户访谈、竞品研究或生产流量分析，因此“远程协作、多用户”只是潜在产品方向，不应在没有需求证据时排在安全、契约和可维护性之前。
- 官方文档证明的是通用技术实践和协议能力，不是 Lapdev 的完整设计；涉及 Lapdev 的结论均标为本地实现审计或基于本地与外部证据的推断。

## Prioritized Recommendations

| 优先级 | 建议 | 交付物 | 验收信号 | 依赖 |
|---|---|---|---|---|
| P0 | 建立运行时契约 | `docs/runtime-contract.md`、根级可执行 dev/test 命令、统一端口和版本来源 | 新环境按 README 可启动；CI 校验文档命令和实际脚本 | 无 |
| P0 | 建立安全执行边界 | Deno permission profile、命令白名单、工作区边界、WebSocket auth/session、AI secret policy | 生产不再使用 `-A`；未认证连接和越界文件操作被拒绝 | 运行时契约 |
| P0 | 统一技能注册 | `SkillRegistry`、`.agents/skills` 主路径、`.lapdev/skills` 兼容迁移、可诊断刷新 API | BMAD/Codex 技能可发现；UI 能解释不可见原因；无重复加载 | 运行时契约 |
| P1 | 修复验证与 CI | 前端 shell 测试改为可注入 runner 或 fixture；修正 compiler 测试；CI 跑 backend/frontend/API/e2e 的明确分层 | 失败可区分环境限制、单测、集成和部署问题；镜像发布前有质量门禁 | P0 安全边界 |
| P1 | 文档单一事实来源 | 从 `package.json`、配置和版本文件生成 README/架构关键段，增加 docs drift 检查 | React、端口、命令、技能路径和产物目录不再出现双版本 | P0 运行时契约 |
| P1 | 统一 BMAD 产物迁移 | 将历史 `implementation_artifacts` 归档/迁移到 `_agile-output`，在仓库说明迁移规则 | `$bmad-help`、规划技能和项目状态读取同一目录 | P0 技能注册 |
| P2 | LSP 生命周期平台化 | LSP manager、capability registry、取消/重启/诊断状态、语言服务器健康指标 | 新增语言只需适配配置，不复制 handler 逻辑 | P1 可观测性 |
| P2 | 遥测与审计 | OpenTelemetry traces/metrics/logs，AI、终端、LSP、WS、文件操作统一 correlation id | 能回答一次请求经过哪些服务、耗时多少、失败在哪里；敏感数据不落日志 | P0 安全边界 |
| P3 | 产品能力扩展 | 远程协作、多用户、更多 provider、技能市场体验 | 在明确用户需求和安全模型后再进入 roadmap | P0-P2 |

## Suggested 30/60/90-day sequence

### 0–30 天：先让系统“说得清、跑得稳”

- 冻结并发布运行时契约：端口、启动命令、Node/Deno/React/Playwright 版本、产物路径和技能路径。
- 建立 `.agents/skills` 主路径，提供旧 `.lapdev/skills` 兼容读取和迁移提示。
- 将历史 BMAD 状态迁移或明确归档映射到 `_agile-output`。
- 让 README 的命令在干净环境中逐条执行；增加 docs drift 检查。
- 将前端失败测试拆成“真实失败”和“受 sandbox 限制”，修复 React Compiler 测试契约。

### 31–60 天：先让系统“可安全运行”

- 用 permission profile 替换生产 `-A`；单独限制终端、Git、文件、网络和环境变量权限。
- 加入认证/授权中间件，WebSocket 绑定用户、workspace 和 session；记录审计事件。
- 明确 AI key 的存储策略：本地可信模式可临时使用，远程模式统一服务端 secret 管理并禁止回传。
- CI 在镜像发布前运行分层测试、lint、类型检查、健康检查和最小权限启动测试。

### 61–90 天：再让系统“可扩展、可运维”

- 落地 SkillRegistry 和 LSP manager。
- 引入 OpenTelemetry，先覆盖高风险和高耗时路径。
- 生成关键文档片段，减少手工维护版本/端口/命令。
- 用真实使用数据决定多用户、远程协作、provider 扩展和技能市场的优先级。

## Open Questions

1. Lapdev 的正式部署边界是单用户本地应用、可信局域网，还是公网多用户服务？这会改变认证、隔离和密钥策略。
2. `.agents/skills` 是否应成为唯一规范目录，还是由 Lapdev 注册表长期兼容多个来源？
3. 终端命令是否允许任意用户自定义，还是必须按 workspace policy 允许列表执行？
4. `_agile-output` 中哪些历史产物需要迁移，哪些只需归档链接？
5. React Compiler 是当前产品目标，还是仅作为 lint 约束？需要由前端负责人确定验收标准。
6. 是否有生产遥测、用户反馈或使用量数据可以验证 P3 产品方向？

## Source Appendix

| [1] | Deno Security Fundamentals | Deno | 2026-09-28 | https://docs.deno.com/runtime/fundamentals/security/ |
| [2] | Deno Permissions Reference | Deno | 2026-09-28 | https://docs.deno.com/runtime/reference/permissions/ |
| [3] | Writing WebSocket servers: security | MDN | 2026-09-28 | https://developer.mozilla.org/docs/Web/API/WebSockets_API/Writing_WebSocket_servers |
| [4] | Skills guide | OpenAI | 2026-09-28 | https://developers.openai.com/api/docs/guides/tools-skills |
| [5] | Rethinking skills and prompts for GPT-6 Astra | OpenAI | 2026-09-28 | https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra |
| [6] | Language Server Protocol | Microsoft | 2026-09-28 | https://microsoft.github.io/language-server-protocol/ |
| [7] | OpenTelemetry in Deno | Deno | 2026-09-28 | https://docs.deno.com/runtime/fundamentals/open_telemetry/ |
| [8] | React Compiler installation | React | 2026-09-28 | https://react.dev/learn/react-compiler/installation |
| [9] | React 19.3 | React | 2026-09-09 | https://react.dev/blog/2026/09/09/react-19-3 |

## Staleness Map

| Claim class | Re-check window | Re-check date | Why |
|---|---:|---:|---|
| security | 6 months | 2027-03-28 | Runtime permission and deployment guidance can change; revisit before production hardening sign-off. |
| integration | 3 months | 2026-12-28 | Agent Skills and Codex discovery conventions are evolving quickly. |
| architecture | 24 months | 2028-09-28 | LSP protocol model is comparatively stable; revisit when changing editor architecture. |
| observability | 6 months | 2027-03-28 | Deno/OpenTelemetry support and deployment conventions may change. |
| compatibility | 1 month | 2026-10-28 | React Compiler and lint behavior are version-sensitive. |
| versions | 1 month | 2026-10-28 | React/runtime versions are fast-moving and directly affect docs and tests. |

## Local Evidence Index

- `package.json`, `frontend/package.json`
- `README.md`, `docs/architecture.md`, `docs/epics.md`, `docs/003_design.md`
- `backend/src/main.ts`, `backend/src/services/skillService.ts`, `frontend/src/services/aiService.ts`
- `scripts/entrypoint.sh`, `.github/workflows/build-and-push.yml`, `docker-compose.yml`
- `implementation_artifacts/sprint-status.yaml`
- Test run on 2026-09-28: backend 7 files/39 steps passed; frontend 673/684 passed with 11 failures described above.
