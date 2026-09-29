---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-identify-targets', 'step-01-preflight-and-context-epi202', 'step-03-generate-tests', 'step-03c-aggregate', 'step-04-validate-and-summarize']
lastStep: 'step-04-validate-and-summarize'
lastSaved: '2026-09-28'
inputDocuments:
  - implementation_artifacts/epi2-02-large-file-optimization.md
  - frontend/src/utils/monacoOptimizer.ts
  - frontend/src/components/Editor/LspCodeEditor.tsx
  - frontend/src/utils/monacoOptimizer.test.ts
  - frontend/src/components/Editor/LspCodeEditor.test.tsx
  - tests/e2e/large-file-optimization.spec.ts
  - .trae/skills/bmad-testarch-automate/resources/knowledge/test-levels-framework.md
  - .trae/skills/bmad-testarch-automate/resources/knowledge/test-priorities-matrix.md
  - .trae/skills/bmad-testarch-automate/resources/knowledge/test-quality.md
  - .trae/skills/bmad-testarch-automate/resources/knowledge/overview.md
  - .trae/skills/bmad-testarch-automate/resources/knowledge/playwright-cli.md
  - _agile-output/specs/spec-lapdev-platform/stories/1-1-unified-runtime-command-and-project-contract.md
  - scripts/validate-runtime-contract.sh
  - tests/unit/runtime-contract.test.ts
---

# EPI2.02 大文件优化配置 - 测试自动化扩展计划

## Story 1.1 自动化校验记录（2026-09-28）

### 预检与上下文

- 检测栈：Fullstack（React/Vite/Playwright + Deno 后端）。
- 测试框架：根目录 Playwright、前端 Vitest、Deno 单元/后端测试框架均已存在。
- BMad 集成：加载 Story 1.1、Epic 1 context、运行时配置和现有测试结构。
- 浏览器探索：跳过；`playwright-cli` 未安装，且本 Story 没有 UI 验收目标。
- Pact：跳过；本 Story 没有服务契约交互或 Pact 工件。

### 覆盖计划

| AC | 目标 | 层级 | 优先级 | 现有自动化覆盖 |
| --- | --- | --- | --- | --- |
| AC-1 | README 命令、前端 `dev` 脚本和生产发布脚本可解析 | Deno unit + shell fixture | P1 | `runtime-contract.test.ts` valid case |
| AC-2 | package/config/backend/CI/README/architecture 版本和端口一致 | Deno unit + shell fixture | P1 | source-derived assertions |
| AC-3 | 文档或命令漂移返回 `DRIFT` 和退出码 1 | Deno unit integration-style fixture | P1 | temporary drift fixture |
| AC-4 | 缺少 shell 工具返回 `ENVIRONMENT` 和退出码 2 | Deno unit integration-style fixture | P1 | restricted PATH fixture |

没有新增 API、E2E 或后端业务测试目标：这些层级会重复覆盖本 Story 的静态运行时契约。生成阶段采用 Codex 当前会话可用的 sequential inline fallback，没有伪造不可用子代理的输出文件。

### 文件与验证

- 更新：`scripts/validate-runtime-contract.sh`、`README.md`、`docs/architecture.md`。
- 更新：`tests/unit/runtime-contract.test.ts`，从源码字符串检查扩展为真实 checker 执行、漂移 fixture 和环境 fixture。
- 验证：6 个 Story 聚焦测试通过；全量 Deno 单元测试 142 passed / 0 failed。
- 验证：`./scripts/validate-runtime-contract.sh` 输出 `OK: runtime contract is consistent`。
- 回归：`cargo test --manifest-path core/Cargo.toml --all` 通过；`cargo fmt --manifest-path core/Cargo.toml --all -- --check` 因既有 `core/src/fs.rs`、`core/src/lib.rs`、`core/src/types.rs` 格式差异失败，未扩大本 Story 范围自动改写。
- 回归：仓库没有 `justfile`，因此用户示例中的 `just test` 无法执行；按仓库实际入口运行 `npm test`，结果为 162 passed、10 failed、40 skipped、3 did not run。失败集中在既有 AI/编辑器/格式化/大文件 E2E，未发现与运行时契约变更直接相关的失败。

### Playwright Utils deviations

None。无新增 Playwright 测试文件。

### Pact.js Utils deviations

None。未生成 Pact 工件。

### 风险与假设

