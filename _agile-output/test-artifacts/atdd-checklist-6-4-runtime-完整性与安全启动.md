---
storyKey: "6-4-runtime-完整性与安全启动"
status: "implemented"
---

# Story 6.4 ATDD Checklist

- [x] 从 Epic 6 和 architecture spine 提取下载、完整性、来源和安全启动约束。
- [x] 先生成 focused tests，再实现 source policy、checksum、archive path gate 和 atomic cache install。
- [x] 16 个聚焦测试通过，包含 6.4 source policy 和 failed-download cleanup。
- [x] 完整 npm regression 通过。

## Deferred by story boundary

Release manifest finalize、GitHub Release asset upload、OIDC npm publish 和端到端公开安装由 Story 6.5–6.6 负责。
