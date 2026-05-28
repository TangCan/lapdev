# Story 2-2: LSP代码智能

## 基本信息

| 属性 | 值 |
|------|-----|
| **Story ID** | 2-2-lsp-intelligence |
| **所属Epic** | Epic 2: 高级IDE功能 |
| **标题** | LSP代码智能 |
| **状态** | review |
| **优先级** | 高 |
| **估计工时** | 8小时 |
| **关联FR** | FR-011, FR-012, FR-013, FR-014 |

## 用户故事

作为一名开发者，我希望IDE能够提供智能代码补全、代码导航和重构支持，以便提高编码效率和代码质量。

## 需求描述

根据产品需求文档，本Story需要实现以下功能：

### FR-011: 代码补全
- 支持基于语言服务协议(LSP)的智能代码补全
- 支持参数提示和方法签名显示
- 支持自动导入建议

### FR-012: 代码导航
- 支持跳转到定义
- 支持查找引用
- 支持查看类型定义

### FR-013: 代码重构
- 支持重命名符号
- 支持代码格式化
- 支持快速修复建议

### FR-014: 实时诊断
- 实时语法检查和错误提示
- 代码警告和建议
- 支持问题面板显示

## 验收标准

### AC-1: 代码补全功能
- ✅ 在编辑器中输入代码时，自动显示补全建议
- ✅ 支持方法签名提示（悬停或输入参数时显示）
- ✅ 支持自动导入未导入的模块

### AC-2: 代码导航功能
- ✅ 点击符号可跳转到定义位置
- ✅ 右键菜单支持"查找引用"功能
- ✅ 支持查看类型定义

### AC-3: 代码重构功能
- ✅ 支持重命名变量、函数、类等符号
- ✅ 支持按Ctrl+S格式化代码
- ✅ 显示快速修复建议并应用

### AC-4: 实时诊断功能
- ✅ 实时显示语法错误和警告
- ✅ 问题面板显示所有诊断信息
- ✅ 支持点击问题跳转到对应位置

## 任务分解

### ✅ Task 2.2.1: LSP服务集成
**目标**: 集成语言服务协议客户端

**实现内容:**
- 选择并集成LSP客户端库（如vscode-languageserver-protocol）
- 建立与LSP服务器的连接
- 实现基本的LSP协议通信

**验收标准:**
- ✅ 成功连接到LSP服务器
- ✅ 能够发送和接收LSP消息
- ✅ 支持标准LSP协议功能

---

### ✅ Task 2.2.2: 代码补全实现
**目标**: 实现智能代码补全功能

**实现内容:**
- 实现CompletionItemProvider
- 支持参数提示(SignatureHelp)
- 支持自动导入(AutoImport)

**验收标准:**
- ✅ 编辑器输入时显示补全列表
- ✅ 方法调用时显示参数提示
- ✅ 自动导入未导入的模块

---

### ✅ Task 2.2.3: 代码导航实现
**目标**: 实现代码导航功能

**实现内容:**
- 实现Go to Definition
- 实现Find References
- 实现Go to Type Definition

**验收标准:**
- ✅ 支持跳转到定义
- ✅ 支持查找所有引用
- ✅ 支持查看类型定义

---

### ✅ Task 2.2.4: 代码重构实现
**目标**: 实现代码重构功能

**实现内容:**
- 实现Rename功能
- 实现Document Formatting
- 实现Code Actions（快速修复）

**验收标准:**
- ✅ 支持重命名符号
- ✅ 支持格式化代码
- ✅ 支持快速修复建议

---

### ✅ Task 2.2.5: 实时诊断实现
**目标**: 实现实时诊断和问题面板

**实现内容:**
- 接收并显示Diagnostic消息
- 创建问题面板组件
- 实现问题定位和跳转

**验收标准:**
- ✅ 实时显示语法错误
- ✅ 问题面板列出所有诊断
- ✅ 点击问题跳转到对应位置

---

### ✅ Task 2.2.6: 测试与集成
**目标**: 完成测试和集成验证