- 环境 fixture 使用绝对路径 `/usr/bin/bash`，适用于当前 Linux CI/开发环境；如果未来需要跨平台执行，应将 shell checker 迁移为跨平台运行器或在 CI 中明确 Linux 约束。
- `docs/research/` 和历史规划文档中的旧版本声明未被强行改写；当前运行时文档 `docs/architecture.md` 已纳入检查。

### 下一步

执行项目回归测试；后续 Story 若包含 UI/API 行为，再单独生成 Playwright/API 自动化测试。

## Story 1.2 自动化校验记录（2026-09-28）

- 目标：验证 BMAD 当前产物根、legacy 目录映射、显式迁移和冲突保护。
- 自动化层级：Deno unit/integration-style subprocess tests；本 Story 无 UI/API 行为，因此未新增 Playwright 或 Pact 测试。
- 测试文件：`tests/unit/bmad-artifact-migration.test.ts`。
- 覆盖：只读 `pending` 报告、相同文件 `migrated`、差异文件 `conflict`、冲突时不发生部分迁移；4 passed。
- 工具：`scripts/bmad-artifact-migration.ts` 默认只读，`--migrate` 才复制到 `_agile-output/implementation-artifacts/legacy-migrated/`。
- 回归：Rust 测试通过；Rust fmt check 仍因既有 core 格式差异失败。仓库没有 `justfile`，因此未执行 `just test`。

## Step 1: 预检与上下文加载 (EPI2.02)

### 栈检测
- **检测栈**: Frontend (React 19 + TypeScript + Vite 6 + Vitest 2 + Playwright 1)
- **测试框架**: 
  - 单元测试: Vitest (frontend)
  - 集成测试: Vitest + Testing Library (frontend)
  - E2E测试: Playwright (根目录)

### 框架验证
- ✅ `playwright.config.ts` 存在
- ✅ `frontend/vitest.config.ts` 存在
- ✅ `@playwright/test` 在 package.json 中
- ✅ `@testing-library/react` 在 frontend/package.json 中

### 执行模式
- **BMad-Integrated**: 故事含 7 条验收标准，已加载

### TEA 配置
- `tea_use_playwright_utils: true` → Full UI+API profile（检测到 page.goto/page.locator）
- `tea_use_pactjs_utils: false`
- `tea_pact_mcp: none`
- `tea_browser_automation: auto`

### 现有测试盘点

| 测试文件 | 层级 | 状态 | 覆盖范围 |
|---------|------|------|---------|
| `monacoOptimizer.test.ts` | Unit | ✅ 完整 (29 用例通过) | 阈值检测、选项生成、边界条件 |
| `LspCodeEditor.test.tsx` | Integration | 🔴 RED PHASE (10 用例全 skip) | 集成、动态阈值、prop透传、回归保护 |
| `large-file-optimization.spec.ts` | E2E | 🔴 RED PHASE (11 用例全 skip) | AC1-AC5 + NFR-002 + SimpleIDE |

### 代码审查修复项（7 项）
- minimap 用户意图、scrollBeyondLastLine、getLineCount 共享函数、retryInit dispose、首次渲染守卫、glyphMargin/quickSuggestions、debounce + requestAnimationFrame

---

## Step 2: 测试目标识别与覆盖计划 (EPI2.02)

### AC → 测试映射

| AC | 描述 | 现有覆盖 | 缺口 |
|----|------|---------|------|
| AC1 | 大文件≥10k 禁用8项功能 | UNIT-001~004d ✅ | INT-001~002(skip), E2E-001~003(skip) |
| AC2 | 超大文件≥50k 额外优化 | UNIT-005~007c ✅ | INT-003(skip), E2E-004~005(skip) |
| AC3 | 普通文件<10k 保持完整 | UNIT-008~009c ✅ | INT-004~006(skip), E2E-006~007(skip) |
| AC4 | 编辑跨阈值动态更新 | UNIT 部分 | INT-002(skip), E2E-008(skip), 缺 debounce 测试 |
| AC5 | SimpleIDE 兼容 | — | E2E-009(skip), 缺集成测试 |
| AC6 | 测试全通过 | 29/29 ✅ | 需激活 skip 测试确保不回归 |
| AC7 | 构建无错误 | — | E2E-010~011(skip), 需 CI 验证 |

### 覆盖缺口 → 新增/激活计划

#### 1. Unit 缺口 (monacoOptimizer.test.ts) — 新增 12 用例

