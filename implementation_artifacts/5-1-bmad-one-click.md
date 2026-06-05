# Story 5.1: BMAD一键启用

## 📋 Story基础信息

| 字段 | 值 |
|------|-----|
| **Story ID** | 5.1 |
| **Story Key** | 5-1-bmad-one-click |
| **所属Epic** | Epic 5: BMAD敏捷方法论支持 |
| **状态** | ready-for-dev |
| **创建日期** | 2026-06-05 |
| **需求覆盖** | FR-029, FR-030 |

---

## 🎯 用户故事

**As a** 个人开发者,
**I want** 一键启用BMAD工作流,
**So that** 使用敏捷开发方法。

---

## ✅ 验收标准

### 场景1: BMAD面板显示状态
**Given** 用户打开项目
**When** 项目根目录无_bmad文件夹
**Then** BMAD面板显示"启用BMAD工作流"按钮
**And** 显示"当前未启用BMAD"状态

**Given** 用户打开项目
**When** 项目根目录已有_bmad文件夹
**Then** BMAD面板显示BMAD已启用状态
**And** 显示"管理BMAD"按钮

### 场景2: 一键启用BMAD
**Given** BMAD未启用
**When** 用户点击"启用BMAD工作流"按钮
**Then** 显示安装进度提示
**And** 系统尝试执行 `npx bmad-method install`
**And** 显示安装日志输出

### 场景3: 在线安装成功
**Given** 在线安装执行中
**When** 安装成功完成
**Then** 项目下生成完整的_bmad目录
**And** Skill注册表自动添加BMAD相关技能
**And** 显示安装成功提示
**And** BMAD面板状态更新为"已启用"

### 场景4: 安装失败降级
**Given** 在线安装执行中
**When** 安装失败（网络问题或Node.js不可用）
**Then** 显示警告提示"在线安装失败，正在尝试离线降级"
**And** 自动切换至离线降级模式（Story 5.2）

### 场景5: BMAD技能集成
**Given** BMAD安装成功
**When** 打开AI面板
**Then** BMAD相关Skill自动加载到Skill注册表
**And** 可在Skill面板中查看BMAD技能

---

## 🏗️ 技术架构要求

### 技术栈
- **语言**: TypeScript
- **框架**: React + Deno
- **终端执行**: Deno subprocess API
- **状态管理**: React Context

### 文件结构
```
frontend/
├── src/
│   ├── components/
│   │   └── BMADPanel/
│   │       ├── BMADPanel.tsx      # BMAD面板组件
│   │       └── BMADStatus.tsx     # BMAD状态显示组件
│   ├── services/
│   │   └── bmadService.ts         # BMAD服务（安装/管理）
│   ├── hooks/
│   │   └── useBMAD.ts             # BMAD状态Hook
│   └── utils/
│       └── subprocess.ts          # 子进程执行工具
```

### BMAD服务接口设计

```typescript
interface BMADService {
  // 检查BMAD是否已安装
  isBMADInstalled(): Promise<boolean>;
  
  // 检查_bmad目录是否存在
  hasBMADDirectory(): boolean;
  
  // 执行在线安装
  installOnline(): Promise<{ success: boolean; error?: string; log: string[] }>;
  
  // 获取BMAD状态
  getStatus(): BMADStatus;
  
  // 刷新BMAD状态
  refreshStatus(): void;
}

type BMADStatus = 'not-installed' | 'installing' | 'installed' | 'error';
```

---

## 📚 依赖与前置条件

### 依赖的故事
- **Story 4.1**: Skill开发与加载（已完成）
  - 需要将BMAD技能注册到Skill系统
  - 复用SkillService和SkillContext
- **Story 3.2**: AI聊天面板（已完成）
  - 需要在AI面板中集成BMAD技能

### 外部依赖
- Node.js环境（用于npx命令）
- 网络连接（用于在线安装）

---

## 🔧 开发指南

### 关键实现要点

1. **BMAD服务实现**
   ```typescript
   class BMADService {
     async installOnline(): Promise<{ success: boolean; error?: string; log: string[] }> {
       // 使用Deno subprocess执行npx命令
       const process = Deno.run({
         cmd: ['npx', 'bmad-method', 'install'],
         cwd: workspacePath,
         stdout: 'piped',
         stderr: 'piped',
       });
       
       // 捕获输出和错误
       // 返回结果
     }
   }
   ```

2. **BMAD面板组件**
   - 显示BMAD状态（未安装/安装中/已安装）
   - 提供启用按钮
   - 显示安装进度日志

3. **状态管理**
   - 使用React Context管理BMAD状态
   - 监听_bmad目录变化
   - 提供状态订阅机制

