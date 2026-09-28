# Epic 1 Context: 可靠的项目与技能发现

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

让开发者和 BMAD/Codex 用户能够从统一、可执行且可诊断的项目契约启动 Lapdev、找到当前产物和技能，并明确 legacy 路径的兼容边界。

## Stories

- Story 1.1: 统一运行时命令与项目契约
- Story 1.2: 统一 BMAD 产物目录与迁移映射
- Story 1.3: 统一 Codex/BMAD 技能发现诊断

## Requirements & Constraints

- 根目录、frontend、backend、测试、容器和健康检查命令必须引用真实脚本或明确的目录级命令。
- 端口、版本、BMAD 输出路径和技能路径必须有单一可解释来源。
- `.agents/skills` 是 Codex/BMAD 主来源；`.lapdev/skills` 是标记清晰的 legacy 来源。
- `_agile-output/` 是当前 BMAD 输出根；旧 `implementation_artifacts/` 只能迁移或归档，不能静默丢弃。
- 文档 drift 检查必须能区分当前契约与历史文档。

## Technical Decisions

- Lapdev 保持模块化单体；本 Epic 只建立运行时、产物和技能发现契约，不引入微服务。
- 技能内容由源目录维护，发现层只解析、索引、标记来源和报告错误，不复制或改写源文件。
- 任何路径迁移都必须保留内容和来源信息，且能解释冲突或未迁移状态。

## Cross-Story Dependencies

- Story 1.1 先统一命令、端口和版本来源；Story 1.2 依赖当前输出根可被稳定解析；Story 1.3 依赖项目契约能表达主/legacy 技能来源。
- Epic 2 的 capability policy 和 Epic 4 的扩展 registry 将消费本 Epic 的路径、来源和诊断契约。