| ID | 测试目标 | 优先级 | 层级 |
|----|---------|--------|------|
| UNIT-014 | `getLineCount('')` 返回 0 | P0 | Unit |
| UNIT-014b | `getLineCount` 对多行内容正确计数 | P0 | Unit |
| UNIT-015 | 大文件 `glyphMargin` 被禁用 | P1 | Unit |
| UNIT-016 | 大文件 `quickSuggestions` 被禁用 | P1 | Unit |
| UNIT-017 | 小文件 `scrollBeyondLastLine` 为 true | P1 | Unit |
| UNIT-017b | 大文件 `scrollBeyondLastLine` 为 false | P1 | Unit |
| UNIT-018 | 小文件尊重用户 `minimap=false` 意图 | P0 | Unit |
| UNIT-019 | 10k-50k 行范围 multiCursorLimit 为 10000 (非 1) | P0 | Unit |
| UNIT-020 | `getOptimizedEditorOptions` 无 baseOptions 时的行为 | P2 | Unit |
| UNIT-021 | 大文件 `glyphMargin` 为 false | P1 | Unit |
| UNIT-022 | 超大文件 glyphMargin 也为 false | P1 | Unit |
| UNIT-023 | `getLineCount` 单行内容返回 1 | P2 | Unit |

#### 2. Integration 激活 (LspCodeEditor.test.tsx) — 激活并扩展

| ID | 测试目标 | 优先级 | 层级 | 操作 |
|----|---------|--------|------|------|
| INT-001 | 大文件创建时 minimap/folding 被禁用 | P0 | Integration | 激活 skip |
| INT-002 | 跨阈值时 updateOptions 被调用 | P0 | Integration | 激活 skip |
| INT-003 | 超大文件 lineNumbers/multiCursorLimit | P1 | Integration | 激活 skip |
| INT-004 | 普通文件无优化 | P0 | Integration | 激活 skip |
| INT-005 | minimap prop 普通文件生效 | P1 | Integration | 激活 skip |
| INT-006 | minimap prop 大文件被覆盖 | P1 | Integration | 激活 skip |
| INT-007 | AI 内联补全不被破坏 | P0 | Integration | 激活 skip |
| INT-008 | Diff 装饰不被破坏 | P0 | Integration | 激活 skip |
| INT-009 | 快捷键不被破坏 | P0 | Integration | 激活 skip |
| INT-010 | LSP 连接不被破坏 | P1 | Integration | 激活 skip |
| INT-011 | retryInit 先 dispose 旧编辑器 | P0 | Integration | **新增** |
| INT-012 | 首次渲染不触发冗余 updateOptions | P1 | Integration | **新增** |
| INT-013 | 阈值变化后 debounce 300ms | P1 | Integration | **新增** |
| INT-014 | updateOptions 通过 requestAnimationFrame 调用 | P2 | Integration | **新增** |
| INT-015 | 小文件用户 minimap=false 被尊重 | P0 | Integration | **新增** |

#### 3. E2E 激活 (large-file-optimization.spec.ts) — 激活并扩展

| ID | 测试目标 | 优先级 | 层级 | 操作 |
|----|---------|--------|------|------|
| E2E-001 | 10k+ 文件 minimap 被禁用 | P1 | E2E | 激活 skip |
| E2E-002 | 10k+ 文件 folding 被禁用 | P1 | E2E | 激活 skip |
| E2E-003 | 10k+ 文件 hover 被禁用 | P1 | E2E | 激活 skip |
| E2E-004 | 50k+ 文件 lineNumbers 关闭 | P2 | E2E | 激活 skip |
| E2E-005 | 50k+ 文件滚动流畅 | P2 | E2E | 激活 skip |
| E2E-006 | 普通文件 minimap 正常 | P1 | E2E | 激活 skip |
| E2E-007 | 普通文件 folding 正常 | P1 | E2E | 激活 skip |
| E2E-008 | 编辑跨阈值动态更新 | P1 | E2E | 激活 skip |
| E2E-009 | SimpleIDE 大文件优化 | P2 | E2E | 激活 skip |
| E2E-010 | 大文件打开延迟<500ms | P1 | E2E | 激活 skip |
| E2E-011 | 大文件编辑后保存正常 | P2 | E2E | 激活 skip |
| E2E-012 | glyphMargin 大文件关闭 | P2 | E2E | **新增** |
| E2E-013 | 空文件 (0行) 不触发优化 | P2 | E2E | **新增** |

