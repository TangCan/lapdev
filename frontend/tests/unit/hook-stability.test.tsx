import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { usePerformanceMonitor as usePerformanceMonitorImpl } from '../../src/hooks/usePerformanceMonitor';
import { useEditorTabs as useEditorTabsImpl, type Tab } from '../../src/hooks/useEditorTabs';
import { useFileOperations as useFileOperationsImpl } from '../../src/hooks/useFileOperations';
import { useSkillMatch as useSkillMatchImpl } from '../../src/hooks/useSkillMatch';
import { useEditor as useEditorImpl } from '../../src/components/Editor/useEditor';

// ═══════════════════════════════════════════════════════════════════════════════
// usePerformanceMonitor Hook - 引用稳定性测试
// 此 Hook 接受外部 service 参数，直接传入 mock 即可
// ═══════════════════════════════════════════════════════════════════════════════

describe('usePerformanceMonitor Hook - 引用稳定性', () => {
  const createMockService = () => ({
    start: vi.fn(),
    stop: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({
      fps: 60,
      cpuUsage: 25,
      memoryUsage: 524288000,
      memoryLimit: 1073741824,
      networkRequests: [],
      longestTask: 50,
      pageLoadTime: 800,
      componentRenderTime: [],
    }),
    getStatus: vi.fn().mockReturnValue({
      fps: 'excellent' as const,
      cpu: 'good' as const,
      memory: 'good' as const,
      overall: 'good' as const,
    }),
    subscribe: vi.fn().mockReturnValue(vi.fn()),
  });

  it('[P0] getMetrics 函数在连续渲染中保持引用稳定', () => {
    const mockService = createMockService();
    const { result, rerender } = renderHook(
      () => usePerformanceMonitorImpl(mockService as any)
    );

    const firstGetMetrics = result.current.getMetrics;

    rerender();
    const secondGetMetrics = result.current.getMetrics;

    expect(firstGetMetrics).toBe(secondGetMetrics);
  });

  it('[P0] getStatus 函数在连续渲染中保持引用稳定', () => {
    const mockService = createMockService();
    const { result, rerender } = renderHook(
      () => usePerformanceMonitorImpl(mockService as any)
    );

    const firstGetStatus = result.current.getStatus;

    rerender();
    const secondGetStatus = result.current.getStatus;

    expect(firstGetStatus).toBe(secondGetStatus);
  });

  it('[P0] stop 函数在连续渲染中保持引用稳定', () => {
    const mockService = createMockService();
    const { result, rerender } = renderHook(
      () => usePerformanceMonitorImpl(mockService as any)
    );

    const firstStop = result.current.stop;

    rerender();
    const secondStop = result.current.stop;

    expect(firstStop).toBe(secondStop);
  });

  it('[P0] start 函数在连续渲染中保持引用稳定', () => {
    const mockService = createMockService();
    const { result, rerender } = renderHook(
      () => usePerformanceMonitorImpl(mockService as any)
    );

    const firstStart = result.current.start;

    rerender();
    const secondStart = result.current.start;

    expect(firstStart).toBe(secondStart);
  });

  it('[P0] 所有 API 函数引用在多次渲染后保持不变', () => {
    const mockService = createMockService();
    const { result, rerender } = renderHook(
      () => usePerformanceMonitorImpl(mockService as any)
    );

    const firstRefs = {
      getMetrics: result.current.getMetrics,
      getStatus: result.current.getStatus,
      stop: result.current.stop,
      start: result.current.start,
    };

    for (let i = 0; i < 5; i++) {
      rerender();
    }

    expect(result.current.getMetrics).toBe(firstRefs.getMetrics);
    expect(result.current.getStatus).toBe(firstRefs.getStatus);
    expect(result.current.stop).toBe(firstRefs.stop);
    expect(result.current.start).toBe(firstRefs.start);
  });

  it('[P1] 调用 stop 函数不改变其引用', () => {
    const mockService = createMockService();
    const { result } = renderHook(
      () => usePerformanceMonitorImpl(mockService as any)
    );

    const stopRef = result.current.stop;

    act(() => {
      result.current.stop();
    });

    expect(result.current.stop).toBe(stopRef);
    expect(mockService.stop).toHaveBeenCalledTimes(1);
  });

  it('[P1] 调用 start 函数不改变其引用', () => {
    const mockService = createMockService();
    const { result } = renderHook(
      () => usePerformanceMonitorImpl(mockService as any)
    );

    const startRef = result.current.start;

    act(() => {
      result.current.start();
    });

    expect(result.current.start).toBe(startRef);
    expect(mockService.start).toHaveBeenCalled();
  });

  it('[P2] getMetrics 返回服务数据', () => {
    const mockService = createMockService();
    const { result } = renderHook(
      () => usePerformanceMonitorImpl(mockService as any)
    );

    const metrics = result.current.getMetrics();
    expect(metrics.fps).toBe(60);
    expect(metrics.cpuUsage).toBe(25);
  });

  it('[P2] getStatus 返回服务数据', () => {
    const mockService = createMockService();
    const { result } = renderHook(
      () => usePerformanceMonitorImpl(mockService as any)
    );

    const status = result.current.getStatus();
    expect(status.overall).toBe('good');
    expect(status.fps).toBe('excellent');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useEditorTabs Hook - 引用稳定性测试
// ═══════════════════════════════════════════════════════════════════════════════

vi.mock('../../src/services/fileService', () => ({
  readFile: vi.fn().mockResolvedValue({
    status: 'success',
    data: { path: '/test/file.ts', content: 'const x = 1;' },
  }),
  writeFile: vi.fn(),
  formatCode: vi.fn(),
}));

vi.mock('../../src/services/gitService', () => ({
  fetchGitDiff: vi.fn().mockResolvedValue({
    status: 'success',
    data: { diff: '--- /dev/null\n+++ b/test/file.ts\n@@ -0,0 +1 @@\n+const x = 1;' },
  }),
}));

describe('useEditorTabs Hook - 引用稳定性', () => {
  it('[P0] switchTab 函数在渲染后保持引用稳定 (空依赖 [])', () => {
    const { result, rerender } = renderHook(() => useEditorTabsImpl());

    const firstSwitchTab = result.current.switchTab;

    rerender();
    expect(result.current.switchTab).toBe(firstSwitchTab);
  });

  it('[P0] updateContent 函数在渲染后保持引用稳定 (空依赖 [])', () => {
    const { result, rerender } = renderHook(() => useEditorTabsImpl());

    const firstUpdateContent = result.current.updateContent;

    rerender();
    expect(result.current.updateContent).toBe(firstUpdateContent);
  });

  it('[P0] markSaved 函数在渲染后保持引用稳定 (空依赖 [])', () => {
    const { result, rerender } = renderHook(() => useEditorTabsImpl());

    const firstMarkSaved = result.current.markSaved;

    rerender();
    expect(result.current.markSaved).toBe(firstMarkSaved);
  });

  it('[P0] updateTabContent 函数在渲染后保持引用稳定 (空依赖 [])', () => {
    const { result, rerender } = renderHook(() => useEditorTabsImpl());

    const firstUpdateTabContent = result.current.updateTabContent;

    rerender();
    expect(result.current.updateTabContent).toBe(firstUpdateTabContent);
  });

  it('[P1] openFile 在相同依赖下保持引用稳定', () => {
    const { result, rerender } = renderHook(() => useEditorTabsImpl());

    const firstOpenFile = result.current.openFile;

    rerender();
    expect(result.current.openFile).toBe(firstOpenFile);
  });

  it('[P1] closeTab 在相同依赖下保持引用稳定', () => {
    const { result, rerender } = renderHook(() => useEditorTabsImpl());

    const firstCloseTab = result.current.closeTab;

    rerender();
    expect(result.current.closeTab).toBe(firstCloseTab);
  });

  it('[P1] switchTab 调用后不改变引用', () => {
    const { result } = renderHook(() => useEditorTabsImpl());

    const switchTabRef = result.current.switchTab;

    act(() => {
      result.current.switchTab('some-tab-id');
    });

    expect(result.current.switchTab).toBe(switchTabRef);
  });

  it('[P2] updateContent 调用后不改变引用', () => {
    const { result } = renderHook(() => useEditorTabsImpl());

    const updateContentRef = result.current.updateContent;

    act(() => {
      result.current.updateContent('tab-1', 'new content');
    });

    expect(result.current.updateContent).toBe(updateContentRef);
  });

  it('[P2] markSaved 调用后不改变引用', () => {
    const { result } = renderHook(() => useEditorTabsImpl());

    const markSavedRef = result.current.markSaved;

    act(() => {
      result.current.markSaved('tab-1');
    });

    expect(result.current.markSaved).toBe(markSavedRef);
  });

  it('[P2] 初始状态 tabs 为空数组', () => {
    const { result } = renderHook(() => useEditorTabsImpl());

    expect(result.current.tabs).toEqual([]);
    expect(result.current.activeTabId).toBeNull();
    expect(result.current.activeTab).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useFileOperations Hook - 引用稳定性测试
// ═══════════════════════════════════════════════════════════════════════════════

const stableTabs: Tab[] = [];

describe('useFileOperations Hook - 引用稳定性', () => {
  it('[P0] showError 函数在渲染后保持引用稳定 (空依赖 [])', () => {
    const mockMarkSaved = vi.fn();
    const mockUpdateTabContent = vi.fn();

    const { result, rerender } = renderHook(() =>
      useFileOperationsImpl({
        tabs: stableTabs,
        activeTabId: null,
        markSaved: mockMarkSaved,
        updateTabContent: mockUpdateTabContent,
      })
    );

    const firstShowError = result.current.showError;

    rerender();
    expect(result.current.showError).toBe(firstShowError);
  });

  it('[P0] handleSave 在相同参数下保持引用稳定', () => {
    const mockMarkSaved = vi.fn();
    const mockUpdateTabContent = vi.fn();

    const { result, rerender } = renderHook(() =>
      useFileOperationsImpl({
        tabs: stableTabs,
        activeTabId: null,
        markSaved: mockMarkSaved,
        updateTabContent: mockUpdateTabContent,
      })
    );

    const firstHandleSave = result.current.handleSave;

    rerender();
    expect(result.current.handleSave).toBe(firstHandleSave);
  });

  it('[P0] handleFormat 在相同参数下保持引用稳定', () => {
    const mockMarkSaved = vi.fn();
    const mockUpdateTabContent = vi.fn();

    const { result, rerender } = renderHook(() =>
      useFileOperationsImpl({
        tabs: stableTabs,
        activeTabId: null,
        markSaved: mockMarkSaved,
        updateTabContent: mockUpdateTabContent,
      })
    );

    const firstHandleFormat = result.current.handleFormat;

    rerender();
    expect(result.current.handleFormat).toBe(firstHandleFormat);
  });

  it('[P0] saveFile 在相同参数下保持引用稳定', () => {
    const mockMarkSaved = vi.fn();
    const mockUpdateTabContent = vi.fn();

    const { result, rerender } = renderHook(() =>
      useFileOperationsImpl({
        tabs: stableTabs,
        activeTabId: null,
        markSaved: mockMarkSaved,
        updateTabContent: mockUpdateTabContent,
      })
    );

    const firstSaveFile = result.current.saveFile;

    rerender();
    expect(result.current.saveFile).toBe(firstSaveFile);
  });

  it('[P1] showError 调用后不改变引用', () => {
    const mockMarkSaved = vi.fn();
    const mockUpdateTabContent = vi.fn();

    const { result } = renderHook(() =>
      useFileOperationsImpl({
        tabs: stableTabs,
        activeTabId: null,
        markSaved: mockMarkSaved,
        updateTabContent: mockUpdateTabContent,
      })
    );

    const showErrorRef = result.current.showError;

    act(() => {
      result.current.showError('test error');
    });

    expect(result.current.showError).toBe(showErrorRef);
  });

  it('[P1] errorMessage 在 showError 调用后正确设置', () => {
    const mockMarkSaved = vi.fn();
    const mockUpdateTabContent = vi.fn();

    const { result } = renderHook(() =>
      useFileOperationsImpl({
        tabs: stableTabs,
        activeTabId: null,
        markSaved: mockMarkSaved,
        updateTabContent: mockUpdateTabContent,
      })
    );

    expect(result.current.errorMessage).toBeNull();

    act(() => {
      result.current.showError('Test error message');
    });

    expect(result.current.errorMessage).toBe('Test error message');
  });

  it('[P2] 初始状态 isSaving/isFormatting 为 false', () => {
    const mockMarkSaved = vi.fn();
    const mockUpdateTabContent = vi.fn();

    const { result } = renderHook(() =>
      useFileOperationsImpl({
        tabs: stableTabs,
        activeTabId: null,
        markSaved: mockMarkSaved,
        updateTabContent: mockUpdateTabContent,
      })
    );

    expect(result.current.isSaving).toBe(false);
    expect(result.current.isFormatting).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useSkillMatch Hook - 引用稳定性测试
// ═══════════════════════════════════════════════════════════════════════════════

const mockSkills = [
  {
    id: 'skill-1',
    name: 'Test Skill',
    version: '1.0.0',
    description: 'A test skill',
    author: 'test',
    tags: ['test'],
    trigger: { keywords: ['test'] },
    content: 'Test skill content',
    fileName: 'test-skill.md',
  },
];

const mockFindMatchingSkills = vi.fn();
const mockGetActiveSkills = vi.fn().mockReturnValue(mockSkills);

vi.mock('../../src/context/SkillContext', () => ({
  useSkill: () => ({
    skills: mockSkills,
    findMatchingSkills: mockFindMatchingSkills,
    getActiveSkills: mockGetActiveSkills,
  }),
}));

describe('useSkillMatch Hook - 引用稳定性', () => {
  it('[P0] matchAndActivate 函数在渲染后保持引用稳定', () => {
    const { result, rerender } = renderHook(() => useSkillMatchImpl());

    const firstMatch = result.current.matchAndActivate;

    rerender();
    expect(result.current.matchAndActivate).toBe(firstMatch);
  });

  it('[P0] getSystemPromptWithSkills 函数在渲染后保持引用稳定', () => {
    const { result, rerender } = renderHook(() => useSkillMatchImpl());

    const firstGetPrompt = result.current.getSystemPromptWithSkills;

    rerender();
    expect(result.current.getSystemPromptWithSkills).toBe(firstGetPrompt);
  });

  it('[P1] matchAndActivate 调用后不改变引用', () => {
    const { result } = renderHook(() => useSkillMatchImpl());

    const matchRef = result.current.matchAndActivate;

    act(() => {
      result.current.matchAndActivate({ text: 'test request' });
    });

    expect(result.current.matchAndActivate).toBe(matchRef);
  });

  it('[P1] getSystemPromptWithSkills 返回有效字符串', () => {
    const { result } = renderHook(() => useSkillMatchImpl());

    const prompt = result.current.getSystemPromptWithSkills();

    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
    expect(prompt).toContain('Test Skill');
  });

  it('[P2] matchService 实例在多次渲染中保持一致', () => {
    const { result, rerender } = renderHook(() => useSkillMatchImpl());

    const firstService = result.current.matchService;

    rerender();
    expect(result.current.matchService).toBe(firstService);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// useEditor (Editor) Hook - 引用稳定性测试
// ═══════════════════════════════════════════════════════════════════════════════

describe('useEditor (Editor) Hook - 引用稳定性', () => {
  it('[P0] detectLanguage 函数在渲染后保持引用稳定 (空依赖 [])', () => {
    const { result, rerender } = renderHook(() => useEditorImpl());

    const firstDetect = result.current.detectLanguage;

    rerender();
    expect(result.current.detectLanguage).toBe(firstDetect);
  });

  it('[P0] updateContent 函数在渲染后保持引用稳定 (空依赖 [])', () => {
    const { result, rerender } = renderHook(() => useEditorImpl());

    const firstUpdate = result.current.updateContent;

    rerender();
    expect(result.current.updateContent).toBe(firstUpdate);
  });

  it('[P0] closeFile 函数在渲染后保持引用稳定 (空依赖 [])', () => {
    const { result, rerender } = renderHook(() => useEditorImpl());

    const firstClose = result.current.closeFile;

    rerender();
    expect(result.current.closeFile).toBe(firstClose);
  });

  it('[P1] openFile 在相同依赖下保持引用稳定', () => {
    const { result, rerender } = renderHook(() => useEditorImpl());

    const firstOpen = result.current.openFile;

    rerender();
    expect(result.current.openFile).toBe(firstOpen);
  });

  it('[P1] formatCode 在相同依赖下保持引用稳定', () => {
    const { result, rerender } = renderHook(() => useEditorImpl());

    const firstFormat = result.current.formatCode;

    rerender();
    expect(result.current.formatCode).toBe(firstFormat);
  });

  it('[P1] detectLanguage 调用后不改变引用', () => {
    const { result } = renderHook(() => useEditorImpl());

    const detectRef = result.current.detectLanguage;

    act(() => {
      result.current.detectLanguage('test.ts');
    });

    expect(result.current.detectLanguage).toBe(detectRef);
  });

  it('[P2] detectLanguage 正确识别语言', () => {
    const { result } = renderHook(() => useEditorImpl());

    expect(result.current.detectLanguage('test.ts')).toBe('typescript');
    expect(result.current.detectLanguage('test.tsx')).toBe('typescript');
    expect(result.current.detectLanguage('test.js')).toBe('javascript');
    expect(result.current.detectLanguage('test.py')).toBe('python');
    expect(result.current.detectLanguage('test.rs')).toBe('rust');
    expect(result.current.detectLanguage('test.go')).toBe('go');
    expect(result.current.detectLanguage('test.md')).toBe('markdown');
    expect(result.current.detectLanguage('test.json')).toBe('json');
    expect(result.current.detectLanguage('test.yaml')).toBe('yaml');
    expect(result.current.detectLanguage('test.unknown')).toBe('plaintext');
  });

  it('[P2] updateContent 调用后 isModified 变为 true', () => {
    const { result } = renderHook(() => useEditorImpl());

    expect(result.current.isModified).toBe(false);

    act(() => {
      result.current.updateContent('new content');
    });

    expect(result.current.isModified).toBe(true);
    expect(result.current.content).toBe('new content');
  });

  it('[P2] closeFile 重置所有状态', () => {
    const { result } = renderHook(() => useEditorImpl());

    act(() => {
      result.current.updateContent('some content');
    });

    expect(result.current.isModified).toBe(true);

    act(() => {
      result.current.closeFile();
    });

    expect(result.current.isModified).toBe(false);
    expect(result.current.content).toBe('');
    expect(result.current.currentFile).toBeNull();
    expect(result.current.language).toBe('plaintext');
  });
});