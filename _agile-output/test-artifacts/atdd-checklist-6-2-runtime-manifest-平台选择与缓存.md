---
storyKey: "6-2-runtime-manifest-平台选择与缓存"
status: "implemented"
---

# Story 6.2 ATDD Checklist

- [x] 读取已确认的 Epic 6 context、runtime contract 和 Story 6.2 验收标准。
- [x] 由于当前 Codex 安装没有 `bmad-create-story`，使用已确认 Epic Story 生成标准实现故事文件。
- [x] 先生成红阶段测试，再实现 manifest、平台选择、资产校验和 offline cache miss。
- [x] 激活 `tests/unit/cli-6-2.test.ts`：匹配 manifest、版本不匹配和 offline cache miss。
- [x] 与 Story 6.1 测试合并执行：9 passed，0 failed。

## Deferred by story boundary

归档构建/解压、远程 Release URL policy 和发布流水线分别由 Story 6.3–6.5 负责；本 Story 只建立 manifest identity、平台选择和缓存验证边界。
