---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests']
lastStep: 'step-04-generate-tests'
lastSaved: '2026-07-27'
storyId: 'EPI1.01'
storyKey: 'epi1-01-react-19-dependency-upgrade'
storyFile: 'implementation_artifacts/epi1-01-react-19-dependency-upgrade.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-epi1-01-react-19-dependency-upgrade.md'
generatedTestFiles:
  - 'scripts/verify-react-19-upgrade.sh'
  - 'tests/e2e/react-19-smoke.spec.ts'
inputDocuments:
  - 'docs/epics.md'
  - 'docs/architecture.md'
  - 'frontend/package.json'
  - 'playwright.config.ts'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/test-quality.md'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/component-tdd.md'
  - '.trae/skills/bmad-testarch-atdd/resources/knowledge/test-healing-patterns.md'
---

# ATDD Checklist - EPI1.01: React 19 依赖升级

## Story 信息

| 属性 | 值 |
|------|-----|
| **Story ID** | EPI1.01 |
| **Story Key** | `epi1-01-react-19-dependency-upgrade` |
| **Story 文件** | [implementation_artifacts/epi1-01-react-19-dependency-upgrade.md](file:///home/richard/richard/2026/2026/pvm_2/lapdev/implementation_artifacts/epi1-01-react-19-dependency-upgrade.md) |
| **状态** | ready-for-dev |

## 技术栈检测

| 检测项 | 结果 |
|--------|------|
| **stack_type** | `fullstack` |
| **Frontend** | React 18.3.1 + Vite 6 + TypeScript 5.5 |
| **Backend** | Deno |
| **单元测试框架** | Vitest 2.0.5 |
| **E2E 测试框架** | Playwright 1.44+ |

## 验收标准分析

### AC1: React 19 升级后构建成功

**Given** 当前项目使用 React 18.3.1
**When** 升级 React 和 React DOM 到 19.x 版本
**Then** 项目构建成功，无 TypeScript 类型错误
**And** 所有现有测试通过
**And** 前端应用正常运行

**测试类型**: 构建/类型检查验证
**优先级**: P0

### AC2: Vite 构建成功

**Given** React 19 已升级
**When** 运行 `npm run build`
**Then** Vite 构建成功，bundle 输出正常
**And** 无 React 相关的 console 警告

**测试类型**: 构建验证
**优先级**: P0

### AC3: 所有单元测试通过

**Given** React 19 已升级
**When** 运行 `npm test`
**Then** 所有 161 个前端单元测试通过
**And** 无因 React 版本变化导致的测试失败

**测试类型**: 回归测试
**优先级**: P0

## 测试策略

### 推荐方案: 构建验证脚本

由于 EPI1.01 是一个 **配置/依赖升级型 Story**，主要验收方式是：

1. **构建验证脚本** (`scripts/verify-react-19-upgrade.sh`)
   - 类型检查 (`npx tsc --noEmit`)
   - 构建验证 (`npm run build`)
   - 单元测试回归 (`npm test`)
   - 依赖版本检查

2. **可选**: 基础 E2E 冒烟测试
   - 验证应用启动正常
   - 验证主要 UI 组件渲染

### 测试文件规划

| 文件 | 类型 | 状态 |
|------|------|------|
| `scripts/verify-react-19-upgrade.sh` | 构建验证脚本 | 待创建 |
| `tests/e2e/react-19-smoke.spec.ts` | E2E 冒烟测试（可选） | 待创建 |

## 风险评估

| 风险项 | 等级 | 缓解措施 |
|--------|------|---------|
| TypeScript 类型错误 | 中 | 升级 @types/react 到 19.x |
| 第三方库兼容性 | 中 | 验证 monaco-editor、lucide-react、react-router-dom 兼容性 |
| useId 格式变化 | 低 | 检查 CSS 选择器和测试依赖 |
| ESLint 规则变化 | 低 | 更新 eslint-plugin-react-hooks 到 v6 |

## 下一步

- [ ] 加载 `steps-c/step-02-generation-mode.md` 生成测试脚手架