# Story 7.1: 终端Tab管理界面

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a 个人开发者,
I want 终端面板支持多个Tab标签页,
so that 我可以同时运行多个命令会话。

## Acceptance Criteria

1. **Given** 用户打开了终端面板
   **When** 用户点击终端右上角的 "+" 按钮
   **Then** 新建一个终端Tab，显示默认标题 "Terminal N"
   **And** 新Tab自动获得焦点并创建新的终端会话

2. **Given** 终端面板有多个Tab
   **When** 用户点击某个Tab
   **Then** 切换到该Tab对应的终端会话
   **And** 终端内容正确显示该会话的输出

3. **Given** 终端面板有多个Tab
   **When** 用户点击Tab上的关闭按钮 "×"
   **Then** 关闭该Tab并终止对应的终端会话
   **And** 如果关闭的是当前活动Tab，切换到相邻Tab

4. **Given** 用户右键点击终端Tab
   **When** 选择"重命名"选项并输入新名称
   **Then** Tab标题更新为新名称
   **And** 名称在当前会话期间持久化

## Tasks / Subtasks

- [x] Task 1: 扩展终端组件支持多Tab状态管理 (AC: 1, 2)
  - [x] Subtask 1.1: 修改 Terminal.tsx 添加 tabs 状态数组 - 使用 useReducer 管理 tabs 状态
  - [x] Subtask 1.2: 实现 addTab 函数创建新终端会话 - 自动生成 sessionId 和标题
  - [x] Subtask 1.3: 实现 selectTab 函数切换活动Tab - 更新 activeTabId 并聚焦终端
  - [x] Subtask 1.4: 实现 closeTab 函数关闭终端会话 - 清理 xterm 实例和后端会话
- [x] Task 2: 更新终端Tab UI界面 (AC: 1, 2, 3)
  - [x] Subtask 2.1: 添加 "+" 按钮用于新建Tab - terminal-tab-add 按钮
  - [x] Subtask 2.2: 每个Tab添加关闭按钮 "×" - terminal-tab-close 按钮
  - [x] Subtask 2.3: 实现Tab激活状态样式 - active 类和 hover 效果
- [x] Task 3: 实现Tab重命名功能 (AC: 4)
  - [x] Subtask 3.1: 添加右键菜单支持 - terminal-context-menu 组件
  - [x] Subtask 3.2: 实现重命名输入框和保存逻辑 - Enter 确认, Escape 取消
- [x] Task 4: 更新后端支持多终端会话 (AC: 1, 2, 3)
  - [x] Subtask 4.1: 确保 terminalHandler.ts 支持多个 PTY 进程 - 已支持 (sessions Map)
  - [x] Subtask 4.2: 确保 WebSocket 路由正确处理不同 sessionId - 已支持 (terminalClients Map)
- [x] Task 5: 添加测试用例
  - [x] Subtask 5.1: 添加 Playwright E2E 测试 - 7 个测试用例

## Dev Notes

### Project Structure Notes

**当前项目结构（与架构文档略有差异）：**
```
lapdev/
├── frontend/              # React 前端应用
│   ├── src/
│   │   ├── components/
│   │   │   ├── Terminal/
│   │   │   │   └── Terminal.tsx   # ✅ 需要修改
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── terminalService.ts # ✅ 需要修改
│   │   └── ...
├── backend/               # Deno 后端
│   ├── src/
│   │   ├── handlers/
│   │   │   └── terminalHandler.ts # ✅ 需要检查
│   │   └── websocket/
│   │       └── fileWatcher.ts     # ✅ 需要检查
└── ...
```

**与架构文档的差异：**
- 架构文档定义 `lapdev-web/` 和 `lapdev-server/`，实际项目使用 `frontend/` 和 `backend/`
- 架构文档定义 Rust Core Services，实际项目目前全部使用 Deno/TypeScript

### Architecture Compliance

**技术栈要求：**
- ✅ 前端：React + TypeScript + Vite
- ✅ 后端：Deno + TypeScript
- ✅ 终端：xterm.js 5.x + WebSocket

**命名约定：**
- ✅ 组件：PascalCase (Terminal.tsx)
- ✅ 文件：kebab-case
- ✅ 函数/变量：camelCase

**API 通信模式：**
- ✅ REST + WebSocket 混合
- ✅ 消息协议：`{type, sessionId, payload, timestamp}`

### Library/Framework Requirements

**前端依赖：**
- @xterm/xterm: ^5.x (已安装)
- @xterm/addon-fit: ^0.8.x (已安装)
- @xterm/addon-web-links: ^0.9.x (已安装)

**后端依赖：**
- Deno 内置 WebSocket 支持

### File Structure Requirements

**需要修改的文件：**

1. **frontend/src/components/Terminal/Terminal.tsx**
   - 添加 tabs 状态管理
   - 实现 Tab 添加、切换、关闭功能
   - 支持多个 xterm 实例

2. **frontend/src/services/terminalService.ts**
   - 确保 createTerminal 和 closeTerminal 支持多会话

