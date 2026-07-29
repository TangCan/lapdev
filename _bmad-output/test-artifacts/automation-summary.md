---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-identify-targets']
lastStep: 'step-02-identify-targets'
lastSaved: '2026-07-29'
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