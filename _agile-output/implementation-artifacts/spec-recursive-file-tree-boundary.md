---
title: '递归文件树工作区边界保护'
type: 'bugfix'
created: '2026-09-30'
status: 'done'
baseline_commit: '603da238c093c763aaaa32ef3e476610c1aa79c8'
route: 'dispatch'
review_loop_iteration: 1
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** getFileTree 仅验证请求根路径；递归子项直接 stat/readDir，可能跟随外部链接泄露文件名、目录结构和元数据。parseGitignore 还可能通过链接读取外部规则文件。

**Approach:** 在递归读取的每层及规则文件读取前复用 WorkspaceBoundary，拒绝越界访问，保留工作区内部链接和现有文件树契约。

## Boundaries & Constraints

**Always:** 工作区 root/id 是唯一授权范围；校验先于跟随链接的 stat、readDir、readTextFile。保留内部文件/目录链接、链接形式的工作区根、逻辑 /workspace 路径、目录优先排序、隐藏项过滤、已有忽略规则及深度限制。根请求越界仍返回现有安全错误，不回显外部规范路径。循环通过当前递归祖先的 canonical 目录集合识别，循环节点返回空 children，不阻止其他分支访问同一合法目录。

**Never:** 不扩大 Deno 权限、修改认证或前端/API schema，不删除/修改工作区内容，不改变其他文件写入操作，不宣称解决校验与 I/O 之间的路径替换竞态，不提交测试归档或发布资产。

**用户决定:** 遍历遇到越界、悬空或无法安全解析的子项时，跳过该项并继续返回合法树，不新增诊断字段；不因该项阻断其他合法文件的浏览。这不改变请求根拒绝或其他普通 I/O 错误的既有处理。

## I/O & Edge-Case Matrix

| 场景 | 状态 | 输出/处理 |
|---|---|---|
| 普通树 | 合法目录与文件 | 原有结构、排序和元数据 |
| 内部链接 | 文件或目录目标仍在 root 内 | 保留逻辑链接路径并正常读取 |
| 请求根越界 | 外部链接、遍历或主机绝对路径 | 现有 error，无外部数据 |
| 不安全子项 | 越界、悬空或无法安全解析 | 不跟随读取，跳过该项，继续返回其他合法节点 |
| 内部循环 | 链接指向当前祖先 | 循环节点不展开，其他合法分支保留 |
| 外部规则 | .gitignore 指向 root 外 | 不读取；按无可用规则继续，沿用可选规则失败行为 |
| 深度为零 | 合法目录 | children 为空，不读取子项及规则 |
| 根为链接 | 配置 root 指向合法真实目录 | 以 canonical root 判断边界，输出逻辑 /workspace 路径 |

</frozen-after-approval>

## Code Map

- `backend/src/services/fileService.ts`：getFileTree/sanitizePath、readDirRecursive、parseGitignore、toWorkspacePath；当前 rootPath 参数未用于边界检查。复用现有单例 WorkspaceBoundary，绝不能把真实主机路径当作外部 handle 再授权。内部构造的逻辑句柄应基于相同 root；深度及排序不重写。
- `backend/src/security/workspaceBoundary.ts`：resolve/normalize 是外部句柄入口，会把反斜杠规范为分隔符；不得用它重新解释 readDir 给出的 POSIX 字面文件名。增加仅供内部目录遍历使用的精确现存路径校验方法，要求同 workspaceId、词法 root 内及 canonical root 内；拒绝不存在/悬空/无法解析项。共享 canonical 判定，保持现有 resolve/normalize 语义和外部句柄限制不变，不把内部方法接入客户端路径入口。
- `backend/src/security/workspaceBoundary.test.ts`：已有内部/外部链接与 alias root 兼容断言，必须保留。
- `backend/src/handlers/fileHandler.ts`：handleFileTree 成功 200、服务错误 400；无部分结果诊断协议，不扩展响应。
- `tests/unit/fileService.test.ts`：旧安全测试在 backend 默认扫描范围外，深度断言宽松，不能替代新增确定性回归。
- `backend/src/services/fileService.test.ts`：新增根测试入口实际发现的测试文件；配置环境须在动态导入服务之前设置（服务在模块加载时固定 workspace），恢复环境并只清理自己创建的临时目录。
- `_agile-output/implementation-artifacts/deferred-work.md`：RB8/B7 原发现保留，以追加解决记录更新；路径替换竞态 B8 不关闭。

## Tasks & Acceptance

