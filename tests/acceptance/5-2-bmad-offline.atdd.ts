# ATDD 验收测试 - Story 5.2: BMAD离线降级

## 📋 测试概览

| 项目 | 值 |
|------|-----|
| **Story ID** | 5.2 |
| **Story Key** | 5-2-bmad-offline |
| **测试类型** | 验收测试 (ATDD) |
| **测试阶段** | Red Phase |
| **创建日期** | 2026-06-08 |

---

## ✅ 验收测试用例

### 场景1: 在线安装失败触发降级

#### TC-5.2.1: 网络不可用时触发降级策略
**测试目标**: 验证网络不可用时自动切换到离线模式

```typescript
describe('BMAD Offline Fallback - Network Failure', () => {
  it('should trigger offline fallback when network is unavailable', async () => {
    // Given
    await setupEmptyProject();
    await mockNetworkFailure(); // 模拟网络不可用
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    
    // Then
    expect(panel.hasWarningMessage()).toBe(true);
    expect(panel.getWarningMessage()).toContain('在线安装失败');
    expect(panel.getWarningMessage()).toContain('离线降级');
    expect(panel.isInstallingOffline()).toBe(true);
  });
});
```

#### TC-5.2.2: Node.js不可用时触发降级策略
**测试目标**: 验证Node.js不可用时自动切换到离线模式

```typescript
describe('BMAD Offline Fallback - Node.js Unavailable', () => {
  it('should trigger offline fallback when Node.js is not available', async () => {
    // Given
    await setupEmptyProject();
    await mockNodeJSUnavailable(); // 模拟Node.js不可用
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    
    // Then
    expect(panel.hasWarningMessage()).toBe(true);
    expect(panel.getWarningMessage()).toContain('离线降级');
    expect(panel.isInstallingOffline()).toBe(true);
  });
});
```

#### TC-5.2.3: 安装超时时触发降级策略
**测试目标**: 验证安装超时时自动切换到离线模式

```typescript
describe('BMAD Offline Fallback - Timeout', () => {
  it('should trigger offline fallback when installation times out', async () => {
    // Given
    await setupEmptyProject();
    await mockInstallationTimeout(); // 模拟安装超时
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await waitForTimeout();
    
    // Then
    expect(panel.hasWarningMessage()).toBe(true);
    expect(panel.getWarningMessage()).toContain('超时');
    expect(panel.getWarningMessage()).toContain('离线降级');
  });
});
```

---

### 场景2: 离线降级安装

#### TC-5.2.4: 离线安装创建_bmad/core目录
**测试目标**: 验证离线安装时创建_bmad/core目录

```typescript
describe('BMAD Offline Installation', () => {
  it('should create _bmad/core directory during offline installation', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockOfflineInstallation(); // 模拟离线安装
    
    // Then
    expect(await fs.exists('./_bmad')).toBe(true);
    expect(await fs.exists('./_bmad/core')).toBe(true);
  });
});
```

#### TC-5.2.5: 离线安装包含quick-flow工作流
**测试目标**: 验证离线安装包含quick-flow工作流

```typescript
describe('BMAD Offline Installation - Quick Flow', () => {
  it('should include quick-flow workflow in offline installation', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockOfflineInstallation();
    
    // Then
    expect(await fs.exists('./_bmad/core/quick-flow.skill.md')).toBe(true);
  });
});
```

#### TC-5.2.6: 离线安装包含developer智能体
**测试目标**: 验证离线安装包含developer智能体

```typescript
describe('BMAD Offline Installation - Developer Agent', () => {
  it('should include developer agent in offline installation', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockOfflineInstallation();
    
    // Then
    expect(await fs.exists('./_bmad/core/developer.skill.md')).toBe(true);
  });
});
```

#### TC-5.2.7: 离线安装包含pm智能体
**测试目标**: 验证离线安装包含pm智能体

```typescript
describe('BMAD Offline Installation - PM Agent', () => {
  it('should include pm agent in offline installation', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockOfflineInstallation();
    
    // Then
    expect(await fs.exists('./_bmad/core/pm.skill.md')).toBe(true);
  });
});
```

---

### 场景3: 降级安装完成

#### TC-5.2.8: 离线安装完成后更新状态
**测试目标**: 验证离线安装完成后面板状态更新为离线模式

```typescript
describe('BMAD Offline Installation Complete', () => {
  it('should update panel status to installed-offline after successful offline installation', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockOfflineInstallation();
    
    // Then
    expect(panel.status).toBe('installed-offline');
    expect(panel.hasOfflineIndicator()).toBe(true);
    expect(panel.getStatusText()).toBe('已启用（离线模式）');
  });
});
```

#### TC-5.2.9: 离线安装完成后加载bmad-quick-flow技能
**测试目标**: 验证离线安装完成后AI面板加载bmad-quick-flow技能

```typescript
describe('BMAD Offline Skill Loading', () => {
  it('should load bmad-quick-flow skill in AI panel after offline installation', async () => {
    // Given
    await setupEmptyProject();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickEnableButton();
    await mockOfflineInstallation();
    const aiPanel = await openAIPanel();
    
    // Then
    const availableSkills = aiPanel.getAvailableSkills();
    expect(availableSkills.some(s => s.id === 'bmad-quick-flow')).toBe(true);
  });
});
```

---

### 场景4: 网络恢复检测

#### TC-5.2.10: 离线模式下可触发升级
**测试目标**: 验证离线模式下可尝试升级到完整版本