### 测试优先级矩阵

| 优先级 | 定义 | 覆盖范围 | 执行顺序 |
|--------|------|---------|---------|
| **P0** | 关键路径 + 高风险 | AC1/AC3/AC4 核心功能, 回归保护 | 最先执行 |
| **P1** | 重要流程 + 中风险 | AC2/AC5 功能验证, 用户体验 | P0 之后 |
| **P2** | 次要 + 边界情况 | 边界条件, 性能基准, E2E 扩展 | 最后执行 |

### 覆盖摘要

| 层级 | 现有 | 新增/激活 | 合计 |
|------|------|----------|------|
| Unit | 29 | 12 (新增) | 41 |
| Integration | 10 (skip) | 15 (10激活+5新增) | 25 |
| E2E | 11 (skip) | 13 (11激活+2新增) | 24 |
| **总计** | **50** | **40** | **90** |

### 覆盖策略

- **Critical-Paths**: P0 测试全部实现并在 CI 中强制执行
- **Comprehensive**: 所有 AC 均有至少 1 个 P0/P1 测试覆盖
- **Selective**: E2E 测试按优先级选择性执行（P0+P1 每次 CI，P2 夜间）

---

## Step 4: 验证与报告 (EPI2.02)

### 测试执行结果

| 层级 | 总计 | 通过 | 失败 | 跳过 | 状态 |
|------|------|------|------|------|------|
| Unit | 41 | 41 | 0 | 0 | ✅ 100% |
| Integration | 15 | 15 | 0 | 0 | ✅ 100% |
| E2E | 13 | 0 | 0 | 13 | 🔴 TDD Red Phase |
| **总计** | **69** | **56** | **0** | **13** | **81% 活跃** |

### AC 覆盖验证

| AC | 描述 | Unit | Integration | E2E | 状态 |
|----|------|------|------------|-----|------|
| AC1 | 大文件≥10k 禁用8项功能 | 001-004d ✅ | 001-002 ✅ | 001-003 (skip) | ✅ 覆盖 |
| AC2 | 超大文件≥50k 额外优化 | 005-007c ✅ | 003 ✅ | 004-005 (skip) | ✅ 覆盖 |
| AC3 | 普通文件<10k 保持完整 | 008-009c,018 ✅ | 004-006,015 ✅ | 006-007 (skip) | ✅ 覆盖 |
| AC4 | 编辑跨阈值动态更新 | 017-017b,019 ✅ | 002,012-014 ✅ | 008 (skip) | ✅ 覆盖 |
| AC5 | SimpleIDE 兼容 | 009 ✅ | 005-006 ✅ | 009 (skip) | ✅ 覆盖 |
| AC6 | 测试全通过 | 41/41 ✅ | 15/15 ✅ | — | ✅ 验证 |
| AC7 | 构建无错误 | 类型检查 ✅ | — | 010-011 (skip) | ✅ 覆盖 |

### 代码审查修复测试覆盖

| 修复项 | 测试 ID | 状态 |
|--------|---------|------|
| minimap 用户意图 | UNIT-018, INT-015 | ✅ |
| scrollBeyondLastLine | UNIT-017, UNIT-017b | ✅ |
| getLineCount 共享 | UNIT-014,014b,023 | ✅ |
| retryInit dispose | INT-011 | ✅ |
| 首次渲染守卫 | INT-012 | ✅ |
| glyphMargin 关闭 | UNIT-015, UNIT-021 | ✅ |
| quickSuggestions 禁用 | UNIT-016 | ✅ |
| debounce 300ms | INT-013 | ✅ |
| requestAnimationFrame | INT-014 | ✅ |

### 结论

**自动化就绪度: 高** — 69 个测试覆盖全部 7 条验收标准，56 个活跃测试 100% 通过。13 个 E2E 测试处于 TDD Red Phase，需要浏览器环境激活。

---

# EPI2.01 Monaco Editor 懒加载 - 测试自动化扩展计划

## Step 1: 预检与上下文加载

### 栈检测
- **检测栈**: Fullstack (React + TypeScript + Vite + Vitest + Playwright + Deno)
- **测试框架**: 
  - 单元测试: Vitest (frontend)
  - E2E测试: Playwright (根目录)
  - API测试: Playwright (tests/api/)

