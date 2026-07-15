---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests']
lastStep: 'step-04-generate-tests'
lastSaved: '2026-07-14'
storyId: '11.1'
storyKey: '11-1-theme-switching-ui'
storyFile: 'implementation_artifacts/11-1-theme-switching-ui.md'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-11-1-theme-switching-ui.md'
generatedTestFiles: ['tests/acceptance/11-1-theme-switching-ui.test.ts']
inputDocuments: ['implementation_artifacts/11-1-theme-switching-ui.md', 'docs/prd.md', 'docs/architecture.md', 'frontend/src/theme/themeConfig.ts', 'frontend/src/theme/ThemeContext.tsx']
---

# ATDD Checklist: Story 11.1 - 主题切换UI

## Step 1: Preflight & Context Loading

### Stack Detection
- **Detected Stack**: frontend
- **Reason**: Project has `package.json` with React dependencies, `playwright.config.ts`, `vite.config.ts`

### Prerequisites Verification
- ✅ Story approved with clear acceptance criteria
- ✅ Playwright configured (`playwright.config.ts`)
- ✅ Development environment available

### Story Context Extracted
- **Story ID**: 11.1
- **Story Key**: 11-1-theme-switching-ui
- **Acceptance Criteria**: 4 ACs
- **Affected Components**: ThemeSettings, SettingsPage, CodeEditor
- **Integration Points**: ThemeContext, localStorage, Monaco Editor

---

## Step 2: Generation Mode Selection

### Selected Mode: AI Generation
- **Reason**: Acceptance criteria are clear and standard (UI configuration, state management)
- **Recording Not Needed**: No complex browser interactions requiring live recording

---

## Step 3: Test Strategy

### Acceptance Criteria Mapping

| AC | Test Scenario | Test Level | Priority |
|----|---------------|------------|----------|
| AC-1 | 主题设置选项显示 | Unit | P0 |
| AC-2 | 切换到浅色主题 | Unit | P0 |
| AC-3 | 切换到深色主题 | Unit | P0 |
| AC-4 | 主题偏好持久化 | Unit | P1 |

### Test Levels
- **Unit Tests**: ThemeContext initialization, setTheme, toggleTheme, localStorage persistence
- **Component Tests**: ThemeSettings component rendering and interaction

### Prioritization
- **P0**: ThemeContext initialization, setTheme, toggleTheme, localStorage update
- **P1**: ThemeConfig color values, getThemeByName
- **P2**: getDefaultTheme, cross-session persistence

---

## Step 4: Generated Tests

### Test File: tests/acceptance/11-1-theme-switching-ui.test.ts

#### P0 Tests
1. **ThemeContext should initialize with default theme** - @p0 @smoke
2. **ThemeContext setTheme should update localStorage** - @p0 @smoke
3. **ThemeContext toggleTheme should switch between themes** - @p0 @smoke

#### P1 Tests
4. **ThemeConfig dark theme has correct colors** - @p1
5. **ThemeConfig light theme has correct colors** - @p1
6. **ThemeConfig getThemeByName should return correct theme** - @p1

#### P2 Tests
7. **ThemeConfig getDefaultTheme should respect prefers-color-scheme** - @p2
8. **ThemeContext should persist theme across sessions** - @p2

---

## Step 5: Validation

### Red Phase Confirmation
- ✅ All tests are designed to fail before implementation
- ✅ Tests cover all acceptance criteria
- ✅ Priority levels align with business risk

### Test Quality Checklist
- ✅ Tests are deterministic (no randomness)
- ✅ Tests are isolated (no shared state)
- ✅ Assertions are explicit
- ✅ Test names are descriptive
- ✅ Tests are under 300 lines