**Execution:**
- [x] `backend/src/security/workspaceBoundary.ts`、`workspaceBoundary.test.ts` — 增加并测试内部精确现存路径校验；验证字面文件名不重解释、拒绝越界/错误 workspace/悬空、接受内部链接和 alias root — 外部入口限制保持原样。
- [x] `backend/src/services/fileService.ts` — 用精确边界校验目录读出的实际路径及规则路径，逻辑输出拼接实际 entry.name；分支祖先集合阻止循环；请求根异步等待后若 normalize 失败明确安全 error — 不误读同名分隔路径或返回 null handle。
- [x] `backend/src/services/fileService.test.ts` — 保留全部原矩阵，新增 POSIX 字面反斜杠文件/目录与 a/b 冲突、内部链接下规则及子项、root normalize 失效、readDir 创建与迭代中抛错回归；读取观察记录应在最终断言中捕获被可选规则 catch 吞掉的违规尝试 — 证明普通 I/O 错误仍整树失败。
- [x] `_agile-output/implementation-artifacts/release-runtime-core-acceptance.md`、`deferred-work.md` — 标明首次包是评审前历史；新独立目录 recursive-tree-boundary-review-final-20260930 构建及验收，记录两个生产文件和固定基线差异哈希 — 不覆盖旧资产，不关闭路径替换竞态。

**Acceptance Criteria:**
- Given root 合法但后代指向外部或存在悬空/无法安全解析的子项，when 请求文件树，then 跳过不安全子项并返回其余合法树，不读取外部目标内容/元数据或目录，也不返回外部后代、大小或真实路径。
- Given 合法内部链接及同一目标的不同分支，when 遍历，then 合法链接保留，只有当前祖先循环截断，深度上限仍有效。
- Given 外部 .gitignore 含隐藏合法文件的合成规则，when 遍历，then 不读取该文件且不使用其规则；普通内部规则仍有效。
- Given 现有权限与 API，when 执行完整回归，then 既有边界、认证及发布门禁不退化，无权限扩张。

## Implementation Notes

第二轮实现：内部 validateExistingPath 精确验证现存路径并返回 canonical 路径，外部 resolve/normalize 不变；递归和规则使用实际目录项路径，输出保留字面名称；normalize null 明确报安全错误。新增名称冲突、身份/边界、根失效和普通目录读取异常回归。实现代理复验定向 6/2、后端 59/87、Node 33、门禁 4、新独立 Linux 实包 22/22；待主会话独立复验及第二轮评审，不以首轮结果收尾。

2026-09-30：递归使用由同一 WorkspaceBoundary 解析的逻辑句柄，规则读取前同样解析；子项解析失败跳过，解析后的普通 stat/readDir 错误仍返回服务错误。每分支复制 canonical 祖先集合，循环目录返回空 children；合法别名分支分别展开。未修改共享边界策略、权限、认证、schema 或其他写入操作。

## Spec Change Log

2026-09-30，iteration 1：B1/E1 证实 readDir 的字面反斜杠名称被 resolve 重解释，原 Code Map 错把外部句柄接口当作内部路径接口。技术方案增加内部精确路径校验并保留原外部入口语义；重派实现。KEEP：跳过不安全子项、外部 .gitignore 不读取、内部链接和 alias root、逻辑路径、分支循环截断、深度/排序/隐藏项/元数据、真实外部读取观察及普通 I/O 失败断言全部保留。E2 明确增加 normalize null 拒绝；B5 增强 readDir 错误测试。冻结意图不变。首轮 58/87、实包与哈希只属历史。

## Review Triage Log

| ID | verdict | route | 证据 |
|---|---|---|---|
| B1 | medium | bad_spec | resolve replaceAll 反斜杠，Linux 原名称 a\\b 会解析为 a/b，导致合法项漏失或错误身份；内部精确校验需新的共享边界方法，非简单局部补丁。 |
| B2 | medium | defer | 分支别名造成重复展开，但原递归已跟随所有链接且无节点预算；当前祖先循环截断减少遍历，不是新增问题。 |
| B3 | medium | defer | NaN 深度 clamp 不生效，基线 getFileTree 已原样存在；新增树未引入。 |
| B4 | false | reject | reads 在 observe 抛错前已记录，最终断言明确匹配外部目录/文件、根外部 .gitignore、悬空和无法解析路径，规则 catch 吞异常仍会被 reads 断言发现。 |
| B5 | low | patch | 新测试只有普通 stat 失败，缺少 readDir 创建/迭代失败的精确信号；循环不 catch 这些错误，补直接错误回归。本轮 loopback 后按任务覆盖。 |
| B6 | false | reject | git ls-files runtime-archives 为空，统一差异要求列出未跟踪摘要，不代表暂存或提交；用户批准保留归档且不提交。 |
| B7 | low | reject | 实现代理过早标 done 已由主会话恢复 in-review，文档为已完成实现交接而非评审完成；最终收尾统一记录，不以编辑规格作为修复。 |
| E1 | medium | bad_spec | 同 B1，实际名称必须保留，不得外部句柄规范化；同根因合并重派。 |
| E2 | medium | patch | exists await 后 normalize 可为 null，非空断言仅 TypeScript，无运行时防护，可能返回 null path；增加明确 root error 回归。 |
| E3 | high | defer | 子项验证后替换链接竞态在原读树及共享边界已有，用户冻结范围明确不含原子 I/O，B8 继续开放。 |
| E4 | high | defer | .gitignore 校验后替换竞态，原实现无校验已可读外部规则，当前静态修复不提供原子打开；独立记录。 |

