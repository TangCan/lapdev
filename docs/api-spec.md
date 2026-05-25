# Lapdev API 技术规格文档

## 版本信息

| 属性 | 值 |
|------|------|
| 版本 | v1.0 |
| 日期 | 2026-05-25 |
| 状态 | 草案 |

---

## 1. 架构概览

### 1.1 三层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    前端层 (React)                               │
│  Components | Hooks | Services | Types | Utils                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP/WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    后端层 (Deno)                                │
│  Handlers | Middleware | WebSocket | Services | FFI            │
└─────────────────────────┬───────────────────────────────────────┘
                          │ FFI
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    核心层 (Rust)                                │
│  FS | LSP | PTY | FFI Bindings                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 通信协议

| 协议 | 用途 | 端点 |
|------|------|------|
| HTTP/REST | 配置、文件操作、状态查询 | `/api/*` |
| WebSocket | 终端、LSP、实时通信 | `/ws/*` |
| FFI | Deno-Rust 通信 | `lapdev_ffi_*` |

---

## 2. HTTP API 定义

### 2.1 基础路径

所有 API 端点前缀为 `/api/v1`

### 2.2 文件系统 API

#### 2.2.1 获取文件树

```
GET /api/v1/files/tree
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | string | 否 | 起始路径，默认 `/` |
| `depth` | number | 否 | 递归深度，默认 3 |

**成功响应 (200)：**

```json
{
  "status": "success",
  "data": {
    "name": "workspace",
    "path": "/workspace",
    "type": "directory",
    "children": [
      {
        "name": "src",
        "path": "/workspace/src",
        "type": "directory",
        "children": [
          {
            "name": "main.ts",
            "path": "/workspace/src/main.ts",
            "type": "file",
            "size": 1024,
            "lastModified": "2024-01-01T12:00:00Z"
          }
        ]
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 2.2.2 读取文件

```
GET /api/v1/files/read
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | string | 是 | 文件路径 |

**成功响应 (200)：**

```json
{
  "status": "success",
  "data": {
    "path": "/workspace/src/main.ts",
    "content": "console.log('Hello World');",
    "encoding": "utf-8"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**错误响应 (404)：**

```json
{
  "status": "error",
  "error": {
    "code": "ENOENT",
    "message": "File not found",
    "details": { "path": "/workspace/src/main.ts" }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 2.2.3 写入文件

```
POST /api/v1/files/write
```

**请求体：**

```json
{
  "path": "/workspace/src/main.ts",
  "content": "console.log('Hello Lapdev');",
  "encoding": "utf-8"
}
```

**成功响应 (200)：**

```json
{
  "status": "success",
  "data": {
    "path": "/workspace/src/main.ts",
    "size": 32,
    "lastModified": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 2.2.4 创建目录

```
POST /api/v1/files/mkdir
```

**请求体：**

```json
{
  "path": "/workspace/src/new-dir"
}
```

#### 2.2.5 删除文件/目录

```
DELETE /api/v1/files/delete
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | string | 是 | 路径 |
| `recursive` | boolean | 否 | 是否递归删除目录，默认 false |

---

### 2.3 配置 API

#### 2.3.1 获取配置

```
GET /api/v1/config
```

**成功响应 (200)：**

```json
{
  "status": "success",
  "data": {
    "theme": "dark",
    "fontSize": 14,
    "editorConfig": {
      "tabSize": 2,
      "lineNumbers": true,
      "wordWrap": false
    },
    "aiConfig": {
      "apiKey": "***",
      "model": "gpt-4",
      "temperature": 0.7
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 2.3.2 更新配置

```
PUT /api/v1/config
```

**请求体：**

```json
{
  "theme": "light",
  "fontSize": 16
}
```

---

### 2.4 工作区 API

#### 2.4.1 获取工作区状态

```
GET /api/v1/workspace/status
```

**成功响应 (200)：**

```json
{
  "status": "success",
  "data": {
    "name": "my-project",
    "path": "/workspace",
    "openedFiles": [
      { "path": "/workspace/src/main.ts", "modified": false }
    ],
    "activeFile": "/workspace/src/main.ts",
    "terminalSessions": 1,
    "lspStatus": "running"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## 3. WebSocket 消息协议

### 3.1 连接端点

| 端点 | 用途 |
|------|------|
| `/ws/terminal` | 终端通信 |
| `/ws/lsp` | LSP 通信 |
| `/ws/events` | 全局事件 |

### 3.2 消息格式

所有 WebSocket 消息采用统一格式：

```json
{
  "type": "terminal.input",
  "sessionId": "uuid-string",
  "payload": {},
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 3.3 终端协议

#### 3.3.1 打开终端

**客户端发送：**
```json
{
  "type": "terminal.open",
  "sessionId": "session-1",
  "payload": {
    "shell": "/bin/bash",
    "rows": 24,
    "cols": 80
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**服务端响应：**
```json
{
  "type": "terminal.opened",
  "sessionId": "session-1",
  "payload": {
    "pid": 12345,
    "message": "Terminal opened"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 3.3.2 输入数据

**客户端发送：**
```json
{
  "type": "terminal.input",
  "sessionId": "session-1",
  "payload": {
    "data": "ls\n"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**服务端响应：**
```json
{
  "type": "terminal.output",
  "sessionId": "session-1",
  "payload": {
    "data": "file1.txt file2.txt\n"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 3.3.3 调整窗口大小

**客户端发送：**
```json
{
  "type": "terminal.resize",
  "sessionId": "session-1",
  "payload": {
    "rows": 30,
    "cols": 120
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 3.3.4 关闭终端

**客户端发送：**
```json
{
  "type": "terminal.close",
  "sessionId": "session-1",
  "payload": {},
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 3.4 LSP 协议

#### 3.4.1 初始化 LSP

**客户端发送：**
```json
{
  "type": "lsp.initialize",
  "sessionId": "lsp-1",
  "payload": {
    "language": "typescript",
    "rootPath": "/workspace"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**服务端响应：**
```json
{
  "type": "lsp.initialized",
  "sessionId": "lsp-1",
  "payload": {
    "pid": 12346,
    "capabilities": {
      "completionProvider": true,
      "definitionProvider": true,
      "hoverProvider": true
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 3.4.2 发送 LSP 请求

**客户端发送：**
```json
{
  "type": "lsp.request",
  "sessionId": "lsp-1",
  "payload": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "textDocument/completion",
    "params": {
      "textDocument": { "uri": "file:///workspace/src/main.ts" },
      "position": { "line": 5, "character": 10 }
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**服务端响应：**
```json
{
  "type": "lsp.response",
  "sessionId": "lsp-1",
  "payload": {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "items": [
        { "label": "console", "kind": 1 },
        { "label": "const", "kind": 12 }
      ]
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 3.5 事件协议

#### 3.5.1 文件变更事件

**服务端推送：**
```json
{
  "type": "events.file.change",
  "sessionId": "event-session",
  "payload": {
    "path": "/workspace/src/main.ts",
    "eventType": "modify",
    "timestamp": "2024-01-01T12:00:00Z"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## 4. FFI 接口定义

### 4.1 文件系统 FFI

#### 4.1.1 读取文件

```rust
#[deno_bindgen]
pub fn lapdev_fs_read(path: &str) -> Result<String, FFIError>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | string | 文件路径 |

| 返回值 | 类型 | 说明 |
|--------|------|------|
| 成功 | string | 文件内容 |
| 失败 | FFIError | 错误信息 |

#### 4.1.2 写入文件

```rust
#[deno_bindgen]
pub fn lapdev_fs_write(path: &str, content: &str) -> Result<(), FFIError>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `path` | string | 文件路径 |
| `content` | string | 文件内容 |

#### 4.1.3 创建目录

```rust
#[deno_bindgen]
pub fn lapdev_fs_mkdir(path: &str) -> Result<(), FFIError>
```

#### 4.1.4 删除文件/目录

```rust
#[deno_bindgen]
pub fn lapdev_fs_remove(path: &str, recursive: bool) -> Result<(), FFIError>
```

### 4.2 PTY 终端 FFI

#### 4.2.1 启动终端

```rust
#[deno_bindgen]
pub fn lapdev_pty_spawn(shell: &str, rows: i32, cols: i32) -> Result<PtyResult, FFIError>
```

**返回结构 `PtyResult`：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `pid` | i32 | 进程 ID |
| `master_fd` | i32 | 主文件描述符 |

#### 4.2.2 写入终端

```rust
#[deno_bindgen]
pub fn lapdev_pty_write(master_fd: i32, data: &[u8]) -> Result<usize, FFIError>
```

#### 4.2.3 读取终端输出

```rust
#[deno_bindgen]
pub fn lapdev_pty_read(master_fd: i32, buffer_size: usize) -> Result<Vec<u8>, FFIError>
```

#### 4.2.4 调整终端大小

```rust
#[deno_bindgen]
pub fn lapdev_pty_resize(master_fd: i32, rows: i32, cols: i32) -> Result<(), FFIError>
```

#### 4.2.5 关闭终端

```rust
#[deno_bindgen]
pub fn lapdev_pty_close(master_fd: i32) -> Result<(), FFIError>
```

### 4.3 LSP FFI

#### 4.3.1 启动 LSP 服务

```rust
#[deno_bindgen]
pub fn lapdev_lsp_start(language: &str, root_path: &str) -> Result<i32, FFIError>
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `language` | string | 语言标识（typescript, rust, python...） |
| `root_path` | string | 项目根路径 |

| 返回值 | 类型 | 说明 |
|--------|------|------|
| 成功 | i32 | 进程 ID |
| 失败 | FFIError | 错误信息 |

#### 4.3.2 发送 LSP 请求

```rust
#[deno_bindgen]
pub fn lapdev_lsp_request(pid: i32, json_rpc: &str) -> Result<String, FFIError>
```

#### 4.3.3 停止 LSP 服务

```rust
#[deno_bindgen]
pub fn lapdev_lsp_stop(pid: i32) -> Result<(), FFIError>
```

### 4.4 错误类型

```rust
#[deno_bindgen]
pub struct FFIError {
    code: String,
    message: String,
}
```

| 错误码 | 说明 |
|--------|------|
| `ENOENT` | 文件/目录不存在 |
| `EACCES` | 权限不足 |
| `EIO` | I/O 错误 |
| `ENOMEM` | 内存不足 |
| `UNKNOWN` | 未知错误 |

---

## 5. 数据结构定义

### 5.1 文件树节点

```typescript
interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
  children?: FileTreeNode[];
}
```

### 5.2 编辑器状态

```typescript
interface EditorState {
  path: string;
  content: string;
  language: string;
  cursorPosition: Position;
  selections: Selection[];
  modified: boolean;
}

interface Position {
  line: number;
  character: number;
}

interface Selection {
  start: Position;
  end: Position;
}
```

### 5.3 终端会话

```typescript
interface TerminalSession {
  id: string;
  pid: number;
  shell: string;
  rows: number;
  cols: number;
  status: 'running' | 'closed';
}
```

### 5.4 LSP 会话

```typescript
interface LSPSession {
  id: string;
  pid: number;
  language: string;
  rootPath: string;
  capabilities: LspCapabilities;
  status: 'initialized' | 'running' | 'stopped';
}

interface LspCapabilities {
  completionProvider: boolean;
  definitionProvider: boolean;
  hoverProvider: boolean;
  renameProvider: boolean;
  codeActionProvider: boolean;
}
```

### 5.5 配置

```typescript
interface Config {
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  editorConfig: EditorConfig;
  aiConfig: AIConfig;
}

interface EditorConfig {
  tabSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  minimap: boolean;
}

interface AIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}
```

### 5.6 工作区状态

```typescript
interface WorkspaceStatus {
  name: string;
  path: string;
  openedFiles: OpenedFile[];
  activeFile: string;
  terminalSessions: number;
  lspStatus: 'running' | 'stopped' | 'error';
}

interface OpenedFile {
  path: string;
  modified: boolean;
}
```

---

## 6. 错误处理规范

### 6.1 HTTP 错误码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权访问 |
| 403 | Forbidden | 禁止访问 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 |
| 500 | Internal Server Error | 服务器内部错误 |

### 6.2 错误响应格式

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // 附加信息
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## 7. 安全规范

### 7.1 输入验证

- 所有用户输入必须经过验证
- 文件路径必须进行规范化处理
- 禁止访问系统敏感路径（如 `/etc`, `/root`）

### 7.2 危险操作白名单

| 操作 | 允许 | 说明 |
|------|------|------|
| 文件读取 | ✓ | 限制在工作区范围内 |
| 文件写入 | ✓ | 限制在工作区范围内 |
| 目录创建 | ✓ | 限制在工作区范围内 |
| 文件删除 | ✓ | 限制在工作区范围内 |
| 终端执行 | ✓ | 沙箱环境 |
| 网络访问 | ✗ | 默认禁止 |

### 7.3 日志审计

所有操作必须记录审计日志：

```typescript
interface AuditLog {
  timestamp: string;
  action: string;
  path?: string;
  user?: string;
  result: 'success' | 'failure';
  error?: string;
}
```

---

## 8. 版本控制

### 8.1 API 版本

- 当前版本：`v1`
- 版本路径：`/api/v1/*`
- 向后兼容：新增接口不影响旧接口

### 8.2 FFI 版本

```rust
#[deno_bindgen]
pub fn lapdev_ffi_version() -> &'static str {
    "1.0.0"
}
```

运行时版本检查机制：

```typescript
const expectedVersion = "1.0.0";
const nativeVersion = await lapdevFFI.version();

if (nativeVersion !== expectedVersion) {
  console.warn(`FFI version mismatch: expected ${expectedVersion}, got ${nativeVersion}`);
}
```

---

## 附录：协议流程图

### 文件读取流程

```
┌──────────┐     HTTP GET      ┌──────────┐      FFI      ┌──────────┐
│  Client  │ ────────────────> │  Deno    │ ───────────> │  Rust    │
│          │                   │  Server  │              │  Core    │
└──────────┘                   └──────────┘              └──────────┘
     │                              │                        │
     │                              │                        │
     │                              │                        ▼
     │                              │                 读取文件系统
     │                              │                        │
     │                              │                        ▼
     │                              │               返回文件内容
     │                              │ <─────────── │
     │                              │      FFI               │
     │                              ▼                        │
     │                   封装响应格式                        │
     │                              │                        │
     │        HTTP 200              │                        │
     │ <────────────────────────────┘                        │
     │                                                       │
     ▼                                                       │
 显示文件内容                                                 │
```

### 终端输入流程

```
┌──────────┐      WS Message     ┌──────────┐      FFI      ┌──────────┐
│  Client  │ ─────────────────> │  Deno    │ ───────────> │  Rust    │
│ (Input)  │   terminal.input    │  Server  │  pty_write   │  PTY     │
└──────────┘                    └──────────┘              └──────────┘
     │                              │                        │
     │                              │                        ▼
     │                              │                  写入 PTY
     │                              │                        │
     │                              │                        ▼
     │                              │                 读取输出
     │                              │                        │
     │                              │                        ▼
     │                              │              返回输出数据
     │                              │ <─────────── │
     │                              │      FFI               │
     │                              ▼                        │
     │                   封装 WS 消息                        │
     │                              │                        │
     │         WS Message           │                        │
     │ <───────────────────────────┘                        │
     │   terminal.output                                    │
     ▼                                                       │
 显示终端输出                                                 │
```