```typescript
describe('BMAD Upgrade from Offline', () => {
  it('should allow upgrade to full version from offline mode', async () => {
    // Given
    await setupProjectWithOfflineBMAD(); // 设置离线模式项目
    const panel = await openBMADPanel();
    
    // When
    await panel.clickUpgradeButton();
    await mockSuccessfulOnlineInstallation(); // 模拟在线安装成功
    
    // Then
    expect(panel.status).toBe('installed');
    expect(panel.hasOfflineIndicator()).toBe(false);
    expect(panel.getStatusText()).toBe('已启用');
  });
});
```

#### TC-5.2.11: 升级失败保持离线模式
**测试目标**: 验证升级失败时保持离线模式

```typescript
describe('BMAD Upgrade Failure', () => {
  it('should remain in offline mode when upgrade fails', async () => {
    // Given
    await setupProjectWithOfflineBMAD();
    const panel = await openBMADPanel();
    
    // When
    await panel.clickUpgradeButton();
    await mockFailedOnlineInstallation(); // 模拟在线安装失败
    
    // Then
    expect(panel.status).toBe('installed-offline');
    expect(panel.hasOfflineIndicator()).toBe(true);
    expect(panel.hasUpgradeButton()).toBe(true); // 仍可再次尝试升级
  });
});
```

---

### 场景5: 离线模式提示

#### TC-5.2.12: 离线模式显示提示信息
**测试目标**: 验证离线模式下面板显示离线提示

```typescript
describe('BMAD Offline Mode UI', () => {
  it('should display offline mode indicator and upgrade button', async () => {
    // Given
    await setupProjectWithOfflineBMAD();
    
    // When
    const panel = await openBMADPanel();
    
    // Then
    expect(panel.hasOfflineIndicator()).toBe(true);
    expect(panel.getOfflineMessage()).toContain('离线模式');
    expect(panel.hasUpgradeButton()).toBe(true);
    expect(panel.getUpgradeButtonText()).toBe('点击升级到完整版本');
  });
});
```

#### TC-5.2.13: 离线模式显示功能限制说明
**测试目标**: 验证离线模式下面板显示功能限制说明

```typescript
describe('BMAD Offline Mode Limitations', () => {
  it('should show feature limitations in offline mode', async () => {
    // Given
    await setupProjectWithOfflineBMAD();
    
    // When
    const panel = await openBMADPanel();
    
    // Then
    expect(panel.hasLimitationsInfo()).toBe(true);
    expect(panel.getLimitationsInfo()).toContain('功能限制');
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

async function setupProjectWithOfflineBMAD(): Promise<void> {
  // 创建包含离线模式BMAD的测试项目
  // 模拟已安装离线BMAD的状态
}

async function mockNetworkFailure(): Promise<void> {
  // 模拟网络不可用
}

async function mockNodeJSUnavailable(): Promise<void> {
  // 模拟Node.js不可用
}

async function mockInstallationTimeout(): Promise<void> {
  // 模拟安装超时
}

async function mockOfflineInstallation(): Promise<void> {
  // 模拟离线安装成功
}

async function mockSuccessfulOnlineInstallation(): Promise<void> {
  // 模拟在线安装成功（升级）
}

async function mockFailedOnlineInstallation(): Promise<void> {
  // 模拟在线安装失败（升级）
}

async function waitForTimeout(): Promise<void> {
  // 等待超时发生
}
```

### 页面对象模型

```typescript
// BMAD面板页面对象（扩展）
class BMADPanel {
  status: 'not-installed' | 'installing' | 'installed' | 'installed-offline' | 'error';
  
  // 新增离线模式方法
  hasOfflineIndicator(): boolean;
  hasUpgradeButton(): boolean;
  hasLimitationsInfo(): boolean;
  
  getOfflineMessage(): string;
  getUpgradeButtonText(): string;
  getLimitationsInfo(): string;
  
  clickUpgradeButton(): Promise<void>;
  
  isInstallingOffline(): boolean;
  
  // 继承自基础BMADPanel
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
| 网络不可用时触发降级 | TC-5.2.1 | P0 | ✅ 已定义 |
| Node.js不可用时触发降级 | TC-5.2.2 | P0 | ✅ 已定义 |
| 安装超时时触发降级 | TC-5.2.3 | P1 | ✅ 已定义 |
| 离线安装创建_bmad/core目录 | TC-5.2.4 | P0 | ✅ 已定义 |
| 离线安装包含quick-flow工作流 | TC-5.2.5 | P0 | ✅ 已定义 |
| 离线安装包含developer智能体 | TC-5.2.6 | P0 | ✅ 已定义 |
| 离线安装包含pm智能体 | TC-5.2.7 | P0 | ✅ 已定义 |
| 离线安装完成后更新状态 | TC-5.2.8 | P0 | ✅ 已定义 |
| 离线安装完成后加载技能 | TC-5.2.9 | P0 | ✅ 已定义 |
| 离线模式下可触发升级 | TC-5.2.10 | P1 | ✅ 已定义 |
| 升级失败保持离线模式 | TC-5.2.11 | P1 | ✅ 已定义 |
| 离线模式显示提示信息 | TC-5.2.12 | P1 | ✅ 已定义 |
| 离线模式显示功能限制 | TC-5.2.13 | P2 | ✅ 已定义 |

---

## 📁 测试文件结构

```
tests/
├── acceptance/
│   ├── 5-1-bmad-one-click.atdd.ts   # Story 5.1 验收测试
│   └── 5-2-bmad-offline.atdd.ts     # Story 5.2 验收测试（本文件）
├── unit/
│   ├── bmadService.test.ts          # BMAD服务单元测试
│   └── bmadService.edge.test.ts     # BMAD边界条件测试
└── e2e/
    ├── bmad-install.spec.ts          # BMAD安装E2E测试
```

---

## ✅ 完成状态

- **Status**: Red Phase (待实现)
- **Completion Note**: 验收测试脚手架已创建，包含13个测试用例，覆盖所有验收标准场景