第二轮评审逐项分类（主会话）：

| ID | verdict | route | 证据 |
|---|---|---|---|
| B2-1 | high | defer | 外部 resolve 把反斜杠变分隔符、原树返回字面路径均在基线已存在；本轮递归精确校验不改变其他文件操作。树到读写往返需独立句柄兼容决策，不能扩大当前接口。 |
| B2-2 | maybe-false | defer | 新增逐项同步 realPath 可增加事件循环阻塞，但无规模/时延证据确定严重程度；暂按 medium unverified 留存，需大树和慢文件系统响应测量，不据此宣称已性能验证。 |
| B2-3 | low | patch | 当前只测试 root 外部规则，嵌套普通/alias 分支仍应证明可选 catch 不隐藏外部读取；补小型夹具与最终读取记录断言。 |
| B2-4 | medium | patch | 根请求不能证明子树初始逻辑前缀正确；补目录/alias/文件/相对请求的路径断言。 |
| B2-5 | low | patch | readDir 创建/迭代错误只在 root 注入，补已返回其他分支后嵌套错误，证明无成功部分树。 |
| B2-6 | low | reject | 只要求编辑本规格，按工作流拒绝；首轮结果将作为历史保留，当前主会话最终结果追加，不改变测试结论。 |
| B2-7 | low | patch | 第一轮 structured done 和后续 pending 混杂；收尾时明确第一轮记录为历史，新增结构化最终记录。 |
| E2-1 | high | defer | carried：同 E3/E4，静态校验与后续路径 I/O 可替换竞态仍存在，非本轮引入，冻结意图不提供原子 I/O；不重复修复。 |
| V2-1 | medium | patch | 验证审已给出路径前缀变异仍通过根测试的证据；补 /workspace/dir 与 alias-one 全路径断言，同 B2-4 共因。 |

第一轮 B1/E1 已重派修正，E2 明确 root null 拒绝、B5 readDir 普通错误回归通过。第二轮无 intent_gap/bad_spec，测试覆盖补丁后全量复验；路径竞态、往返和性能问题单独留存。

## Verification

最终结果：第二轮三路评审完成，覆盖补丁已核验。主会话补丁后独立全后端 59 passed（87 steps）、Node 四文件 33 passed（0 skipped）、权限门禁 4 passed、归档校验、CLI 安装/启动/健康/首页及实包核心 22/22 全通过，全部退出码 0。两份生产源码与新归档 cmp 一致、git diff --check 通过。B2-3/4/5 与 V2-1 由补丁覆盖，文档阶段状态已统一。路径竞态、字面句柄往返、遍历预算/非法深度和未测性能单独留存；本规格实现完成。下方 5/58 为第一轮历史。

- `npm run test:backend -- src/services/fileService.test.ts src/security/workspaceBoundary.test.ts`：所有矩阵实际执行，不跳过。
- `npm run test:backend`：全量通过。
- `node --test tests/release-runtime-acceptance.test.mjs tests/release-listener.test.mjs tests/release-packaging.test.mjs tests/cli-download.test.mjs`、`./scripts/release-permission-gate.sh`、`git diff --check`：通过。
- Linux runtime 在新独立归档目录构建、verify-runtime-archive、npm pack、smoke-release-cli：安装/启动/健康/首页及原核心验收通过，包内生产源码与工作区一致并记录哈希；新增链接矩阵由服务测试证明。macOS、公开安装、真实 LSP 与并发路径替换不在此验证承诺内。

实际结果（2026-09-30）：定向测试 5 passed（2 steps），后端全量 58 passed（87 steps），Node 33 passed，权限门禁 4 passed，全部 0 failed/0 skipped；git diff --check 通过。独立 Linux 实包核心 22/22，退出码 0。资产及源码哈希、复现命令与覆盖限制已追加至 release-runtime-core-acceptance.md；RB8/B7 追加解决记录，B8 保持开放。首次测试类型检查失败已通过给动态导入添加模块类型修正，最终所有测试实际执行。
