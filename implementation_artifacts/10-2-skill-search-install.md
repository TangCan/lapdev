# Story 10.2: Skill搜索与安装

## 📋 Story基础信息

| 字段 | 值 |
|------|-----|
| **Story ID** | 10.2 |
| **Story Key** | 10-2-skill-search-install |
| **所属Epic** | Epic 10: Skill市场 |
| **状态** | ready-for-dev |
| **创建日期** | 2026-07-13 |
| **需求覆盖** | FR-027, UX-DR5 |

---

## 🎯 用户故事

**As a** 个人开发者,  
**I want** 在Skill市场中搜索和安装新Skill,  
**So that** 我可以扩展Lapdev的功能。

---

## ✅ 验收标准

### CLI验收标准

#### 场景1: CLI Skill搜索
**Given** 用户执行 `lapdev skill search <keyword>` 命令  
**When** 输入关键词  
**Then** 显示匹配的Skill列表，包含名称、描述、作者和评分

#### 场景2: CLI Skill详情查看
**Given** 用户执行 `lapdev skill show <name>` 命令  
**Then** 显示Skill详情，包含完整描述、使用说明和版本历史

#### 场景3: CLI Skill更新
**Given** 用户执行 `lapdev skill update <name>` 命令  
**When** Skill有新版本可用  
**Then** Skill被更新到最新版本  
**And** 显示更新成功提示

### 前端UI验收标准

#### 场景4: UI Skill市场搜索
**Given** 用户打开Skill市场界面  
**When** 在搜索框输入关键词  
**Then** 显示匹配的Skill列表，包含名称、描述、作者和评分

#### 场景5: UI Skill详情查看
**Given** 用户在Skill列表中点击某个Skill  
**Then** 显示Skill详情页面，包含完整描述、使用说明和版本历史

#### 场景6: UI Skill安装
**Given** 用户点击"安装"按钮  
**When** 确认安装  
**Then** Skill被下载并安装到本地  
**And** 显示安装成功提示

#### 场景7: UI版本更新提示
**Given** 用户已安装某个Skill  
**When** Skill有新版本可用  
**Then** 显示更新提示和"更新"按钮

---

## 🏗️ 技术架构要求

### 技术栈
- **语言**: TypeScript (Deno 后端) + TypeScript (React 前端)
- **框架**: Deno CLI, React 18 + Vite
- **存储**: Deno KV（用户认证信息、已安装Skill元数据）
- **样式**: Tailwind CSS 3

### 文件结构
```
backend/
├── src/
│   ├── cli/
│   │   └── skillCli.ts           # 新增 search、show、update 命令
│   ├── services/
│   │   ├── skillMarketService.ts # 新增 Skill市场服务（搜索API）
│   ├── types/
│   │   └── skill.ts              # 扩展类型定义（添加评分、版本历史等）

lapdev-web/
├── src/
│   ├── components/
│   │   └── skill/
│   │       ├── SkillMarket.tsx   # 新增 Skill市场主界面
│   │       ├── SkillSearch.tsx   # 新增 搜索组件
│   │       ├── SkillCard.tsx     # 新增 Skill卡片组件
│   │       └── SkillDetail.tsx   # 新增 Skill详情弹窗
```