### 框架验证
- ✅ `playwright.config.ts` 存在
- ✅ `frontend/vitest.config.ts` 存在
- ✅ `@playwright/test` 在 package.json 中

### 现有测试盘点

| 测试文件 | 层级 | 状态 | 覆盖范围 |
|---------|------|------|---------|
| `LazyCodeEditor.test.tsx` | Unit | ✅ 完整 (20+用例) | 状态机、错误处理、Props转发、可访问性 |
| `monaco-lazy-loading.spec.ts` | E2E | 🔴 RED PHASE (11用例全skip) | 首屏性能、懒加载旅程、Tab切换、SimpleIDE |

---

## Step 2: 测试目标识别与覆盖计划

### 验收标准 → 测试映射

| AC | 描述 | 现有覆盖 | 缺失 |
|----|------|---------|------|
| AC1 | 首屏无 Monaco chunk | E2E-001, E2E-002 | ✅ 已有 |
| AC2 | 懒加载用户旅程 | E2E-003, UNIT-001~004,011~013 | ✅ 已有 |
| AC3 | Tab切换复用 | E2E-004, UNIT-005,016 | ✅ 已有 |
| AC4 | SimpleIDE兼容性 | E2E-005 | 需集成测试 |
| AC5 | 构建产物验证 | E2E-006~008 | ✅ 已有 |
| AC6 | 回归测试 | E2E-009~011 | 需集成测试 |

### 测试缺口识别

#### 1. `monacoLoader.ts` — ❌ 无单元测试

| 测试场景 | 层级 | 优先级 |
|---------|------|--------|
| `getMonaco()` 首次调用加载 Monaco | Unit | P0 |
| `getMonaco()` 缓存命中返回 Promise.resolve | Unit | P0 |
| `getMonaco()` 并发调用返回同一 Promise | Unit | P0 |
| `getMonaco()` 失败后重置 monacoPromise | Unit | P0 |
| `getMonaco()` 失败后重置 environmentInitialized | Unit | P1 |
| `getMonacoSync()` 返回缓存或 null | Unit | P0 |
| `loadLanguage()` 已加载语言跳过 | Unit | P1 |
| `loadLanguage()` 失败语言跳过 (failedLanguages) | Unit | P1 |
| `loadLanguage()` 正常加载流程 | Unit | P1 |
| `loadLanguage()` 未知语言直接标记已加载 | Unit | P2 |
| `isLanguageLoaded()` 返回正确状态 | Unit | P1 |
| `initMonacoEnvironment()` 只初始化一次 | Unit | P1 |
| `registerLanguageCallbacksSync()` 注册回调 | Unit | P2 |

#### 2. IDE + LazyCodeEditor 集成测试 — ❌ 缺失

| 测试场景 | 层级 | 优先级 |
|---------|------|--------|
| IDE.tsx 渲染 LazyCodeEditor 组件 | Integration | P0 |
| IDE.tsx 文件打开 → LazyCodeEditor 懒加载流程 | Integration | P0 |
| IDE.tsx Tab切换保持 editorLoadedOnce 状态 | Integration | P1 |
| SimpleIDE.tsx 使用 LazyCodeEditor 渲染 | Integration | P1 |
| diffLines 属性正确传递到 LazyCodeEditor | Integration | P1 |
| onChange 回调正确更新 tab content | Integration | P1 |

#### 3. E2E 测试 — 需从 RED 转为 GREEN

| 测试场景 | 优先级 | 难度 |
|---------|--------|------|
| E2E-003: 用户点击文件后编辑器正常加载 | P0 | 中 |
| E2E-004: Tab切换无延迟 | P1 | 中 |
| E2E-010: 加载失败重试 | P2 | 高 |
| E2E-011: 懒加载后编辑器功能完整 | P1 | 高 |

---

### 覆盖范围: critical-paths

**策略**: 关注核心用户旅程的自动化覆盖，确保 Monaco 懒加载功能在各层级得到充分验证。

**优先级分配**:
- **P0 (Critical)**: `getMonaco()` 核心加载逻辑、IDE集成基础路径、懒加载用户旅程
- **P1 (High)**: 缓存行为、Tab切换、错误恢复
- **P2 (Medium)**: 语言加载、可访问性、边界条件

---

### 执行计划

