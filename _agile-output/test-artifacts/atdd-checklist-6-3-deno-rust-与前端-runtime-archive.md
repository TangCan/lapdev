---
storyKey: "6-3-deno-rust-与前端-runtime-archive"
status: "implemented"
---

# Story 6.3 ATDD Checklist

- [x] 从 Epic 6 和 runtime contract 提取 target、archive layout、FFI 和 health acceptance。
- [x] 生成并激活 archive builder/verifier contract tests：4 passed。
- [x] 实际构建 Linux x64 archive，包含 frontend dist、compiled Deno server 和 Rust release library。
- [x] 从 clean temporary extraction 启动 archive，localhost health check 通过。
- [x] 完整回归通过：frontend 684、backend 45、unit 164、API 4、E2E 175；41 项按现有配置跳过。

## Deferred by story boundary

Release checksum finalize、GitHub Release 上传、远程下载 policy 和 npm publish 属于 Story 6.4–6.6。
