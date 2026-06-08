# 贡献指南

欢迎为 Lapdev 项目做出贡献！本指南将帮助您了解如何参与项目开发。

## 国内访问说明

由于网络原因，国内用户建议使用 Gitee 主仓库进行代码访问和贡献：

### Gitee 主仓库
- **地址**: https://gitee.com/lapdev/lapdev
- **特点**: 国内高速访问，稳定可靠

### GitHub 镜像仓库
- **地址**: https://github.com/lapdev/lapdev
- **特点**: 自动同步自 Gitee 主仓库，延迟约 5 分钟

### 克隆仓库

```bash
# 推荐：使用 Gitee（国内用户）
git clone https://gitee.com/lapdev/lapdev.git

# 备选：使用 GitHub（国际用户）
git clone https://github.com/lapdev/lapdev.git
```

## 贡献流程

1. **Fork 仓库**
   - 在 Gitee 上 fork 主仓库到您的个人账户

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **提交代码**
   - 遵循项目代码规范
   - 提交信息清晰描述变更内容

4. **创建 Pull Request**
   - 在 Gitee 上提交 PR 到主仓库的 main 分支

5. **代码审查**
   - 等待项目维护者审查
   - 根据反馈进行修改

## 代码规范

- TypeScript 代码遵循 Deno 标准
- 使用 `deno fmt` 格式化代码
- 使用 `deno lint` 检查代码质量

## 测试要求

- 新增功能需添加相应的单元测试
- 所有测试需通过才能合并 PR

## 沟通渠道

- **Issue**: 在 Gitee 上提交问题和功能请求
- **Discussions**: 在 Gitee Discussions 中讨论技术问题

## License

项目采用 MIT 许可证，贡献代码将遵循相同许可证。