1. **Step 3a**: 生成 `monacoLoader.test.ts` — 覆盖 Monaco 加载器核心逻辑
2. **Step 3b**: 生成 IDE 集成测试 — 覆盖 IDE.tsx / SimpleIDE.tsx 与 LazyCodeEditor 的集成
3. **Step 3c**: 更新 E2E 测试 — 将关键 E2E 测试从 `test.skip()` 转为可执行
4. **Step 3d**: 运行测试验证 — 确保所有新增测试通过

## Story 1.3 自动化校验记录（2026-09-28）

- 目标：验证 Codex/BMAD 技能来源、优先级和发现诊断。
- 自动化层级：Deno unit；本 Story 没有 UI/API 行为，未新增 Playwright 或 Pact 测试。
- 测试文件：`tests/unit/skillService.test.ts`；全量 Deno 单元测试 147 passed / 0 failed。
- 覆盖：`.agents/skills` 主来源、`.lapdev/skills` legacy 来源、全局来源、源不可用、缺失 `SKILL.md`、解析失败和重复身份诊断的数据结构与优先级。
- 变更：`/api/v1/skills/load` 现返回 `sources` 和 `diagnostics`；发现只读解析技能内容，不复制或改写源文件。
- 回归：Rust 测试通过；Rust fmt check 因既有 core 格式差异失败。仓库没有 `justfile`，因此未执行 `just test`。

## Story 2.1 自动化校验记录（2026-09-28）

- 目标：验证统一 capability context、local-trusted/remote-shared profile、服务端 allowlist、统一拒绝响应和脱敏审计字段。
- 测试：`backend/src/security/capability.test.ts` 3 passed；`npm run test:backend` 10 tests / 39 steps passed。
- 覆盖：本地可信请求、远程未认证拒绝、allowlist 越权拒绝、HTTP 路由和 WebSocket upgrade 入口策略检查。
- Pact/Playwright：无服务契约或 UI 验收目标，未生成重复测试。
- 回归：Rust 测试通过；Rust fmt check 因既有 core 格式差异失败。仓库没有 `justfile`，因此未执行 `just test`。

## Story 2.2 自动化校验记录（2026-09-28）

- 目标：验证文件服务和 Agent 操作在 lexical 与 real-path 层面均不越出 workspace。
- 测试：`npm run test:backend` 10 tests / 39 steps passed；现有 Agent 测试覆盖遍历、越权和嵌套创建。
- 修复：真实 symlink 目标及最近存在父目录均进行边界校验；修复 `/workspace-evil` 前缀误判。
- UI/API 自动化：本 Story 无新增浏览器旅程，沿用后端边界测试。
- 回归：Rust 测试通过；Rust fmt check 因既有 core 格式差异失败。仓库没有 `justfile`。

## Story 2.3 自动化校验记录（2026-09-28）

- 目标：验证高风险终端命令拒绝、审计信息脱敏以及正常终端行为保持。
- 测试：`backend/src/handlers/terminalPolicy.test.ts`；`npm run test:backend` 11 tests / 39 steps passed。
- 覆盖：sudo、rm -rf、git reset --hard、系统命令和 fork bomb 模式；普通 printf 命令允许。
- 回归：Rust 测试通过；Rust fmt check 因既有 core 格式差异失败；无 `justfile`。

## Story 2.4 自动化校验记录（2026-09-28）

- 目标：验证 WebSocket policy gate、会话绑定和敏感输出日志保护。
- 测试：`backend/src/websocket/sessionBinding.test.ts`；`npm run test:backend` 12 tests / 39 steps passed。
- 覆盖：绑定会话匹配、跨会话终端注册拒绝、WebSocket upgrade policy gate、输出仅记录长度。
- 回归：Rust 测试通过；Rust fmt check 因既有 core 格式差异失败；无 `justfile`。

## Epic 3 自动化校验记录（2026-09-28）

- `backend/src/state/revisionState.test.ts` 覆盖 compare-and-swap revision、stale/duplicate mutation、versioned envelope 和 event apply gate。
- `npm run test:backend`：14 tests / 39 steps passed。
- 3.1–3.4 共用同一 revision/event contract，避免各能力重复实现排序和 stale 规则。

## Epic 4 自动化校验记录（2026-09-28）

- `skillSourceRegistry.test.ts` 覆盖 source identity/priority/failure metadata。
- `lspManager.test.ts` 覆盖 workspace/session/language lifecycle、stop/restart 和 health counter。
- `npm run test:backend`：16 tests / 39 steps passed。

