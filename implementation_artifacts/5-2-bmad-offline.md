# Story 5.2: BMAD离线降级

## 📋 Story基础信息

| 字段 | 值 |
|------|-----|
| **Story ID** | 5.2 |
| **Story Key** | 5-2-bmad-offline |
| **所属Epic** | Epic 5: BMAD敏捷方法论支持 |
| **状态** | done |
| **创建日期** | 2026-06-08 |
| **需求覆盖** | FR-031, FR-032 |

---

## 🎯 用户故事

**As a** 个人开发者,
**I want** 在网络不可用时仍使用BMAD,
**So that** 继续工作。

---

## ✅ 验收标准

### 场景1: 在线安装失败触发降级
**Given** 在线安装执行中
**When** 安装失败（网络问题、Node.js不可用或超时）
**Then** 显示警告提示"在线安装失败，正在尝试离线降级"
**And** 自动切换至离线降级模式

### 场景2: 离线降级安装
**Given** 降级模式激活
**When** 执行离线安装
**Then** 内置简化版BMAD文件写入项目 `_bmad/core/` 目录
**And** 包含quick-flow工作流配置
**And** 包含developer智能体配置
**And** 包含pm智能体配置
**And** 显示离线安装进度

### 场景3: 降级安装完成
**Given** 离线安装完成
**When** 启动IDE
**Then** AI面板自动加载bmad-quick-flow技能
**And** BMAD面板状态更新为"已启用（离线模式）"
**And** 显示"离线模式"标识

### 场景4: 网络恢复检测
**Given** 当前处于离线模式
**When** 用户手动触发重新安装
**Then** 系统尝试在线安装
**And** 若成功则升级为完整BMAD
**And** 若失败则保持离线模式

### 场景5: 离线模式提示
**Given** 当前处于离线模式
**When** 打开BMAD面板
**Then** 显示"当前处于离线模式"提示
**And** 显示"点击升级到完整版本"按钮
**And** 说明离线模式功能限制

---

## 📋 任务清单

- [x] 更新后端bmadService.ts添加离线降级逻辑
- [x] 更新前端bmadService.ts添加离线降级逻辑
- [x] 更新后端bmadHandler.ts添加升级端点
- [x] 更新后端main.ts添加升级路由
- [x] 更新前端BMADContext.tsx支持离线模式和升级功能
- [x] 创建验收测试文件5-2-bmad-offline.atdd.ts

---

## 🏗️ 技术架构要求

### 技术栈
- **语言**: TypeScript
- **框架**: React + Deno
- **状态管理**: React Context (BMADContext)
- **文件操作**: Deno文件系统API

### 文件结构
```
frontend/
├── src/
│   ├── components/
│   │   └── BMAD/
│   │       ├── BMADPanel.tsx      # BMAD面板组件（已有）
│   │       └── BMADOfflineBanner.tsx  # 离线模式提示组件
│   ├── services/
│   │   └── bmadService.ts         # BMAD服务（需新增离线降级逻辑）
│   ├── context/
│   │   └── BMADContext.tsx        # BMAD状态管理（需更新）
│   └── data/
│       └── bmad-offline/          # 内置简化版BMAD文件
│           ├── config.yaml        # BMAD配置
│           ├── quick-flow.skill.md    # quick-flow工作流
│           ├── developer.skill.md     # developer智能体
│           └── pm.skill.md            # pm智能体
```

### BMAD服务接口设计（续）

```typescript
interface BMADService {
  // ... 已有方法 ...
  
  // 检查是否处于离线模式
  isOfflineMode(): boolean;
  
  // 执行离线降级安装
  installOffline(): Promise<{ success: boolean; error?: string; log: string[] }>;
  
  // 尝试升级到完整版本
  upgradeToFull(): Promise<{ success: boolean; error?: string }>;
  
  // 获取离线模式内置文件路径
  getOfflineDataPath(): string;
}
```

### 离线降级流程

```
在线安装失败
    ↓
检测失败原因（网络/Node.js/超时）
    ↓
触发降级策略
    ↓
复制内置BMAD文件到 _bmad/core/
    ↓
注册BMAD相关Skill
    ↓
更新状态为"installed-offline"
    ↓
通知前端刷新面板
```

---

## 📦 依赖与集成

### 内部依赖
- **BMADContext**: 状态管理
- **SkillService**: Skill注册
- **FileService**: 文件操作

### 外部依赖
- 无新增外部依赖

---

## 🧪 测试要求

### 单元测试
- 测试离线安装逻辑
- 测试降级策略触发条件
- 测试离线模式状态管理
- 测试升级到完整版本流程

### E2E测试
- 模拟网络不可用场景
- 验证离线模式UI显示
- 验证降级安装流程
- 验证升级流程

---

## ⚠️ 边界条件

1. **网络不稳定**: 在线安装过程中网络断开应正确触发降级
2. **权限问题**: 写入_bmad目录失败时应显示友好错误
3. **重复安装**: 离线模式下重复点击安装应被忽略
4. **已存在_bmad目录**: 应检测并处理冲突

---

## 🔗 依赖关系

- **前置依赖**: Story 5.1 (BMAD一键启用) - 需要BMAD服务基础架构
- **后续影响**: 无

---

## 📝 开发者备注

1. 内置BMAD文件应打包在前端应用中，通过静态资源访问
2. 离线模式安装不需要网络或Node.js环境
3. 离线模式使用简化版BMAD，功能可能受限
4. 应提供明确的UI提示区分在线/离线模式

---

## 🔄 状态变更

| 原状态 | 触发条件 | 新状态 |
|--------|----------|--------|
| installing | 在线安装失败 | installing-offline |
| installing-offline | 安装成功 | installed-offline |
| installing-offline | 安装失败 | error |
| installed-offline | 升级成功 | installed |
| installed-offline | 升级失败 | installed-offline |

---

## 📁 文件清单

| 文件路径 | 变更类型 | 说明 |
|----------|----------|------|
| `backend/src/services/bmadService.ts` | 修改 | 添加离线安装和升级逻辑 |
| `backend/src/handlers/bmadHandler.ts` | 修改 | 添加升级端点处理 |
| `backend/src/main.ts` | 修改 | 添加升级路由 |
| `frontend/src/services/bmadService.ts` | 修改 | 添加离线安装和升级逻辑 |
| `frontend/src/context/BMADContext.tsx` | 修改 | 支持离线模式和升级功能 |
| `tests/acceptance/5-2-bmad-offline.atdd.ts` | 新建 | 验收测试文件 |

---

## 📝 开发记录

### 实现概述
已完成BMAD离线降级功能的实现：

1. **状态扩展**: 新增 `installing-offline` 和 `installed-offline` 状态
2. **离线安装**: 在线安装失败时自动触发离线安装，创建 `_bmad/core/` 目录并写入简化版BMAD文件
3. **升级功能**: 支持从离线模式升级到完整版本
4. **API端点**: 新增 `/api/bmad/upgrade` 端点支持升级操作
5. **状态检测**: `refreshStatus()` 方法能正确识别离线模式

### 关键实现
- `installOnline()` 失败时自动调用 `installOffline()` 降级
- `installOffline()` 创建内置简化版BMAD文件（config.yaml, quick-flow.skill.md, developer.skill.md, pm.skill.md）
- `upgradeToFull()` 从离线模式尝试升级到完整版本
- SSE流式日志支持离线安装过程的实时显示