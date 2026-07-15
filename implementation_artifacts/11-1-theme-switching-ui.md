# Story 11.1: 主题切换UI

## 基本信息

- **Story ID**: 11.1
- **Story Key**: 11-1-theme-switching-ui
- **Epic**: Epic 11 - 主题切换
- **Status**: ready-for-dev
- **创建日期**: 2026-07-14
- **所属功能需求**: FR-006, UX-DR2

---

## 用户故事

As a 个人开发者,
I want 在设置面板中切换主题,
So that 我可以根据环境和偏好选择合适的主题。

---

## 验收标准

### AC-1: 主题设置选项显示

**Given** 用户打开设置面板
**When** 找到主题设置选项
**Then** 显示主题选择下拉菜单，包含"浅色"和"深色"选项
**And** 当前选中的主题有明显标识

### AC-2: 切换到浅色主题

**Given** 用户选择"浅色"主题
**When** 确认选择
**Then** Monaco编辑器切换到浅色主题（如 "vs"）
**And** IDE整体样式切换为浅色模式
**And** 页面背景变为白色
**And** 文字颜色变为深色

### AC-3: 切换到深色主题

**Given** 用户选择"深色"主题
**When** 确认选择
**Then** Monaco编辑器切换到深色主题（如 "vs-dark"）
**And** IDE整体样式切换为深色模式
**And** 页面背景变为深色
**And** 文字颜色变为浅色

### AC-4: 主题偏好持久化

**Given** 用户切换主题
**When** 刷新页面
**Then** 主题偏好从localStorage恢复
**And** 页面加载时应用用户选择的主题

---

## 技术要求

### 技术栈

| 模块 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18 |
| 构建工具 | Vite | 6.x |
| 样式 | Tailwind CSS | 3.x |
| 状态管理 | React Context | - |
| 代码编辑器 | Monaco Editor | 0.45.x |

### 架构约束

1. **主题系统已就绪**: 主题上下文和配置已在 `frontend/src/theme/` 目录实现
2. **CSS变量模式**: 使用 `--color-*` CSS变量定义主题颜色，通过 `data-theme` 属性切换
3. **Monaco主题**: 需要调用 `monaco.editor.setTheme()` 切换编辑器主题
4. **localStorage持久化**: 主题名称存储在 `lapdev-theme` key中

### 文件结构

```
frontend/src/
├── theme/
│   ├── ThemeContext.tsx    # ✅ 已存在 - 主题状态管理
│   └── themeConfig.ts      # ✅ 已存在 - 主题配置定义
├── components/
│   └── Settings/
│       └── ThemeSettings.tsx  # ⭐ 新建 - 主题设置组件
├── pages/
│   └── SettingsPage.tsx    # ✅ 更新 - 集成主题设置组件
└── index.css               # ✅ 已存在 - CSS变量定义
```

### API/方法参考

| 方法/API | 位置 | 用途 |
|----------|------|------|
| `useTheme()` | `theme/ThemeContext.tsx` | 获取当前主题状态和切换方法 |
| `setTheme(name)` | `theme/ThemeContext.tsx` | 切换到指定主题 |
| `monaco.editor.setTheme()` | Monaco Editor | 设置编辑器主题 |
| `localStorage.getItem('lapdev-theme')` | 浏览器API | 读取保存的主题 |

---

## 开发指南

### 步骤1: 创建主题设置组件

创建 `frontend/src/components/Settings/ThemeSettings.tsx`:

```tsx
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeName } from '../../theme/themeConfig';

export function ThemeSettings() {
  const { themeName, setTheme } = useTheme();
  
  const themes: { value: ThemeName; label: string; icon: string }[] = [
    { value: 'dark', label: '深色', icon: '🌙' },
    { value: 'light', label: '浅色', icon: '☀️' },
  ];
  
  return (
    <div className="theme-settings">
      <h3>主题</h3>
      <select
        value={themeName}
        onChange={(e) => setTheme(e.target.value as ThemeName)}
      >
        {themes.map((theme) => (
          <option key={theme.value} value={theme.value}>
            {theme.icon} {theme.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 步骤2: 更新设置页面

更新 `frontend/src/pages/SettingsPage.tsx`，集成主题设置组件：

```tsx
import { ThemeSettings } from '../components/Settings/ThemeSettings';
import { useTheme } from '../theme/ThemeContext';

export const SettingsPage: React.FC = () => {
  const { themeName } = useTheme();
  
  return (
    <div className={`min-h-screen ${themeName === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      {/* ... 现有代码 ... */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <ThemeSettings />
        <AIConfigPanel />
      </main>
    </div>
  );
};
```

### 步骤3: 集成Monaco主题切换

在编辑器组件中监听主题变化，调用 `monaco.editor.setTheme()`:

```tsx
import { useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from '../theme/ThemeContext';

export function CodeEditor() {
  const { themeName } = useTheme();
  
  useEffect(() => {
    const monacoTheme = themeName === 'dark' ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(monacoTheme);
  }, [themeName]);
  
  // ... 其他代码 ...
}
```

### 步骤4: 更新CSS样式

确保 `index.css` 中的样式使用CSS变量而非硬编码颜色值。

---

## 测试要求

### 单元测试

| 测试用例 | 描述 | 文件 |
|----------|------|------|
| 主题设置组件渲染 | 验证下拉菜单显示正确选项 | `components/Settings/ThemeSettings.test.tsx` |
| 主题切换功能 | 验证选择后调用setTheme | `components/Settings/ThemeSettings.test.tsx` |
| Monaco主题同步 | 验证主题切换时Monaco更新 | `components/Editor/CodeEditor.test.tsx` |

### 集成测试

| 测试用例 | 描述 |
|----------|------|
| 主题切换完整流程 | 用户选择主题 → IDE样式变化 → 编辑器主题变化 |
| localStorage持久化 | 切换主题后刷新页面 → 主题保持不变 |

---

## 依赖关系

### 前置依赖

| 依赖项 | 状态 | 说明 |
|--------|------|------|
| ThemeContext | ✅ 已完成 | 主题状态管理上下文 |
| themeConfig | ✅ 已完成 | 主题配置定义 |
| index.css | ✅ 已完成 | CSS变量定义 |
| SettingsPage | ✅ 已存在 | 设置页面框架 |

### 后置影响

| 受影响模块 | 说明 |
|------------|------|
| CodeEditor | 需要监听主题变化更新Monaco |
| IDE布局组件 | 需要使用CSS变量 |

---

## 代码审查关注点

1. **主题一致性**: 确保所有组件都使用CSS变量而非硬编码颜色
2. **Monaco同步**: 验证Monaco编辑器主题与IDE主题同步
3. **性能**: 主题切换不应导致明显的页面闪烁
4. **无障碍**: 确保主题切换后的对比度符合WCAG标准
5. **浏览器兼容性**: 验证localStorage和CSS变量在目标浏览器中可用

---

## 完成标准

- [x] 主题设置组件已创建并集成到设置页面
- [x] 下拉菜单显示"浅色"和"深色"选项
- [x] 选择主题后IDE整体样式切换
- [x] 选择主题后Monaco编辑器主题切换
- [x] 主题偏好持久化到localStorage
- [x] 刷新页面后主题从localStorage恢复
- [x] 单元测试通过
- [x] 代码审查通过（已修复2个patch问题）

---

**Story状态**: done
**最后更新**: 2026-07-14
