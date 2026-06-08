# ATDD 验收测试 - Story 5.1: BMAD一键启用

## 📋 测试概览

| 项目 | 值 |
|------|-----|
| **Story ID** | 5.1 |
| **Story Key** | 5-1-bmad-one-click |
| **测试类型** | 验收测试 (ATDD) |
| **测试阶段** | Red Phase |
| **创建日期** | 2026-06-05 |

---

## ✅ 验收测试用例

### 场景1: BMAD面板显示状态

#### TC-5.1.1: BMAD未安装时显示启用按钮
**测试目标**: 验证当项目未安装BMAD时，面板显示正确状态

```typescript
describe('BMAD Panel - Not Installed State', () => {
  it('should display enable button when _bmad directory does not exist', async () => {
    // Given
    await setupEmptyProject(); // 确保项目根目录无_bmad文件夹
    
    // When
    const panel = await openBMADPanel();
    
    // Then
    expect(panel.status).toBe('not-installed');
    expect(panel.hasEnableButton()).toBe(true);
    expect(panel.getStatusText()).toBe('当前未启用BMAD');
  });
});
```

#### TC-5.1.2: BMAD已安装时显示管理按钮
**测试目标**: 验证当项目已安装BMAD时，面板显示正确状态

```typescript
describe('BMAD Panel - Installed State', () => {
  it('should display manage button when _bmad directory exists', async () => {
    // Given
    await setupProjectWithBMAD(); // 确保项目根目录有_bmad文件夹
    
    // When
    const panel = await openBMADPanel();
    
    // Then
    expect(panel.status).toBe('installed');
    expect(panel.hasManageButton()).toBe(true);
    expect(panel.hasEnableButton()).toBe(false);
  });
});
```

---

### 场景2: 一键启用BMAD

#### TC-5.1.3: 点击启用按钮显示安装进度
**测试目标**: 验证点击启用按钮后显示安装进度

```typescript
describe('BMAD Enable Flow', () => {
  it('should show installation progress when enable button is clicked', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    
    // Then
    expect(panel.isInstalling()).toBe(true);
    expect(panel.hasProgressIndicator()).toBe(true);
    expect(panel.hasInstallationLog()).toBe(true);
  });
});
```

---

### 场景3: 在线安装成功

#### TC-5.1.4: 安装成功后创建_bmad目录
**测试目标**: 验证安装成功后项目下生成_bmad目录

```typescript
describe('BMAD Online Installation', () => {
  it('should create _bmad directory when installation succeeds', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockSuccessfulInstallation(); // 模拟安装成功
    
    // Then
    expect(await fs.exists('./_bmad')).toBe(true);
    expect(await fs.exists('./_bmad/core')).toBe(true);
    expect(await fs.exists('./_bmad/skills')).toBe(true);
  });
});
```

#### TC-5.1.5: 安装成功后自动注册BMAD技能
**测试目标**: 验证安装成功后BMAD技能自动注册

```typescript
describe('BMAD Skill Registration', () => {
  it('should register BMAD skills after successful installation', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockSuccessfulInstallation();
    
    // Then
    const skillService = getSkillService();
    const bmadSkills = skillService.getSkillsByTag('bmad');
    
    expect(bmadSkills.length).toBeGreaterThan(0);
    expect(bmadSkills.some(s => s.id === 'bmad-quick-flow')).toBe(true);
  });
});
```

#### TC-5.1.6: 安装成功后更新面板状态
**测试目标**: 验证安装成功后面板状态更新

```typescript
describe('BMAD Panel Status Update', () => {
  it('should update panel status to installed after successful installation', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockSuccessfulInstallation();
    
    // Then
    expect(panel.status).toBe('installed');
    expect(panel.hasSuccessMessage()).toBe(true);
    expect(panel.getSuccessMessage()).toContain('安装成功');
  });
});
```

---

### 场景4: 安装失败降级

#### TC-5.1.7: 安装失败显示降级提示
**测试目标**: 验证安装失败时显示降级提示

