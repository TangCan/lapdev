# E2E 回归测试失败分析报告

## 根因：Playwright 浏览器版本不匹配

**147 个失败中 140+ 是同一个根因：测试环境缺少 Playwright 浏览器可执行文件。**

### 证据链

1. **失败模式**：所有 147 个失败测试耗时均为 `2ms`，即 Playwright 连浏览器都没能启动就失败了
2. **错误信息**：`browserType.launch: Executable doesn't exist at .../chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell`
3. **版本不匹配**：
   - `package.json` 声明 `@playwright/test: ^1.44.0` → 实际安装 `@playwright/test@1.62.1`
   - v1.62.1 期望 chromium **revision 1234**
   - 系统 `.cache/ms-playwright/` 只有 chromium **revision 1223**
   - regression 脚本使用 `npm exec`/`npx` 下载 v1.62.1 → 找 chromium 1234 → 不存在 → 全部失败

### 验证

手动创建 `.playwright-browsers/` 并将 chromium-1223 软链接为 chromium-1234 后：
- 浏览器正常启动，页面正常加载（"Lapdev IDE" 标题显示）
- 文件树正常加载（54 个子项，HTTP 200）
- **实际功能测试通过大部分用例**，仅少量真正功能失败

---

## 修复后的实际失败分析

### 分类

| 类别 | 数量 | 说明 |
|------|------|------|
| 浏览器不可用（已修复） | ~140 | chromium 1234 不存在 |
| AI 功能未实现 | ~25 | 缺少 `data-testid="ai-panel-button"` 等 |
| 已知跳过（RED 阶段） | ~24 | `test.skip` 标记的规划中功能 |
| 性能阈值 flaky | ~3 | Vitest 性能测试 `VirtualList` |

### 具体失败用例

#### 1. Agent File Reading（4 个失败）
- **错误**：`waitForSelector('[data-testid="ai-panel-button"]')` 超时
- **根因**：页面有 "🤖 AI" 按钮但无 `data-testid="ai-panel-button"`
- **状态**：AI 面板功能未实现或 testid 未添加

#### 2. Agent Operation Log（6 个失败）
- **错误**：`waitForSelector('[data-testid="operation-log-panel"]')` 超时
- **根因**：操作日志面板不存在
- **状态**：功能未实现

#### 3. AI Chat Panel（10 个失败）
- **错误**：`waitForSelector('[data-testid="ai-chat-panel"]')` 超时
- **根因**：AI 聊天面板不存在
- **状态**：功能未实现

#### 4. AI Config（多个失败）
- **错误**：`waitForSelector('[data-testid="ai-config-panel"]')` 超时
- **根因**：AI 配置面板不存在
- **状态**：功能未实现

#### 5. Skill 自动匹配（6 个失败）
- **错误**：`waitForSelector('[data-testid="skill-match-panel"]')` 超时
- **根因**：技能匹配面板不存在
- **状态**：功能未实现

#### 6. React 19/Compiler 冒烟测试（多个失败）
- **错误**：特定 React 19 特性验证失败
- **状态**：需要实现 React 19 兼容性

#### 7. 终端/编辑器 LSP 测试（多个失败）
- **错误**：终端命令执行、LSP hover 等功能
- **状态**：需要实现或修复

---

## 与 EPI4/EPI5 代码变更的关系

| 变更 | 影响 |
|------|------|
| IDE.tsx 拆分 (EPI5) | ✅ 无影响 — 测试页面正常加载 |
| Context → Zustand (EPI4) | ✅ 无影响 — 状态管理正常 |
| handleFileTree try/catch | ✅ 生效 — 文件树正常加载 |
| E2E 测试修复 (14→0) | ✅ 生效 — 虚拟滚动测试全部通过 |

---

## 建议

1. **紧急**：更新 `package.json` 锁定 `@playwright/test` 到与系统 chromium 1223 兼容的版本（如 1.52.x），或在 CI 中运行 `playwright install chromium`
2. **短期**：实现 AI 面板相关功能或添加缺失的 `data-testid`
3. **长期**：将 E2E 测试与功能实现解耦 — RED 阶段测试应使用 `test.fixme()` 明确标记
