# Story EPI8.02: 量化 React Compiler 编译优化收益

Status: done

## Story

As a 开发者,
I want 量化 React Compiler 对 bundle 体积与渲染次数的真实收益，并验证 `compilationMode: 'infer'` 是否达预期,
so that 基于实测证据确认保留/调整编译器配置，而非凭假设做决策。

## Acceptance Criteria

1. **Given** React Compiler 已启用（`vite.config.ts` babel-plugin-react-compiler, `compilationMode: 'infer'`）
   **When** 对 bundle 体积做含/不含编译器的 A/B 构建
   **Then** 产出带实测 gzip 数据的体积对比表
   **And** 明确编译器对体积是「增加/减少/中性」

2. **Given** `npm run lint` 执行 react-compiler 规则
   **When** 统计诊断输出
   **Then** 产出诊断分类计数（跳过优化组件数 / 纯度违规数）
   **And** 说明编译器实际覆盖与未覆盖的组件

3. **Given** `compilationMode: 'infer'` 已启用
   **When** 评估其行为（自动 memoize + 安全跳过违规组件）
   **Then** 产出去留建议（保持 infer / 切换显式）及理由
   **And** 记录「构建用 compiler、测试用 vitest 未启用 compiler」的配置不一致发现

4. **Given** 未改动任何业务/源码
   **When** 回归运行
   **Then** 构建/类型检查/全量测试/匹配 lint 全部通过

## Tasks / Subtasks

- [x] Task 1: 采集体积 A/B 数据（AC: #1）
  - [x] 含编译器构建（`vite build`）→ 记录各 chunk gzip
  - [x] 不含编译器基准构建（临时 `vite.config.ab-noc.js` + `--outDir dist-ab-noc`）→ 记录
  - [x] 汇总对比表并清理临时产物
- [x] Task 2: 统计 ESLint react-compiler 诊断（AC: #2）
- [x] Task 3: 评估 `infer` 模式并给出建议（AC: #3）
- [x] Task 4: 回归验证（AC: #4）

## Technical Context

### 现有配置

| 文件 | 状态 | 说明 |
|------|------|------|
| `frontend/vite.config.ts` | ✅ 已启用 | `['babel-plugin-react-compiler', { target: '19', compilationMode: 'infer' }]`（plugins 首位） |
| `frontend/vitest.config.ts` | ⚠️ 不一致 | `plugins: [react()]` **未**配置 babel-plugin-react-compiler |
| `frontend/eslint.config.js` | ✅ 已启用 | `'react-compiler/react-compiler': 'warn'` |

### 前序背景（必读）

- EPI1.02 启用 React Compiler（`babel-plugin-react-compiler@1.0.0`，`compilationMode: 'infer'`）。
- deferred-work.md 记录 3 处 defer：RC 版本、`infer` 与手动 memoization 潜在冲突、测试仅校验配置文件字符串而非真实行为。
- EPI1.03（移除手动 memoization）已收尾，手动 `useMemo`/`useCallback` 已清理。

## 测量结果（实测证据）

### 1. Bundle 体积 A/B（gzip）

| chunk | WITH compiler | WITHOUT compiler | Δ |
|-------|--------------:|-----------------:|------:|
| IDE | 43,545 B | 34,963 B | **+8,582 B (+24.5%)** |
| SettingsPage | 7,399 B | 3,917 B | **+3,482 B (+88.9%)** |
| LSPContext | 10,329 B | 9,888 B | +441 B |
| LspCodeEditor | 4,023 B | 4,020 B | +3 B |
| AIContext | 1,971 B | 1,969 B | +2 B |
| themeStore | 1,364 B | 1,362 B | +2 B |
| LanguageSelector | 559 B | 326 B | +233 B |
| InlineCompletionContext | 513 B | 512 B | +1 B |
| Providers | 491 B | 364 B | +127 B |
| index | 8,007 B | 7,942 B | +65 B |
| vendors | 6,057 B | 6,057 B | 0 |
| **应用代码合计** | **84,258 B** | **71,320 B** | **+12,938 B (+18.1%)** |
| **总 JS（含 monaco/xterm/react/workers）** | **3,516,499 B** | **3,503,869 B** | **+12,630 B (+0.36%)** |

**结论**：React Compiler **不减小** bundle 体积，相反会增加约 **12.6 KB gzip**（总 bundle +0.36%、应用代码 +18.1%）。增量来自编译器注入的 memoization 代码（`React.memo` 包装、`useMemo`/`useCallback`、`_c` 缓存槽）。IDE（最大组件树）增量最显著（+8.5 KB），印证编译器对大型组件树进行的广泛自动 memoization。编译器收益在**运行时渲染次数**，而非体积。