### Skill市场API设计
```typescript
interface SkillMarketEntry {
  name: string;
  version: string;
  latestVersion: string;
  description: string;
  author: string;
  tags: string[];
  rating: number;
  downloads: number;
  updatedAt: string;
  downloadUrl: string;
}

interface SkillSearchResult {
  skills: SkillMarketEntry[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 📚 依赖与前置条件

### 依赖的故事
- **Story 4.1**: Skill开发与加载（已完成）
  - 复用 SkillService 和 Skill 类型定义
  - 复用 Skill 文件解析逻辑
- **Story 10.1**: Skill发布命令（已完成）
  - 复用用户认证模块（SkillPublishService）
  - 复用 API Key 管理逻辑

### 外部依赖
- 无新增外部依赖

---

## 🔧 开发指南

### 关键实现要点

1. **Skill市场服务**
   - 实现搜索API调用（mock实现，连接到模拟市场）
   - 支持关键词搜索、标签过滤
   - 返回Skill列表包含评分、下载量、最新版本等信息

2. **CLI搜索命令**
   ```typescript
   search(query: string, options?: { tags?: string[]; limit?: number }): Promise<void>
   show(skillName: string): Promise<void>
   update(skillName: string): Promise<void>
   ```
   - `lapdev skill search <keyword>` - 搜索Skill
   - `lapdev skill show <name>` - 查看Skill详情
   - `lapdev skill update <name>` - 更新Skill到最新版本

   **重要**: 下载操作必须使用 `fetch()` API，**禁止使用已弃用的 `Deno.run()`**。参考 `skillMarketService.ts` 的实现。

3. **前端Skill市场界面**
   - 搜索框 + 标签筛选
   - Skill卡片列表展示
   - Skill详情弹窗
   - 安装/更新按钮

4. **版本更新检测**
   - 对比本地已安装版本与市场最新版本
   - 显示更新提示
   - 支持一键更新

### 安全考虑
- 路径遍历防护（参考Story 10.1实现）
- API Key保护（仅内存存储，不打印到日志）
- 请求限流（防止滥用搜索接口）
- 文件内容验证（防止恶意Skill文件）

---

## 🧪 测试要求

### 单元测试
- Skill市场服务测试（搜索、详情获取）
- CLI命令参数解析测试
- 版本更新检测测试

### E2E测试
- Skill搜索流程
- Skill安装流程
- 版本更新流程

---

## 📝 开发笔记

### Previous Story Intelligence (Story 10.1 学习经验)

#### 关键修复经验
1. **async/await 调用** - 所有异步方法必须正确使用 await，包括 `install`、`publish`、`login`、`logout` 方法
2. **参数解析** - 使用 `args.filter(arg => !arg.startsWith('-'))[0]` 替代 `args.find(...)` 来处理选项参数
3. **路径遍历防护** - 必须实现路径规范化和 `../` 模式检测，参考 `skillPublishService.ts` 中的 `normalizePath` 和 `isValidFilePath` 方法
4. **请求限流** - 使用内存计数器实现限流，参考 `skillPublishService.ts` 中的 `checkRateLimit` 方法
5. **Deno KV 兼容性** - 添加 `USERPROFILE` 环境变量支持以兼容 Windows 系统

#### 代码模式参考
- CLI 命令使用统一的错误处理模式：`console.error` 输出错误信息和建议
- 服务层返回统一的结果对象：`{ success: boolean, message: string, error?: string, suggestion?: string }`
- 使用 try/catch 包裹文件系统操作，提供友好的错误提示

#### 重要警告
- **Deno.run 已弃用** - 现有 `skillCli.ts` 中的 `install` 方法使用了 `Deno.run({cmd: ['curl', ...]})`，这在现代 Deno 中已弃用，应改用 `fetch()` API
- **API Key 保护** - API Key 应仅内存存储，不打印到日志

### 与之前故事的关联
- 参考 Story 10.1 的用户认证模块
- 复用 `skillCli.ts` 的命令模式
- 复用 `skillService.ts` 的 Skill 解析逻辑
- 复用 `types/skill.ts` 的类型定义
- **重构现有 `install` 方法** - 将 `Deno.run(curl)` 改为 `fetch()` API

### 代码审查关注点
- 路径遍历防护
- API Key保护
- 错误处理和用户友好提示
- 前端UI交互完整性

### 实现优先级
1. **P0**: Skill市场服务（mock实现）
2. **P0**: CLI search 命令
3. **P0**: CLI show 命令
4. **P0**: CLI update 命令
5. **P1**: 前端Skill市场界面
6. **P2**: 测试编写

---

## 📅 任务分解

| 任务 | 描述 | 估计工时 |
|------|------|----------|
| 1 | Skill市场服务实现（mock搜索API） | 3小时 |
| 2 | CLI search 命令实现 | 2小时 |
| 3 | CLI show 命令实现 | 2小时 |
| 4 | CLI update 命令实现 | 2小时 |
| 5 | 前端Skill市场界面 | 4小时 |
| 6 | 测试编写 | 2小时 |

**总估计工时**: 15小时

---

## ⚠️ 注意事项

### 已有实现参考
- 后端 `skillCli.ts` 已有 `install`、`list`、`reload`、`login`、`logout`、`publish` 命令
- 后端 `skillService.ts` 已有 Skill 加载和解析逻辑
- 后端 `skillPublishService.ts` 已有用户认证逻辑
- Skill 类型定义在 `types/skill.ts`
- 前端使用 React + Tailwind CSS

### 需要新增的文件
- `skillMarketService.ts` - Skill市场服务
- `SkillMarket.tsx` - Skill市场主界面组件
- `SkillSearch.tsx` - 搜索组件
- `SkillCard.tsx` - Skill卡片组件
- `SkillDetail.tsx` - Skill详情弹窗组件

### 需要修改的文件
- `skillCli.ts` - 添加 `search`、`show`、`update` 命令
- `skill.ts` - 扩展类型定义（添加评分、版本历史等）

---

## 📁 File List

**新增文件:**
- `backend/src/services/skillMarketService.ts` - Skill市场服务（mock实现）
- `tests/acceptance/10-2-skill-search-install.test.ts` - ATDD验收测试（6个测试用例）
- `frontend/src/components/SkillMarket/SkillMarket.tsx` - Skill市场主界面组件
- `frontend/src/components/SkillMarket/SkillSearch.tsx` - 搜索组件
- `frontend/src/components/SkillMarket/SkillCard.tsx` - Skill卡片组件
- `frontend/src/components/SkillMarket/SkillDetail.tsx` - Skill详情弹窗组件
- `frontend/src/components/SkillMarket/SkillMarket.css` - Skill市场样式文件

**修改文件:**
- `backend/src/cli/skillCli.ts` - 添加 search、show、update 命令，更新帮助信息
- `backend/src/types/skill.ts` - 扩展类型定义（SkillMarketEntry、SkillSearchResult、SkillDetailResult、SkillInstallResult）

---

## 🔗 相关文档

- [epics.md](file:///home/richard/richard/2026/2026/pvm_2/lapdev/docs/epics.md) - Epic分解文档
- [architecture.md](file:///home/richard/richard/2026/2026/pvm_2/lapdev/docs/architecture.md) - 架构设计文档
- [10-1-skill-publish-command.md](file:///home/richard/richard/2026/2026/pvm_2/lapdev/implementation_artifacts/10-1-skill-publish-command.md) - 前一个故事（Skill发布命令）

---

## 🧪 ATDD Artifacts

- **Checklist:** `_bmad-output/test-artifacts/atdd-checklist-10-2-skill-search-install.md`
- **Acceptance Tests:** `tests/acceptance/10-2-skill-search-install.test.ts`

**TDD Red Phase:** 6个测试已生成，全部使用 `test.skip()` 标记

---

## 📝 Dev Agent Record

### Implementation Plan

**技术栈:**
- 后端: TypeScript (Deno)
- 前端: React 18 + Vite + TypeScript

**架构模式:**
- 服务层模式: SkillMarketService 提供搜索、详情、安装、更新功能
- CLI命令模式: 扩展现有 skillCli.ts，添加 search、show、update 命令
- 前端组件: 使用 React hooks (useState, useEffect) 管理状态

**关键决策:**
1. 使用 mock 数据实现 SkillMarketService，便于开发和测试
2. 使用 fetch() API 替代已弃用的 Deno.run() 进行文件下载
3. 前端类型定义独立于后端，避免跨项目依赖问题

### Debug Log

- **修复1**: `Deno.existsSync` 在现代 Deno 中已移除，改用 `try { Deno.statSync(path) } catch { return false }` 模式
- **修复2**: 重构 `install` 方法，将 `Deno.run({cmd: ['curl', ...]})` 替换为 `fetch()` API
- **修复3**: 修复前端类型定义，恢复原有的 Skill、AIRequest 等接口并添加新的 SkillMarketEntry 接口

### Completion Notes

✅ **所有任务已完成:**
1. ✅ Skill市场服务实现（mock搜索API）
2. ✅ CLI search 命令实现
3. ✅ CLI show 命令实现
4. ✅ CLI update 命令实现
5. ✅ 前端Skill市场界面
6. ✅ 测试编写

✅ **所有测试通过:**
- 6/6 验收测试通过
- 121/121 所有后端测试通过

✅ **代码审查关注点:**
- 路径遍历防护: ✅ 通过 SkillPublishService 复用
- API Key保护: ✅ 通过 SkillPublishService 复用
- 错误处理: ✅ 用户友好提示
- Deno.run 弃用: ✅ 已重构为 fetch()

---

## ✅ 完成状态

- **Status**: review
- **Completion Note**: Story实现已完成，所有功能已实现并通过测试
- **ATDD Red Phase**: ✅ 已完成，6个验收测试已激活并通过
- **测试结果**: 121/121 通过 ✅
- **实现内容**:
  - SkillMarketService 服务（mock实现）
  - CLI search、show、update 命令
  - 前端Skill市场界面（SkillMarket、SkillSearch、SkillCard、SkillDetail组件）
  - 类型定义扩展
  - `install` 方法重构（fetch替代Deno.run）