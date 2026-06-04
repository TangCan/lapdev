# Story 4.2: Skill自动匹配

## 📋 Story基础信息

| 字段 | 值 |
|------|-----|
| **Story ID** | 4.2 |
| **Story Key** | 4-2-skill-auto-match |
| **所属Epic** | Epic 4: Skill系统 |
| **状态** | ready-for-dev |
| **创建日期** | 2026-06-04 |
| **需求覆盖** | FR-028 |

---

## 🎯 用户故事

**As a** 个人开发者,
**I want** AI自动启用合适的Skill,
**So that** 获得相关帮助。

---

## ✅ 验收标准

### 场景1: Skill扫描与匹配
**Given** 用户发送AI请求
**When** AI接收请求
**Then** 扫描已加载Skill的描述和触发条件
**And** 计算每个Skill与请求的匹配度

### 场景2: 自动激活
**Given** Skill匹配度计算完成
**When** 匹配度超过阈值（>0.7）
**Then** 自动激活该Skill
**And** 在UI中显示已激活的Skill
**And** 将Skill指令注入AI系统提示

### 场景3: 手动禁用
**Given** Skill已激活
**When** 用户点击禁用按钮
**Then** Skill被禁用
**And** 从系统提示中移除Skill指令
**And** UI更新显示禁用状态

### 场景4: 多Skill组合
**Given** 多个Skill匹配成功
**When** 所有匹配Skill激活
**Then** 支持多个Skill指令组合
**And** 按优先级排序注入

---

## 🏗️ 技术架构要求

### 技术栈
- **语言**: TypeScript
- **框架**: React + Deno
- **匹配算法**: 基于关键词和语义相似度
- **状态管理**: React Context

### 文件结构
```
frontend/
├── src/
│   ├── services/
│   │   └── skillMatchService.ts    # Skill匹配服务
│   ├── components/
│   │   └── SkillPanel/
│   │       ├── SkillPanel.tsx      # Skill面板组件
│   │       └── SkillItem.tsx       # Skill项组件
│   ├── hooks/
│   │   └── useSkillMatch.ts        # Skill匹配Hook
│   └── utils/
│       └── similarity.ts           # 相似度计算工具
```

### 匹配算法设计

**匹配度计算公式**：
```
matchScore = keywordMatch * 0.4 + semanticMatch * 0.4 + patternMatch * 0.2

其中：
- keywordMatch: 关键词匹配度（0-1）
- semanticMatch: 语义相似度（0-1）
- patternMatch: 正则模式匹配度（0或1）
```

**激活阈值**：0.7

---

## 📚 依赖与前置条件

### 依赖的故事
- **Story 4.1**: Skill开发与加载（已完成）
  - 复用 SkillService 和 SkillContext
  - 复用 Skill 类型定义
- **Story 3.2**: AI聊天面板（已完成）
  - 需要在AI请求时注入Skill指令
  - 需要更新系统提示

### 外部依赖
- 无新增外部依赖

---

## 🔧 开发指南

### 关键实现要点

1. **Skill匹配服务**
   ```typescript
   class SkillMatchService {
     // 计算匹配度
     calculateMatchScore(skill: Skill, request: AIRequest): number;

     // 查找匹配的Skill
     findMatchingSkills(request: AIRequest): Skill[];

     // 激活Skill
     activateSkill(skillId: string): void;

     // 禁用Skill
     deactivateSkill(skillId: string): void;
   }
   ```

2. **关键词匹配**
   - 提取用户请求中的关键词
   - 与Skill的trigger.keywords匹配
   - 计算Jaccard相似度

3. **语义相似度**（可选，第一阶段可简化）
   - 使用简单的词向量或TF-IDF
   - 未来可集成embedding模型

4. **模式匹配**
   - 使用正则表达式匹配
   - 支持多个模式组合

5. **UI组件**
   - Skill面板显示已激活的Skill
   - 每个Skill项显示匹配度
   - 提供禁用按钮

### 与AI聊天面板集成

在 `AIPanel.tsx` 中：
```typescript
// 发送请求前
const matchingSkills = skillMatchService.findMatchingSkills(request);
const activeSkills = matchingSkills.filter(s => s.matchScore > 0.7);

// 注入系统提示
const systemPrompt = buildSystemPrompt(activeSkills);
```

### 状态管理

扩展 `SkillContext.tsx`：
```typescript
interface SkillContextValue {
  skills: Skill[];
  activeSkills: string[];  // 新增：已激活的Skill ID列表
  activateSkill: (id: string) => void;
  deactivateSkill: (id: string) => void;
  findMatchingSkills: (request: AIRequest) => Skill[];
}
```

---

## 🧪 测试要求

### 单元测试
- [ ] 匹配度计算测试
- [ ] 关键词匹配测试
- [ ] 模式匹配测试
- [ ] 激活/禁用状态管理测试

### E2E测试
- [ ] Skill自动激活流程
- [ ] 手动禁用Skill
- [ ] 多Skill组合
- [ ] Skill指令注入验证

### 测试文件
```
tests/
├── unit/
│   └── skillMatchService.test.ts
└── e2e/
    └── skill-match.spec.ts
```

---

## 📝 开发笔记

### 与之前故事的关联

**从 Story 4.1 学到的经验**：
- Skill文件格式已定义（.skill.md）
- SkillService 已实现加载和解析
- SkillContext 已建立状态管理
- 需要扩展而非重写

**从 Epic 3 学到的经验**：
- AI请求处理流程已建立
- 系统提示注入机制已实现
- 流式回复处理已完成

### 代码审查关注点
- 匹配算法的准确性
- 性能优化（大量Skill时的匹配效率）
- 错误处理和边界情况
- UI响应性

### 实现优先级
1. **P0**: 基础匹配算法（关键词 + 模式）
2. **P0**: 激活/禁用状态管理
3. **P0**: UI组件
4. **P1**: 语义相似度（可后续优化）
5. **P2**: 性能优化（缓存、索引）

---

## 🔒 安全考虑

- Skill匹配不应泄露敏感信息
- 激活的Skill数量应有限制（防止提示过长）
- 用户应能查看和控制哪些Skill被激活

---

## 📅 任务分解

| 任务 | 描述 | 估计工时 |
|------|------|----------|
| 1 | 实现匹配算法 | 3小时 |
| 2 | 扩展SkillContext | 2小时 |
| 3 | SkillMatchService实现 | 2小时 |
| 4 | UI组件开发 | 3小时 |
| 5 | 与AI面板集成 | 2小时 |
| 6 | 测试编写 | 2小时 |

**总估计工时**: 14小时

---

## 🎨 UI设计参考

### Skill面板布局
```
┌─────────────────────────┐
│ 🎯 已激活Skill (2)      │
├─────────────────────────┤
│ ✅ git-helper           │
│    匹配度: 0.85         │
│    [禁用]               │
├─────────────────────────┤
│ ✅ code-review          │
│    匹配度: 0.72         │
│    [禁用]               │
└─────────────────────────┘
```

### 激活提示
当Skill自动激活时，在聊天面板顶部显示：
```
💡 已自动激活 2 个Skill: git-helper, code-review
```

---

## ✅ 完成状态

- **Status**: ready-for-dev
- **Completion Note**: 故事文档已创建，包含完整需求、技术架构和实现指南