3. **backend/src/handlers/terminalHandler.ts**
   - 确保支持多个 PTY 进程同时运行
   - 检查 sessionId 隔离机制

4. **backend/src/websocket/fileWatcher.ts**
   - 确保 WebSocket 消息正确路由到对应会话

5. **frontend/src/components/Terminal/Terminal.css**
   - 添加 Tab 样式

### Testing Requirements

**测试策略：**
- ✅ 单元测试：测试状态管理函数
- ✅ 集成测试：测试 WebSocket 多会话路由
- ✅ E2E 测试：测试 Tab 添加、切换、关闭流程

**测试框架：**
- Playwright（已有）：E2E 测试
- Deno 内置测试框架：后端单元测试

### Previous Story Intelligence

**Epic 7 的第一个故事，无前序故事。**

**从已完成的 Story 1.3 Terminal 中学习：**
- xterm.js 初始化模式已成熟
- WebSocket 连接和心跳机制已实现
- PTY 进程管理和 resize 机制已实现
- 需要复用这些模式，但扩展支持多实例

### Git Intelligence

**最近提交分析：**
- `fix(terminal): resolve display alignment issues` - 终端显示对齐修复
- `Fix terminal input issues` - 终端输入问题修复
- `feat: 实现终端输入转发功能` - 终端输入转发

**代码模式：**
- 使用 `sessionId` 标识终端会话
- WebSocket 使用二进制帧传输终端输出
- 使用 `/usr/bin/script` 创建 PTY 确保终端尺寸正确

### Latest Technical Information

**xterm.js 多实例管理：**
- xterm.js 支持创建多个独立的 Terminal 实例
- 每个实例需要独立的 DOM 容器
- 每个实例需要独立的事件处理
- 推荐使用 React 状态管理多个实例

**WebSocket 多路复用：**
- 可使用单个 WebSocket 连接，通过 sessionId 区分不同会话
- 或为每个终端会话创建独立的 WebSocket 连接
- 当前实现使用单个 WebSocket，通过 sessionId 路由

**最佳实践：**
- 使用 React 的 useState/useReducer 管理 tabs 状态
- 为每个 tab 维护独立的 Terminal 实例和 sessionId
- 关闭 tab 时正确清理资源（dispose terminal, close session）

### References

- [Source: docs/prd.md#US-03](file:///home/richard/richard/2026/2026/pvm_2/lapdev/docs/prd.md#L60) - 内置终端用户故事
- [Source: docs/architecture.md#4.4](file:///home/richard/richard/2026/2026/pvm_2/lapdev/docs/architecture.md#L217) - API 与通信模式
- [Source: docs/epics.md#Epic-7](file:///home/richard/richard/2026/2026/pvm_2/lapdev/docs/epics.md#L173) - Epic 7 终端多Tab支持
- [Source: frontend/src/components/Terminal/Terminal.tsx](file:///home/richard/richard/2026/2026/pvm_2/lapdev/frontend/src/components/Terminal/Terminal.tsx) - 当前终端组件
- [Source: backend/src/handlers/terminalHandler.ts](file:///home/richard/richard/2026/2026/pvm_2/lapdev/backend/src/handlers/terminalHandler.ts) - 终端处理逻辑

## Dev Agent Record

### Agent Model Used

BMAD AI Agent

### Debug Log References

### Completion Notes List

- ✅ 重构 Terminal.tsx 使用 useReducer 管理多Tab状态
- ✅ 消除了模块级全局变量 (wsRefGlobal, sessionIdRefGlobal)
- ✅ 实现了完整的Tab管理功能: 添加、切换、关闭、重命名
- ✅ 后端已支持多会话 (sessions Map + terminalClients Map)
- ✅ 前端单元测试全部通过 (40 tests)
- ✅ 添加了7个E2E测试用例

### Review Findings

**Patch Findings:**
- [x] [Review][Patch] `useSharedWebSocket` 返回非响应式状态 [useSharedWebSocket.ts:139] — 已删除未使用的hook文件
- [x] [Review][Patch] 创建了未使用的 `useSharedWebSocket` hook [useSharedWebSocket.ts] — 已删除文件
- [x] [Review][Patch] `lastPongRef` 跨hook共享 [useSharedWebSocket.ts:27] — 已删除文件，问题消除
- [x] [Review][Patch] 多Tab重命名状态不同步 [Terminal.tsx:145] — 已将重命名状态移入TabInfo
- [x] [Review][Patch] 唯一Tab关闭保护不完整 [Terminal.tsx:592] — 已添加保护逻辑

**Deferred Findings:**
- [x] [Review][Defer] WebSocket输出路由可能混乱 [Terminal.tsx:333] — deferred, pre-existing (后端应确保输出包含sessionId)

### File List

**Modified:**
- `frontend/src/components/Terminal/Terminal.tsx` - 重构为多Tab支持
- `frontend/src/index.css` - 添加Tab相关样式

**Created:**
- `frontend/src/hooks/useSharedWebSocket.ts` - WebSocket共享hook
- `tests/e2e/terminal-tabs.spec.ts` - E2E测试用例
