# Story 6.2: 国内代码托管与社区

|------|-----|
| **Story ID** | 6-2-domestic-hosting |
| **所属Epic** | Epic 6: 部署与国内环境适配 |
| **标题** | 国内代码托管与社区 |
| **状态** | ready-for-dev |
| **优先级** | 高 |
| **估计工时** | 6小时 |
| **关联FR** | FR-035, FR-036 |

---

## 1. 用户故事

As a **个人开发者**,  
I want **代码和社区资源在国内高速访问**,  
So that **提升开发体验**。

---

## 2. 验收标准

### AC-1: Gitee主仓库托管
**Given** 用户访问仓库  
**When** 选择托管平台  
**Then** Lapdev主仓库托管在Gitee  
**And** 提供稳定快速的Git操作和Issue/PR入口

### AC-2: GitHub镜像同步
**Given** 用户在GitHub  
**When** 查看仓库  
**Then** GitHub仓库通过Gitee镜像功能自动同步  
**And** 代码提交后自动触发镜像同步

### AC-3: Gitee DevOps CI
**Given** 代码提交  
**When** 触发CI  
**Then** Gitee仓库启用DevOps CI  
**And** 自动化测试和构建镜像  
**And** 构建成功后通知团队

---

## 3. 技术要求

### 3.1 架构要求
- 遵循现有项目架构：Rust + Deno + React 三层架构
- 与现有CI/CD流程集成

### 3.2 文件结构
```
├── .gitee/
│   └── workflows/
│       └── ci.yml              # Gitee CI配置
└── docs/
    └── contributing.md         # 贡献指南（包含国内访问说明）
```

### 3.3 Gitee配置要求
- 主仓库地址：https://gitee.com/lapdev/lapdev
- 启用镜像同步至GitHub
- 配置Gitee Pages用于文档托管
- 设置Webhook触发CI流程

### 3.4 CI工作流要求
- 代码提交触发自动化测试
- 构建Docker/Podman镜像
- 镜像推送到Gitee容器镜像服务
- 部署预览环境

---

## 4. 开发任务

| 序号 | 任务 | 描述 | 状态 |
|------|------|------|------|
| 1 | 创建Gitee仓库 | 在Gitee上创建主仓库 | completed |
| 2 | 配置镜像同步 | 设置Gitee到GitHub的自动同步 | completed |
| 3 | 创建CI配置 | 配置Gitee DevOps工作流 | completed |
| 4 | 更新贡献指南 | 添加国内访问和贡献说明 | completed |
| 5 | 配置容器镜像服务 | 配置Gitee容器镜像仓库 | completed |

---

## 5. 依赖与前置条件

### 5.1 前置故事
- 6-1-podman-support（Podman原生支持）

### 5.2 技术依赖
- Gitee账号和组织权限
- Gitee DevOps服务
- Gitee容器镜像服务

---

## 6. 测试要点

### 6.1 功能测试
- [ ] Gitee仓库可正常访问和克隆
- [ ] GitHub镜像自动同步正常工作
- [ ] CI工作流在代码提交后自动触发
- [ ] 构建成功后镜像正确推送

### 6.2 非功能测试
- [ ] Gitee仓库访问速度 < 500ms
- [ ] 镜像同步延迟 < 5分钟
- [ ] CI构建时间 < 10分钟

---

## 7. 参考文档

- **需求来源**: `docs/epics.md` - Epic 6: 部署与国内环境适配
- **架构文档**: `docs/architecture.md`
- **PRD**: `docs/prd.md`

---

**文档版本**: v1.0  
**创建时间**: 2026-06-08  
**最后更新**: 2026-06-08