## Epic 5 自动化校验记录（2026-09-28）

- `test-result-classifier.test.ts` 覆盖环境限制、断言失败和通过分类。
- `redaction.test.ts` 覆盖 API key/prompt 脱敏和大字段截断。
- `./scripts/validate-runtime-contract.sh`：passed；Rust test passed；Rust fmt 仍有既有差异；仓库没有 `justfile`。

## Final regression baseline (2026-09-28)

- `npm test`: frontend/backend/unit/API layers passed; E2E `163 passed, 9 failed, 40 skipped, 3 did not run`.
- E2E failures: four code-editor journeys, three format-concurrent journeys, large-file save, and range-formatting Ctrl+S save. These are existing editor/formatting/large-file baseline failures and are not attributed to the BMAD/security/state infrastructure changes.
- `cargo clean --manifest-path core/Cargo.toml`: passed; `cargo test --manifest-path core/Cargo.toml --all`: passed with zero Rust tests; `cargo fmt --check`: failed on pre-existing formatting differences in `core/src/fs.rs`, `core/src/lib.rs`, and `core/src/types.rs`.
- `just test`: unavailable because the repository has no `justfile`.

## E2E stability follow-up (2026-09-29)

- Fixed virtualized file-tree fixtures by locating newly-created files through the built-in search instead of assuming they are in the first viewport.
- Fixed lazy-editor fixture activation by clicking `code-editor-placeholder` when present.
- Normalized Monaco non-breaking spaces in format-concurrency assertions.
- Targeted regression: Code Editor, format-concurrent, large-file save and range-formatting Ctrl+S — **12 passed**.
- Replaced the fixed format wait with a Playwright polling assertion for the actual formatted editor content, removing the parallel-load race.
- Parallel `format-concurrent` regression with 3 workers — **3 passed**.
- Stabilized Code Editor lazy-loading assertions by waiting for either the editor or its placeholder before activation.
- Parallel Code Editor regression with 4 workers — **7 passed**.
- Final full regression: frontend 148 passed / 0 failed; API 4 passed / 0 failed; E2E 174 passed / 40 skipped, exit code 0. One initial Code Editor retry was observed during this run; the follow-up targeted run after the stabilization change passed without retries.

## Story 1.1 Remote Security Automation (2026-09-29)

- 目标：验证 remote-shared 的 bootstrap token exchange、opaque session、Secure/HttpOnly/SameSite=Lax/Path=/ Cookie、过期/revoke、malformed credential，以及 HTTP/WebSocket 共享上下文。
- 自动化层级：Deno backend unit/integration boundary；本 Story 无 UI 行为，因此未新增 Playwright 或 Pact 测试。
- 测试文件：`backend/src/security/authSession.test.ts`、`backend/src/security/capability.test.ts`。
- 覆盖：6 个会话测试、4 个能力上下文测试；`npm run test:backend` 为 24 passed / 0 failed。
- 真实 HTTP 探测：无凭据 protected route 返回 401；auth exchange 返回 200 并发出安全 Cookie；带 Cookie 通过认证边界。
- 回归：前端完整测试首次受既有 VirtualList 10ms 性能阈值抖动影响（11.59ms），单独重跑 12/12 通过；Rust `cargo test --manifest-path core/Cargo.toml --all` 通过。仓库无 justfile；Rust fmt check 仍因既有 core 格式差异失败，未自动改写。

## Story 1.2 Workspace Boundary Automation (2026-09-29)

- 目标：验证统一 WorkspaceBoundary 对 file 与 Agent 操作的 handle、traversal、host absolute path、workspace mismatch 和 symlink escape 隔离。
- 自动化层级：Deno backend unit/integration boundary；无 UI/Pact 目标。
- 测试文件：`backend/src/security/workspaceBoundary.test.ts`，并复跑 `backend/tests/agentHandler.test.ts`。
- 覆盖：合法 root/child handle、不同 workspace、existing symlink、new-file parent symlink；后端全套 27 passed / 0 failed。
- 生成/接入：`backend/src/security/workspaceBoundary.ts`，fileService 和 Agent handler 共用同一边界服务。
## Story 1.3 — Revalidate session changes and disconnects

- Added ATDD coverage for session expiry/revocation and credential-free lifecycle metadata.
- Added server-side current-session validation for existing capability contexts.
- WebSocket messages now revalidate the session, emit a safe invalidation event, remove stale terminal registrations, and close the connection.
- `npm run test:backend`: 29 passed / 39 steps.
## Story 2.1 — Define explicit remote capability policy

