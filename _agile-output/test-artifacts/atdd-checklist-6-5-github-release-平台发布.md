---
storyKey: "6-5-github-release-平台发布"
status: "implemented"
---

# Story 6.5 ATDD Checklist

- [x] 从 Epic 6 提取 PR/non-release、protected tag、matrix、immutable asset 和 release verification 条件。
- [x] 生成 workflow/release manifest focused tests：17 个跨 6.1–6.5 测试通过。
- [x] 使用两份临时 archive 实际运行 manifest generator 和 verifier。
- [x] 完成完整 npm regression；E2E 既有 flaky 已在重试后通过。

## Deferred by story boundary

npm OIDC Trusted Publishing、公开 npm 安装路径和端到端 runtime 下载由 Story 6.6 负责。
