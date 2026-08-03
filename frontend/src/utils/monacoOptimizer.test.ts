/**
 * Test suite for monacoOptimizer utility
 *
 * Story: EPI2.02 - 大文件优化配置
 * Test Levels: Unit (Vitest)
 * Coverage: 阈值检测、选项生成、边界条件、懒加载兼容性
 *
 * TDD GREEN 阶段 — 测试已激活
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLineCount,
  isLargeFile,
  isHugeFile,
  getOptimizedEditorOptions,
  createOptimizedEditor,
  LARGE_FILE_THRESHOLD,
  HUGE_FILE_THRESHOLD,
} from './monacoOptimizer';

const { mockGetMonacoSync, setMockResult } = vi.hoisted(() => {
  let result: any = null;
  const fn = vi.fn(() => result);
  return {
    mockGetMonacoSync: fn,
    setMockResult: (val: any) => { result = val; },
  };
});

vi.mock('../services/monacoLoader', () => ({
  getMonacoSync: mockGetMonacoSync,
  loadLanguage: vi.fn(),
}));

function generateContent(lineCount: number): string {
  if (lineCount === 0) return '';
  return Array(lineCount).fill('line of code').join('\n');
}

describe('monacoOptimizer', () => {
  beforeEach(() => {
    setMockResult({
      editor: {
        create: vi.fn().mockReturnValue({
          dispose: vi.fn(),
          updateOptions: vi.fn(),
        }),
      },
    });
  });

  // ================================================================
  // AC1 / AC3: isLargeFile 阈值检测
  // ================================================================

  it('[P0] EPI2.02-UNIT-001: isLargeFile 正确检测 10k+ 行文件', () => {
    // Given: 一个包含 10,001 行的文件内容
    const content = generateContent(10001);
    // When: 调用 isLargeFile
    const result = isLargeFile(content);
    // Then: 返回 true
    expect(result).toBe(true);
  });

  it('[P0] EPI2.02-UNIT-001b: isLargeFile 对 9,999 行返回 false', () => {
    expect(isLargeFile(generateContent(9999))).toBe(false);
  });

  it('[P0] EPI2.02-UNIT-001c: isLargeFile 对恰好 10,000 行返回 false', () => {
    // 边界: 使用 > 而非 >=
    expect(isLargeFile(generateContent(10000))).toBe(false);
  });

  it('[P0] EPI2.02-UNIT-001d: isLargeFile 对空字符串返回 false', () => {
    expect(isLargeFile('')).toBe(false);
  });

  it('[P0] EPI2.02-UNIT-001e: isLargeFile 对单行返回 false', () => {
    expect(isLargeFile('hello world')).toBe(false);
  });

  // ================================================================
  // AC2: isHugeFile 超大文件检测
  // ================================================================

  it('[P0] EPI2.02-UNIT-005: isHugeFile 正确检测 50k+ 行文件', () => {
    expect(isHugeFile(generateContent(50001))).toBe(true);
  });

  it('[P0] EPI2.02-UNIT-005b: isHugeFile 对 49,999 行返回 false', () => {
    expect(isHugeFile(generateContent(49999))).toBe(false);
  });

  it('[P0] EPI2.02-UNIT-005c: isHugeFile 对恰好 50,000 行返回 false', () => {
    expect(isHugeFile(generateContent(50000))).toBe(false);
  });

  it('[P0] EPI2.02-UNIT-005d: isHugeFile 对普通大小文件返回 false', () => {
    expect(isHugeFile(generateContent(100))).toBe(false);
  });

  // ================================================================
  // AC1: getOptimizedEditorOptions 大文件优化
  // ================================================================

  it('[P0] EPI2.02-UNIT-002: 大文件(≥10k) 禁用 minimap', () => {
    const content = generateContent(10001);
    const options = getOptimizedEditorOptions(content);
    expect(options.minimap).toEqual({ enabled: false });
  });

  it('[P0] EPI2.02-UNIT-003: 大文件(≥10k) 禁用 folding', () => {
    const content = generateContent(10001);
    const options = getOptimizedEditorOptions(content);
    expect(options.folding).toBe(false);
  });

  it('[P0] EPI2.02-UNIT-004: 大文件(≥10k) 禁用 hover/codeLens/links', () => {
    const content = generateContent(10001);
    const options = getOptimizedEditorOptions(content);
    expect(options.hover).toEqual({ enabled: false });
    expect(options.codeLens).toBe(false);
    expect(options.links).toBe(false);
  });

  it('[P0] EPI2.02-UNIT-004b: 大文件(≥10k) 禁用 inlineSuggest', () => {
    const content = generateContent(10001);
    const options = getOptimizedEditorOptions(content);
    expect(options.inlineSuggest).toEqual({ enabled: false });
  });

  it('[P0] EPI2.02-UNIT-004c: 大文件(≥10k) 禁用 fontLigatures', () => {
    const content = generateContent(10001);
    const options = getOptimizedEditorOptions(content);
    expect(options.fontLigatures).toBe(false);
  });

  it('[P0] EPI2.02-UNIT-004d: 大文件(≥10k) 禁用 scrollBeyondLastLine', () => {
    const content = generateContent(10001);
    const options = getOptimizedEditorOptions(content);
    expect(options.scrollBeyondLastLine).toBe(false);
  });

  // ================================================================
  // AC2: getOptimizedEditorOptions 超大文件额外优化
  // ================================================================

  it('[P0] EPI2.02-UNIT-006: 超大文件(≥50k) 禁用 lineNumbers', () => {
    const content = generateContent(50001);
    const options = getOptimizedEditorOptions(content);
    expect(options.lineNumbers).toBe('off');
  });

  it('[P1] EPI2.02-UNIT-007: 超大文件(≥50k) 限制 multiCursorLimit 为 1', () => {
    const content = generateContent(50001);
    const options = getOptimizedEditorOptions(content);
    expect(options.multiCursorLimit).toBe(1);
  });

  it('[P1] EPI2.02-UNIT-007b: 超大文件(≥50k) 禁用 smoothScrolling', () => {
    const content = generateContent(50001);
    const options = getOptimizedEditorOptions(content);
    expect(options.smoothScrolling).toBe(false);
  });

  it('[P1] EPI2.02-UNIT-007c: 超大文件(≥50k) 禁用 renderWhitespace', () => {
    const content = generateContent(50001);
    const options = getOptimizedEditorOptions(content);
    expect(options.renderWhitespace).toBe('none');
  });

  // ================================================================
  // AC3: 普通文件保持完整功能
  // ================================================================

  it('[P0] EPI2.02-UNIT-008: 普通文件(<10k) 保持所有功能启用', () => {
    const content = generateContent(5000);
    const options = getOptimizedEditorOptions(content);
    expect(options.minimap).toEqual({ enabled: true });
    expect(options.folding).toBe(true);
    expect(options.hover).toEqual({ enabled: true });
    expect(options.codeLens).toBe(true);
    expect(options.links).toBe(true);
    expect(options.fontLigatures).toBe(true);
    expect(options.lineNumbers).toBe('on');
    expect(options.smoothScrolling).toBe(true);
  });

  // ================================================================
  // AC3 / AC5: baseOptions 传递与覆盖
  // ================================================================

  it('[P1] EPI2.02-UNIT-009: 普通文件 baseOptions 正确传递', () => {
    const content = generateContent(100);
    const baseOptions = { fontSize: 16, readOnly: true };
    const options = getOptimizedEditorOptions(content, baseOptions);
    expect(options.fontSize).toBe(16);
    expect(options.readOnly).toBe(true);
  });

  it('[P1] EPI2.02-UNIT-009b: 大文件时用户 minimap:true 被覆盖为 false', () => {
    // 性能优先于用户显式选项
    const content = generateContent(10001);
    const baseOptions = { minimap: { enabled: true } as any };
    const options = getOptimizedEditorOptions(content, baseOptions);
    expect(options.minimap).toEqual({ enabled: false });
  });

  it('[P1] EPI2.02-UNIT-009c: 大文件时用户 folding:true 被覆盖为 false', () => {
    const content = generateContent(10001);
    const baseOptions = { folding: true };
    const options = getOptimizedEditorOptions(content, baseOptions);
    expect(options.folding).toBe(false);
  });

  // ================================================================
  // 常量导出
  // ================================================================

  it('[P1] EPI2.02-UNIT-010: LARGE_FILE_THRESHOLD 导出为 10000', () => {
    expect(LARGE_FILE_THRESHOLD).toBe(10000);
  });

  it('[P1] EPI2.02-UNIT-010b: HUGE_FILE_THRESHOLD 导出为 50000', () => {
    expect(HUGE_FILE_THRESHOLD).toBe(50000);
  });

  // ================================================================
  // AC7: 懒加载兼容性
  // ================================================================

  it('[P1] EPI2.02-UNIT-011: createOptimizedEditor 在 monaco 未加载时抛出错误', () => {
    // Given: getMonacoSync 返回 null (monaco 未加载)
    setMockResult(null);
    // When: 调用 createOptimizedEditor
    // Then: 抛出错误
    expect(() => {
      createOptimizedEditor(document.createElement('div'), 'test', 'typescript');
    }).toThrow(/Monaco not loaded yet/);
  });

  it('[P1] EPI2.02-UNIT-011b: createOptimizedEditor 使用 getOptimizedEditorOptions', () => {
    // Given: monaco 已加载
    const mockCreate = vi.fn().mockReturnValue({ dispose: vi.fn() });
    setMockResult({ editor: { create: mockCreate } });
    // When: 调用 createOptimizedEditor 传入大文件
    const container = document.createElement('div');
    createOptimizedEditor(container, generateContent(10001), 'typescript');
    // Then: getMonacoSync 被调用
    expect(mockGetMonacoSync).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const passedOptions = mockCreate.mock.calls[0][1];
    expect(passedOptions.minimap).toEqual({ enabled: false });
    expect(passedOptions.folding).toBe(false);
  });

  // ================================================================
  // 综合场景
  // ================================================================

  it('[P2] EPI2.02-UNIT-012: 10k-50k 行文件仅应用大文件优化，不应用超大文件优化', () => {
    const content = generateContent(25000);
    const options = getOptimizedEditorOptions(content);
    // 大文件优化生效
    expect(options.minimap).toEqual({ enabled: false });
    expect(options.folding).toBe(false);
    // 超大文件优化未生效
    expect(options.lineNumbers).toBe('on');
    expect(options.multiCursorLimit).toBe(10000);
  });

  it('[P2] EPI2.02-UNIT-013: 不同行数内容的优化等级正确', () => {
    const small = getOptimizedEditorOptions(generateContent(100));
    const large = getOptimizedEditorOptions(generateContent(10001));
    const huge = getOptimizedEditorOptions(generateContent(50001));

    // small: 全部启用
    expect(small.minimap?.enabled).toBe(true);
    // large: minimap 禁用, lineNumbers 仍开
    expect(large.minimap?.enabled).toBe(false);
    expect(large.lineNumbers).toBe('on');
    // huge: minimap 禁用 + lineNumbers 关闭
    expect(huge.minimap?.enabled).toBe(false);
    expect(huge.lineNumbers).toBe('off');
  });

  // ================================================================
  // getLineCount 共享函数测试
  // ================================================================

  it('[P0] EPI2.02-UNIT-014: getLineCount 空字符串返回 0', () => {
    expect(getLineCount('')).toBe(0);
  });

  it('[P0] EPI2.02-UNIT-014b: getLineCount 多行内容正确计数', () => {
    expect(getLineCount('a\nb\nc')).toBe(3);
    expect(getLineCount(generateContent(100))).toBe(100);
  });

  it('[P2] EPI2.02-UNIT-023: getLineCount 单行内容返回 1', () => {
    expect(getLineCount('hello world')).toBe(1);
  });

  // ================================================================
  // glyphMargin / quickSuggestions 优化测试
  // ================================================================

  it('[P1] EPI2.02-UNIT-015: 大文件(≥10k) 禁用 glyphMargin', () => {
    const content = generateContent(10001);
    const options = getOptimizedEditorOptions(content);
    expect(options.glyphMargin).toBe(false);
  });

  it('[P1] EPI2.02-UNIT-016: 大文件(≥10k) 禁用 quickSuggestions', () => {
    const content = generateContent(10001);
    const options = getOptimizedEditorOptions(content);
    expect(options.quickSuggestions).toBe(false);
  });

  it('[P1] EPI2.02-UNIT-017: 小文件 scrollBeyondLastLine 为 true', () => {
    const content = generateContent(100);
    const options = getOptimizedEditorOptions(content);
    expect(options.scrollBeyondLastLine).toBe(true);
  });

  it('[P1] EPI2.02-UNIT-017b: 大文件 scrollBeyondLastLine 为 false', () => {
    const content = generateContent(10001);
    const options = getOptimizedEditorOptions(content);
    expect(options.scrollBeyondLastLine).toBe(false);
  });

  // ================================================================
  // minimap 用户意图测试 (Review Fix)
  // ================================================================

  it('[P0] EPI2.02-UNIT-018: 小文件尊重用户 minimap:false 意图', () => {
    const content = generateContent(100);
    const baseOptions = { minimap: { enabled: false } as any };
    const options = getOptimizedEditorOptions(content, baseOptions);
    expect(options.minimap).toEqual({ enabled: false });
  });

  // ================================================================
  // multiCursorLimit 回归测试 (Review Fix)
  // ================================================================

  it('[P0] EPI2.02-UNIT-019: 10k-50k 行范围 multiCursorLimit 为 10000 (非 1)', () => {
    const content = generateContent(25000);
    const options = getOptimizedEditorOptions(content);
    expect(options.multiCursorLimit).toBe(10000);
  });

  // ================================================================
  // 边界与健壮性
  // ================================================================

  it('[P2] EPI2.02-UNIT-020: getOptimizedEditorOptions 无 baseOptions 时正常工作', () => {
    const content = generateContent(100);
    const options = getOptimizedEditorOptions(content);
    expect(options).toBeDefined();
    expect(options.minimap?.enabled).toBe(true);
    expect(options.folding).toBe(true);
  });

  it('[P1] EPI2.02-UNIT-021: 超大文件 glyphMargin 也为 false', () => {
    const content = generateContent(50001);
    const options = getOptimizedEditorOptions(content);
    expect(options.glyphMargin).toBe(false);
  });

  it('[P2] EPI2.02-UNIT-022: 小文件 quickSuggestions 保持默认', () => {
    const content = generateContent(100);
    const baseOptions = { quickSuggestions: { other: true, comments: false, strings: false } as any };
    const options = getOptimizedEditorOptions(content, baseOptions);
    expect(options.quickSuggestions).toEqual({ other: true, comments: false, strings: false });
  });
});