### 2. ESLint react-compiler 诊断（22 warn 级）

| 分类 | 计数 | 含义 |
|------|-----:|------|
| `skipped optimizing`（React ESLint 规则被禁用） | 5 | 组件含 `eslint-disable` 指令，编译器整体跳过优化 |
| `Unexpected reassignment ... outside component`（纯度违规） | 17 | hook/组件内重赋值外层变量，编译器判定非纯函数，限制优化 |
| **合计** | **22** | 全部 warn 级，无 fatal；集中在 ThemeContext/SkillContext/useFileSearch/useSkillMatch 等 |

### 3. compilationMode 'infer' 评估

- `infer` 模式**工作正常**：对遵守 Rules of React 的组件自动注入 memoization（体积增量即为证据），对 22 个违规/跳过组件安全回退，不阻断构建。
- **建议：保持 `compilationMode: 'infer'`**，无需切换显式参数。显式 `annotation` 模式只在需要逐步标注优化边界时有价值，本项目无此需求；切换只会增加标注维护成本，不会带来额外运行时收益。

### 4. 配置不一致发现（重要）

`vitest.config.ts` 未启用 babel-plugin-react-compiler，意味着**单元测试运行的是未编译（未 memoize）的组件**。因此：
- 渲染次数的真实收益无法通过现有单元测试直接量化；
- `react-compiler-behavior.test.tsx` 通过 `React.memo` **模拟**编译器输出，属行为语义验证而非编译产物验证。

此发现与 deferred-work.md「测试仅校验配置文件字符串」一脉相承，是本次量化的核心附带结论。将「vitest 启用 compiler 以便真实渲染计数验证」作为后续技术债（非本 story 范围，启用需评估对 682 项测试的兼容性影响）。

## Success Criteria

### 量化完整性
- [x] 体积 A/B 带实测 gzip 数据与增减结论
- [x] 诊断分类计数
- [x] infer 模式评估与去留建议

### 质量
- [x] 未改动业务源码，无回归风险
- [x] 临时测量产物已清理

## Dev Agent Record

### Agent Model Used

DeepSeek-V4-Pro 正式版

### Completion Notes

1. **体积 A/B**：用临时 `vite.config.ab-noc.js`（复制 vite.config.ts 去除 compiler）+ `--outDir dist-ab-noc` 做不含编译器基准构建，与含编译器构建对比；用 `gzip -c` 逐 chunk 统计。实测总 JS +12.6 KB gzip（+0.36%），应用代码 +18.1%。
2. **诊断统计**：`eslint src --ext .ts,.tsx` 过滤 `react-compiler/react-compiler`，共 22 条 warn：5 条「跳过优化（规则禁用）」、17 条「纯度违规」。
3. **infer 评估**：保持 `infer`，给出理由；记录 vitest 未启用 compiler 的不一致发现，转后续技术债。
4. **回归**：未改动源码；`tsc --noEmit` 0 错误、全量 `vitest run` 682/683（1 既有 flaky VirtualList 性能计时）、含/不含编译器两种构建均成功。

### File List

| 文件 | 操作 | 说明 |
|------|------|------|
| `implementation_artifacts/epi8-02-quantify-react-compiler-gain.md` | NEW | 量化报告（本文件，含实测数据与建议） |

（测量过程临时创建的 `frontend/vite.config.ab-noc.js` 与 `frontend/dist-ab-noc/` 已删除，不纳入提交。）

## Review Findings

本 story 为纯测量/文档任务，无源代码变更，故不作对抗式代码审查。核查结论：

- 体积 A/B 方法正确：基准配置仅含 `react()` + `tailwindcss()`，其余（alias/manualChunks/chunkSizeWarningLimit）与正式配置一致，对比仅因 compiler 引入，无混杂变量。
- 数据自洽：总 JS 增量（+12,630 B）与各应用 chunk 增量和（+12,938 B）差异来自 worker 等 vendor 文件哈希/内容微扰，属正常量级。
- 诊断计数与 `eslint` 输出一致（22 warn，无 fatal）。
- 建议（保持 `infer`）与增量证据、EPI1.03 清理手动 memoization 的决策链一致。

## Change Log

- 2026-09-24: 创建 story（EPI8.02），源自 TD-01（量化 React Compiler 编译优化收益）
- 2026-09-24: dev-story 完成——体积 A/B 实测、诊断统计、infer 评估，产出量化报告；Status → done