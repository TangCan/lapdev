---
title: '隔离发布夹具 Git 自动维护生命周期'
type: 'bugfix'
created: '2026-09-30'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

CI 运行 36697946904 两次在临时夹具 rmSync 后 existsSync(root) 仍为 true 处失败，阻止平台构建；此前同工具版本运行 36697156609 成功。用户同意继续调查和修复。

在发布验收的临时 Git 夹具初始化中禁止自动维护派生后台进程，保证该夹具不依赖脱离进程；仅作用于夹具 Git 调用，不修改系统或用户 Git 配置。补充真实 Git trace 回归验证不启动 maintenance/gc，并保留 Git 状态/差异、原环境隔离及根目录删除断言。不得通过跳过断言、增加等待、扩大权限、修改生产后端、升级工具或关闭工作流掩盖失败。记录尚未复现的 CI 根因，不能将消除已证实后台进程风险冒充已证实修复 CI。此次本地实现、验证与提交，不自动推送或发布；远端 CI 复验另需授权。

</frozen-after-approval>

## Implementation Notes

评审补丁最终复验：Git 传统 builtin trace 会省略顶层 -c 参数，因此精确参数证明使用 GIT_TRACE2_EVENT 的真实 start.argv，而非错误要求 builtin 行包含参数。原 trace 继续检查无 maintenance/gc，Trace2 检查仅三次进程启动且逐条带两个 override。最终默认 Git 四文件 34/34、Git 2.55.0 定向 1/1、git diff --check 通过。此 done 仅表示局部生命周期加固、测试和本地评审完成，CI 原失败是否解决仍待明确推送授权后的远端验证；未发布或修改运行权限。

已完成验证：`node --test tests/release-runtime-acceptance.test.mjs tests/release-listener.test.mjs tests/release-packaging.test.mjs tests/cli-download.test.mjs` 为 34 passed、0 failed/0 skipped；同命令在 PATH 指向临时 Git 2.55.0 时亦 34 passed。新增定向用例在 Git 2.55.0 下 1 passed。加固后 100 次 prepareFixtures→rmSync→existsSync 循环均通过，断言 Git 初始化成功和根不存在。未修改前延迟检查 200 次也未复现目录重建，不能据本地循环宣称 CI 根因已确认。内存副本去掉两个 -c 设置后，真实 Git trace 出现 maintenance 调用，证明新检测可抓到回归。暂存 trace 只含合成夹具/命令，未打印真实环境或凭据。

远端状态仍为运行 36697946904 两次失败；本次无推送。待明确授权后提交推送验证，若仍失败应追加安全的剩余目录结构和进程生命周期诊断，而非删除不存在断言或盲目重试。见 [后续工作记录](deferred-work.md)。

## Review Triage Log

- B1 false：审查提出缺少正向检测证据；主会话已对内存源码移除加固并观察真实 maintenance trace，检测器能够辨认维护启动，四文件测试正常通过；未自动化 mutation 不等于无敏感性验证。
- B2 low / patch：删除 gc.auto=0 而保留 maintenance.auto=false 时 aggregate 无维护断言确实仍可通过，不能保护计划中的 fallback 参数；每条 init/add/commit trace 追加精确参数断言及三条 builtin 数量断言，不增加 API 或等待。
- B3 low / defer：原规格记录了计划而没有完整结果与延期链接，确有证据交接不足；规格建议不触发代码改造，正常交接追加命令、结果与未知 CI 根因记录。

调查：成功/失败运行的 Node 24.21.0、Git 2.55.0、Ubuntu image 20260920.314.1、动作 SHA 均相同；两次失败为 tests/release-runtime-acceptance.test.mjs:80。文档提交不含运行代码变化。本地 Node 24.16.0/Git 2.43.0 的 100 次循环及临时编译 Git 2.55.0 的 100 次循环均未复现。strace 确认 Git 2.55.0 commit 启动 maintenance run --auto --quiet --detach，维护进程 fork 后父进程先返回；未取得重建目录的调用证据。

改动范围仅 scripts/release-runtime-acceptance.mjs 与 tests/release-runtime-acceptance.test.mjs，以及本规格/延期记录。对 prepareFixtures 的所有 Git 调用使用命令级 maintenance.auto=false 和 gc.auto=0，复用既有超时/隔离环境。测试使用临时 GIT_TRACE 文件记录 Git 命令，验证真实 init/add/commit 成功、只有预期初始化命令、不派生维护，读取只断言命令且不打印 trace 或环境；finally 删除自己的临时目录并断言不存在。再运行发布四文件 33 项以上、同版本 Git 针对测试及重复夹具压力验证。官方自动维护配置说明：https://git-scm.com/docs/git-maintenance/2.50.0 。临时编译工具位于 /tmp/lapdev-git-recon.ABypKF，不替换系统工具。
