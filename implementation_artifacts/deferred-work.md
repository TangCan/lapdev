# Deferred Work

## Deferred from: code review of 5-1-bmad-one-click (2026-06-08)

- Skill自动注册未实现 — 后端版本缺少registerBMADSkills方法（需要Story 5.2）
- 代码重复 — 前后端bmadService.ts几乎相同（架构问题，需要重构）
- 缺少安装进度反馈 — 只有日志输出，无进度百分比（P2优先级，可延后）
- 安装日志可能包含敏感信息 — 未过滤敏感信息（安全增强，非阻塞）
- ALLOWED_ORIGINS格式验证 — 环境变量格式未验证（配置问题，非阻塞）

## Deferred from: code review of 7-1-terminal-tab-management (2026-07-06)

- WebSocket输出路由可能混乱 — 当后端返回的二进制输出不包含sessionId时，所有输出都发送到活动Tab，在多Tab场景下会导致输出混乱（后端应确保输出包含sessionId，架构层面问题）