4. **Skill集成**
   - 安装完成后自动注册BMAD技能
   - 更新SkillContext
   - 在AI面板中显示可用的BMAD技能

### 安装流程设计

```
用户点击"启用BMAD"
    ↓
检查Node.js是否可用
    ↓
[可用] 执行 npx bmad-method install
    ↓
检查安装是否成功
    ↓
[成功] 更新状态为已安装
[失败] 触发离线降级（Story 5.2）
```

### 与Skill系统集成

在安装完成后：
```typescript
// bmadService.ts
const installResult = await this.installOnline();
if (installResult.success) {
  // 注册BMAD技能
  skillService.registerSkillsFromDirectory('_bmad/skills');
  // 更新状态
  this.status = 'installed';
}
```

---

## 🧪 测试要求

### 单元测试
- [ ] BMADService测试
- [ ] 安装状态检测测试
- [ ] 子进程执行测试

### E2E测试
- [ ] BMAD面板状态显示
- [ ] 一键启用流程
- [ ] 安装成功状态更新
- [ ] 安装失败降级触发

### 测试文件
```
tests/
├── unit/
│   └── bmadService.test.ts
└── e2e/
    └── bmad-one-click.spec.ts
```

---

## 📝 开发笔记

### 与之前故事的关联

**从 Story 4.1 学到的经验**：
- Skill注册机制已建立
- SkillContext状态管理模式已定义
- 需要扩展SkillService支持目录扫描

**从 Story 3.2 学到的经验**：
- AI面板已实现
- 技能注入机制已建立
- 需要在BMAD安装后自动加载技能

### 代码审查关注点
- 子进程执行的安全性
- 安装日志的正确捕获
- 状态更新的准确性
- 错误处理和降级机制

### 实现优先级
1. **P0**: BMAD状态检测
2. **P0**: 在线安装执行
3. **P0**: 安装状态UI显示
4. **P1**: Skill自动注册
5. **P2**: 安装进度实时显示

---

## 🔒 安全考虑

- 子进程执行命令需要验证
- 安装目录需要权限检查
- 安装日志不应包含敏感信息
- 需要限制可执行的命令范围

---

## 📅 任务分解

| 任务 | 描述 | 估计工时 | 状态 |
|------|------|----------|------|
| 1 | BMADService实现 | 3小时 | ✅ 已完成 |
| 2 | BMAD面板组件开发 | 3小时 | ✅ 已完成 |
| 3 | 状态管理Context | 2小时 | ✅ 已完成 |
| 4 | 与Skill系统集成 | 2小时 | ✅ 已完成 |
| 5 | 安装流程实现 | 2小时 | ✅ 已完成 |
| 6 | 测试编写 | 2小时 | 🚧 进行中 |

**总估计工时**: 14小时

---

## 🎨 UI设计参考

### BMAD面板布局（未安装状态）
```
┌─────────────────────────────────┐
│ 🚀 BMAD敏捷工作流              │
├─────────────────────────────────┤
│ 状态: ⚠️ 未启用                  │
├─────────────────────────────────┤
│ BMAD是一个强大的敏捷开发方法    │
│ 帮助团队提高开发效率和协作质量   │
├─────────────────────────────────┤
│    [ 启用BMAD工作流 ]           │
└─────────────────────────────────┘
```

### BMAD面板布局（安装中状态）
```
┌─────────────────────────────────┐
│ 🚀 BMAD敏捷工作流              │
├─────────────────────────────────┤
│ 状态: 🔄 安装中...              │
├─────────────────────────────────┤
│ > npx bmad-method install       │
│ > Downloading dependencies...   │
│ > Installing BMAD core...       │
├─────────────────────────────────┤
│         [ 取消安装 ]            │
└─────────────────────────────────┘
```

### BMAD面板布局（已安装状态）
```
┌─────────────────────────────────┐
│ 🚀 BMAD敏捷工作流              │
├─────────────────────────────────┤
│ 状态: ✅ 已启用                  │
│ 版本: 1.0.0                     │
├─────────────────────────────────┤
│ 已加载 5 个BMAD技能             │
├─────────────────────────────────┤
│    [ 管理BMAD ]  [ 卸载 ]       │
└─────────────────────────────────┘
```

---

## ✅ 完成状态

- **Status**: in-progress
- **Completion Note**: BMAD一键启用功能的核心实现已完成，包括：
  - BMADService服务实现（bmadService.ts）
  - BMAD状态管理Context（BMADContext.tsx）
  - BMAD面板组件（BMADPanel.tsx）
  - 后端API Handler（bmadHandler.ts）
  - 单元测试框架已创建
  
  测试部分因技能服务依赖问题需要进一步调整，将在后续迭代中完成。