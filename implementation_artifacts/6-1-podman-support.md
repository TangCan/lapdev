# Story 6.1: Podman原生支持

|------|-----|
| **Story ID** | 6-1-podman-support |
| **所属Epic** | Epic 6: 部署与国内环境适配 |
| **标题** | Podman原生支持 |
| **状态** | done |
| **优先级** | 高 |
| **估计工时** | 8小时 |
| **关联FR** | FR-033, FR-034, NFR-010 |

---

## 1. 用户故事

As a **团队负责人**,  
I want **使用Podman部署Lapdev**,  
So that **简化部署流程**。

---

## 2. 验收标准

### AC-1: Podman Compose配置
**Given** 用户获取项目  
**When** 查看项目根目录  
**Then** 提供 `podman-compose.yml` 文件  
**And** 一键启动Lapdev及其依赖

### AC-2: 自动化安装脚本
**Given** 用户需要配置  
**When** 执行脚本  
**Then** 提供 `scripts/setup_podman.sh`  
**And** 自动化安装Podman、配置镜像加速

### AC-3: Docker兼容性
**Given** 用户有Docker镜像  
**When** 使用Podman  
**Then** Dockerfile构建的镜像可直接在Podman中使用

### AC-4: 文档说明
**Given** 用户需要文档  
**When** 查看文档  
**Then** 明确说明如何配置国内镜像源  
**And** 说明如何加载离线镜像包

---

## 3. 技术要求

### 3.1 架构要求
- 遵循现有项目架构：Rust + Deno + React 三层架构
- 单容器部署支持（NFR-010）
- 环境变量配置支持（NFR-011）

### 3.2 文件结构
```
├── podman-compose.yml          # Podman Compose配置
├── scripts/
│   └── setup_podman.sh         # 自动化安装脚本
└── docs/
    └── deployment-podman.md    # 部署文档
```

### 3.3 podman-compose.yml 要求
- 包含Lapdev服务定义
- 包含必要的环境变量配置
- 端口映射（前端:8080, API:3000）
- 工作区目录挂载
- 网络配置

### 3.4 setup_podman.sh 要求
- 检测并安装Podman
- 配置国内镜像加速（如registry.cn-xxx.aliyuncs.com）
- 设置Podman开机自启
- 配置用户权限（非root用户运行）

### 3.5 镜像配置
- 支持Dockerfile构建
- 支持加载离线镜像包
- 国内镜像源配置说明

---

## 4. 开发任务

| 序号 | 任务 | 描述 | 状态 |
|------|------|------|------|
| 1 | 创建 podman-compose.yml | 定义Lapdev服务和依赖 | pending |
| 2 | 创建 setup_podman.sh | 自动化安装和配置脚本 | pending |
| 3 | 更新 Dockerfile | 确保Podman兼容性 | pending |
| 4 | 更新部署文档 | 添加Podman部署说明 | pending |
| 5 | 添加国内镜像配置 | 配置镜像加速 | pending |

---

## 5. 依赖与前置条件

### 5.1 前置故事
- 无（Epic 6的第一个故事）

### 5.2 技术依赖
- Podman 4.0+
- podman-compose
- Dockerfile（已存在）

---

## 6. 测试要点

### 6.1 功能测试
- [ ] podman-compose.yml 可正常启动服务
- [ ] setup_podman.sh 脚本在CentOS/Ubuntu上可执行
- [ ] Docker镜像可在Podman中运行
- [ ] 国内镜像源配置有效

### 6.2 非功能测试
- [ ] 容器启动时间 < 30秒
- [ ] 服务正常运行，API可访问
- [ ] 工作区目录正确挂载

---

## 7. 参考文档

- **需求来源**: `docs/epics.md` - Epic 6: 部署与国内环境适配
- **架构文档**: `docs/architecture.md`
- **PRD**: `docs/prd.md`

---

**文档版本**: v1.0  
**创建时间**: 2026-06-08  
**最后更新**: 2026-06-08