**实现内容:**
- 编写单元测试
- 编写集成测试
- 验证所有功能正常工作

**验收标准:**
- ✅ 所有单元测试通过
- ✅ 所有集成测试通过
- ✅ 功能正常集成到IDE中

## 技术实现方案

### 技术选型

| 类别 | 技术 | 版本 |
|------|------|------|
| LSP客户端 | vscode-languageserver-protocol | ^3.17.0 |
| LSP服务器 | typescript-language-server | ^3.0.0 |
| 编辑器集成 | Monaco Editor | ^0.55.0 |

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      LSP集成架构                            │
├─────────────────────────────────────────────────────────────┤
│  Monaco Editor                                             │
│  ├── CompletionProvider ──────► LSP Client                │
│  ├── DefinitionProvider ──────► LSP Client                │
│  ├── ReferenceProvider ───────► LSP Client                │
│  ├── RenameProvider ──────────► LSP Client                │
│  ├── DocumentFormatting ──────► LSP Client                │
│  └── DiagnosticCollection ◄─── LSP Client                │
├─────────────────────────────────────────────────────────────┤
│  LSP Client (vscode-languageserver-protocol)              │
│  ├── JSON-RPC通信                                          │
│  ├── 协议序列化/反序列化                                     │
│  └── 连接管理                                              │
├─────────────────────────────────────────────────────────────┤
│  LSP Server (typescript-language-server)                  │
│  ├── TypeScript/JavaScript支持                              │
│  ├── 代码分析和诊断                                         │
│  └── 重构支持                                              │
└─────────────────────────────────────────────────────────────┘
```

### 关键类和方法

#### LSPContext.tsx
- `connectLspServer()` - 连接LSP服务器
- `disconnectLspServer()` - 断开连接
- `sendRequest()` - 发送LSP请求
- `handleNotification()` - 处理LSP通知

#### LspCompletionProvider.ts
- `provideCompletionItems()` - 提供补全建议
- `resolveCompletionItem()` - 解析补全项

#### LspDefinitionProvider.ts
- `provideDefinition()` - 提供定义位置

#### LspReferenceProvider.ts
- `provideReferences()` - 提供引用列表

#### LspRenameProvider.ts
- `provideRenameEdits()` - 提供重命名编辑

#### LspFormatter.ts
- `formatDocument()` - 格式化文档

#### ProblemsPanel.tsx
- 显示诊断问题列表
- 支持点击跳转

### 数据结构

```typescript
interface Diagnostic {
  range: Range;
  severity: number;
  code: string | number | undefined;
  source: string;
  message: string;
}

interface CompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

interface SymbolInformation {
  name: string;
  kind: number;
  location: Location;
}
```

## 依赖关系

| 依赖 | 用途 |
|------|------|
| monaco-editor | 编辑器核心 |
| vscode-languageserver-protocol | LSP协议支持 |
| typescript-language-server | TypeScript LSP服务器 |

## 测试策略

### 单元测试
- LSP客户端通信测试
- 补全建议解析测试
- 诊断信息处理测试

### 集成测试
- LSP服务器连接测试
- 代码补全功能测试
- 代码导航功能测试
- 代码重构功能测试

### E2E测试
- 用户输入触发补全
- 跳转到定义功能
- 重命名符号功能
- 问题面板显示和跳转

## 安全考虑

1. **输入验证**: 对所有LSP请求参数进行验证
2. **资源限制**: 限制LSP服务器资源使用
3. **错误处理**: 优雅处理LSP连接失败
4. **日志记录**: 记录关键操作日志便于排查问题

## 性能优化

1. **请求缓存**: 缓存重复的补全请求
2. **延迟加载**: 按需加载LSP服务器
3. **批量处理**: 批量处理诊断信息
4. **连接复用**: 复用LSP连接

## 参考文档

- [Language Server Protocol Specification](https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [vscode-languageserver-protocol](https://www.npmjs.com/package/vscode-languageserver-protocol)

---

**创建时间**: 2026-05-28  
**最后更新**: 2026-05-28  
**作者**: LAPDEV Team