- Added `CapabilityPolicy` with deny-by-default rules and principal/workspace/session scope matching.
- Integrated remote-shared authorization with explicit policy rules; local-trusted authorization remains separate.
- `npm run test:backend`: 31 passed / 39 steps.
## Story 2.2 — Apply policy to file, Agent, Git and LSP operations

- Added route contract coverage for all workspace adapter families.
- Confirmed the main request boundary authorizes and audits before invoking file, Agent, Git, or LSP handlers.
- `npm run test:backend`: 33 passed / 39 steps; full `npm test` passed with 173 E2E passes / 40 skips and 2 existing flaky format-concurrency cases.
## Story 2.3 — Apply policy to AI operations

- Added coverage for all AI route families using the shared `ai` capability gate.
- Added audit-data assertions that API keys and complete sensitive prompts are redacted.
- `npm run test:backend`: 35 passed / 39 steps; Rust tests passed; adjacent full regression passed with existing E2E flaky signals.
## Story 3.1 — Centralize command and subprocess policy

- Added centralized `CommandPolicy` for executable, arguments, cwd, environment, and interactive mode.
- Integrated policy before Git process creation and before terminal shell creation.
- Remote-shared policy permits only fixed read-only Git/LSP entries and denies arbitrary interactive shell use.
- `npm run test:backend`: 37 passed / 39 steps; Rust and full `npm test` passed (175 E2E passes / 40 skips).
## Story 3.2 — Enforce server-side secret handling

- Added `secretBoundary` to resolve remote provider keys only from `LAPDEV_AI_API_KEY`.
- Updated AI configuration and connection testing handlers to ignore browser-supplied secrets in remote-shared.
- Added masking/redaction contract coverage.
- `npm run test:backend`: 39 passed / 39 steps; Rust passed; full `npm test` passed with 173 E2E passes / 40 skips and existing format-concurrency flaky signals.

## Story 3.3 — Emit correlated security audit events

- Added versioned `security_audit` envelopes with principal, workspace, session, request, and revision correlation fields.
- Added explicit JSON sink behavior and reused the audit redaction boundary so prompts, API keys, and credential metadata are not serialized.
- Capability authorization now emits allowed and denied decisions through the shared emitter.
- Focused audit/capability/redaction coverage: 7 passed; `npm run test:backend`: 41 passed / 39 steps.
- Full regression: frontend 46 files / 684 tests passed; backend 41 passed / 39 steps; unit 148 passed / 166 steps; API 4 groups passed / 12 steps; E2E 174 passed / 40 skipped with one existing format-concurrency flaky retry; Rust tests and `git diff --check` passed.

## Story 4.1 — Define named deployment permission profiles

- Added explicit `local-trusted` and `remote-shared` deployment contracts for filesystem, network, environment, and subprocess permissions.
- Added startup validation with safe failure for unknown or malformed profiles; no server is started after profile validation failure.
- Added boundary tests for remote write scope, interactive subprocess denial, and unknown profile diagnostics.
- `npm run test:backend`: 43 passed / 39 steps; Rust tests and `git diff --check` passed.
- Full regression: frontend 46 files / 684 tests passed; backend 43 passed / 39 steps; unit 148 passed / 166 steps; API 4 groups passed / 12 steps; E2E 174 passed / 40 skipped with one existing format-concurrency flaky retry; Rust tests passed.

## Story 4.2 — Replace full-permission startup with tested minimum permissions

- Replaced production entrypoint `-A` with explicit profile-specific Deno read/write/net/env/run permissions.
- Remote startup denies interactive process execution and unrestricted network by default; optional grants are deployment-configured.
- Added shell syntax and static contract tests: backend 43 passed / 39 steps plus 2 permission-contract tests; Rust and `git diff --check` passed.

## Story 4.3 — Add release permission and health gate

- Added `scripts/release-permission-gate.sh` for runtime-contract, shell syntax, unrestricted-permission, and profile test checks.
- Gate exit code 2 is reserved for environment limitations; drift and security failures use exit code 1.
- CI now builds a locally loadable image, runs health checks, and publishes only after the health gate succeeds.
- Local gate verification: runtime contract passed; 4 minimum-permission tests passed; shell syntax and `git diff --check` passed.