```typescript
describe('BMAD Installation Failure', () => {
  it('should show downgrade warning when online installation fails', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockFailedInstallation(); // 模拟安装失败
    
    // Then
    expect(panel.hasWarningMessage()).toBe(true);
    expect(panel.getWarningMessage()).toContain('在线安装失败');
    expect(panel.getWarningMessage()).toContain('离线降级');
  });
});
```

---

### 场景5: BMAD技能集成

#### TC-5.1.8: 安装成功后AI面板加载BMAD技能
**测试目标**: 验证安装成功后AI面板可查看BMAD技能

```typescript
describe('BMAD Skill Integration with AI Panel', () => {
  it('should load BMAD skills in AI panel after installation', async () => {
    // Given
    await setupProjectWithBMAD();
    
    // When
    const aiPanel = await openAIPanel();
    
    // Then
    const availableSkills = aiPanel.getAvailableSkills();
    const bmadSkills = availableSkills.filter(s => s.category === 'BMAD');
    
    expect(bmadSkills.length).toBeGreaterThan(0);
    expect(bmadSkills.some(s => s.name === 'BMAD Quick Flow')).toBe(true);
  });
});
```

---

## 🧪 测试辅助工具

### 测试数据设置

```typescript
// 测试辅助函数
async function setupEmptyProject(): Promise<void> {
  // 创建临时测试目录
  // 确保目录为空（无_bmad文件夹）
}

async function setupProjectWithBMAD(): Promise<void> {
  // 创建包含_bmad目录的测试项目
  // 模拟已安装BMAD的状态
}

async function mockSuccessfulInstallation(): Promise<void> {
  // 模拟npx命令成功执行
  // 创建_bmad目录结构
}

async function mockFailedInstallation(): Promise<void> {
  // 模拟npx命令执行失败
}
```

### 页面对象模型

```typescript
// BMAD面板页面对象
class BMADPanel {
  status: 'not-installed' | 'installing' | 'installed' | 'error';
  
  hasEnableButton(): boolean;
  hasManageButton(): boolean;
  hasProgressIndicator(): boolean;
  hasInstallationLog(): boolean;
  hasSuccessMessage(): boolean;
  hasWarningMessage(): boolean;
  
  getStatusText(): string;
  getSuccessMessage(): string;
  getWarningMessage(): string;
  
  clickEnableButton(): Promise<void>;
  clickManageButton(): Promise<void>;
  
  isInstalling(): boolean;
}

// AI面板页面对象
class AIPanel {
  getAvailableSkills(): Skill[];
}
```

---

## 📊 测试覆盖矩阵

| 验收场景 | 测试用例 | 优先级 | 状态 |
|----------|----------|--------|------|
| BMAD未安装时显示启用按钮 | TC-5.1.1 | P0 | ✅ 已定义 |
| BMAD已安装时显示管理按钮 | TC-5.1.2 | P0 | ✅ 已定义 |
| 点击启用按钮显示安装进度 | TC-5.1.3 | P0 | ✅ 已定义 |
| 安装成功后创建_bmad目录 | TC-5.1.4 | P0 | ✅ 已定义 |
| 安装成功后自动注册BMAD技能 | TC-5.1.5 | P0 | ✅ 已定义 |
| 安装成功后更新面板状态 | TC-5.1.6 | P0 | ✅ 已定义 |
| 安装失败显示降级提示 | TC-5.1.7 | P1 | ✅ 已定义 |
| AI面板加载BMAD技能 | TC-5.1.8 | P1 | ✅ 已定义 |

---

## 📁 测试文件结构

```
tests/
├── acceptance/
│   └── 5-1-bmad-one-click.atdd.ts    # 验收测试文件（本文件）
├── unit/
│   └── bmadService.test.ts           # BMAD服务单元测试
└── e2e/
    └── bmad-one-click.spec.ts         # E2E测试
```

---

## ✅ 完成状态

- **Status**: Red Phase (待实现)
- **Completion Note**: 验收测试脚手架已创建，包含8个测试用例，覆盖所有验收标准场景