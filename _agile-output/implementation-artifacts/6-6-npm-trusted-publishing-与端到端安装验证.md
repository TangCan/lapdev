# Story 6.6: npm Trusted Publishing 与端到端安装验证

Status: done

## 实现摘要

- PR 和普通 push 执行 CLI 版本一致性检查、打包、单元测试以及本地 `npm exec`/npx 安装路径验证。
- 受保护的 `vX.Y.Z` tag 在 GitHub Release 校验成功后，使用 GitHub OIDC `id-token: write` 发布 `@lapdev/cli`，不使用 npm token secret；npm Trusted Publishing 自动生成 provenance。
- CLI package metadata 声明与实际 GitHub 仓库一致的 `repository.url`；发布 job 使用 Node 24 和 npm 11.5.1，满足 npm Trusted Publishing 的最低版本要求。
- 发布前验证 npm 包版本、tag 版本和 runtime manifest 版本完全一致。
- 端到端 smoke test 验证干净临时环境中的打包 CLI 能启动匹配 runtime，并访问 localhost health endpoint。

## 发布前置配置

npm registry 上的 `@lapdev/cli` 包需要配置 GitHub Actions Trusted Publisher，仓库设为 `TangCan/lapdev`，workflow filename 设为 `runtime-release.yml`。该 registry 配置属于平台侧设置，不写入仓库 secret 或代码。

## 安全边界

CLI 仍只接受受允许列表约束的 GitHub HTTPS runtime 来源；运行时完整性由 runtime manifest 的 SHA-256 校验保证。npm 发布 job 仅在 version tag 上运行，并只授予 `id-token: write` 与只读仓库权限。
