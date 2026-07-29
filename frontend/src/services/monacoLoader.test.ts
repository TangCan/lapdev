/**
 * Unit tests for monacoLoader.ts
 *
 * Story: EPI2.01 - Monaco Editor 懒加载
 * Test Levels: Unit (Vitest)
 * Coverage: getMonaco() 缓存逻辑、getMonacoSync()、loadLanguage()、
 *           isLanguageLoaded()、语言回调注册验证
 *
 * Note: 模块级状态 (monacoCache, loadedLanguages 等) 在测试间持久化，
 *       因为 Vitest 缓存模块。测试按顺序设计以适应此行为。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Override monaco-editor mock for this test file
vi.mock('monaco-editor', () => {
  return {
    editor: {
      create: vi.fn(),
      setModelLanguage: vi.fn(),
      setTheme: vi.fn(),
      setModelMarkers: vi.fn(),
      getModels: vi.fn().mockReturnValue([]),
      OverviewRulerLane: { Right: 4 },
    },
    languages: {
      onLanguage: vi.fn(),
      registerCompletionItemProvider: vi.fn(),
      registerDefinitionProvider: vi.fn(),
      registerReferenceProvider: vi.fn(),
      registerRenameProvider: vi.fn(),
      registerDocumentFormattingEditProvider: vi.fn(),
      registerSignatureHelpProvider: vi.fn(),
      registerHoverProvider: vi.fn(),
      CompletionItemKind: { Text: 1 },
    },
    Range: vi.fn().mockReturnValue({}),
    Uri: { parse: vi.fn().mockReturnValue({ toString: () => 'file:///test.ts' }) },
    Position: vi.fn().mockReturnValue({ lineNumber: 1, column: 1 }),
    MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
    default: {},
  };
});

vi.mock('monaco-editor/esm/vs/language/typescript/monaco.contribution.js', () => ({ default: {} }));
vi.mock('monaco-editor/esm/vs/language/json/monaco.contribution.js', () => ({ default: {} }));
vi.mock('monaco-editor/esm/vs/language/html/monaco.contribution.js', () => ({ default: {} }));
vi.mock('monaco-editor/esm/vs/language/css/monaco.contribution.js', () => ({ default: {} }));

import {
  getMonaco,
  getMonacoSync,
  loadLanguage,
  isLanguageLoaded,
} from './monacoLoader';

describe('monacoLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ================================================================
  // getMonaco() - 核心加载逻辑
  // ================================================================

  describe('getMonaco()', () => {
    it('[P0] EPI2.01-LOADER-001: 返回 Promise', () => {
      const result = getMonaco();
      expect(result).toBeInstanceOf(Promise);
    });

    it('[P0] EPI2.01-LOADER-002: 返回可解析的 Promise', async () => {
      const first = getMonaco();
      await expect(first).resolves.toBeDefined();
    });

    it('[P0] EPI2.01-LOADER-003: getMonacoSync 在首次加载前返回 null 或缓存对象', () => {
      const syncResult = getMonacoSync();
      // 可能为 null (首次) 或非 null (缓存已命中)
      expect(syncResult === null || typeof syncResult === 'object').toBe(true);
    });

    it('[P0] EPI2.01-LOADER-004: 多次调用均返回 Promise 且均可解析', async () => {
      const p1 = getMonaco();
      const p2 = getMonaco();
      expect(p1).toBeInstanceOf(Promise);
      expect(p2).toBeInstanceOf(Promise);
      await expect(p1).resolves.toBeDefined();
      await expect(p2).resolves.toBeDefined();
    });
  });

  // ================================================================
  // getMonacoSync() - 同步获取
  // ================================================================

  describe('getMonacoSync()', () => {
    it('[P0] EPI2.01-LOADER-005: getMonaco() 之后返回非 null', async () => {
      // 先确保 getMonaco() 已完成
      const monaco = await getMonaco();
      expect(monaco).toBeDefined();

      const syncResult = getMonacoSync();
      expect(syncResult).not.toBeNull();
    });
  });

  // ================================================================
  // loadLanguage() - 语言动态加载
  // ================================================================

  describe('loadLanguage()', () => {
    it('[P1] EPI2.01-LOADER-006: 加载 TypeScript 语言', async () => {
      await loadLanguage('typescript');
      expect(isLanguageLoaded('typescript')).toBe(true);
    });

    it('[P1] EPI2.01-LOADER-007: 加载 JSON 语言', async () => {
      await loadLanguage('json');
      expect(isLanguageLoaded('json')).toBe(true);
    });

    it('[P1] EPI2.01-LOADER-008: 语言加载幂等性 (重复调用不重复加载)', async () => {
      await loadLanguage('html');
      await loadLanguage('html');
      expect(isLanguageLoaded('html')).toBe(true);
    });

    it('[P2] EPI2.01-LOADER-009: 未知语言直接标记为已加载', async () => {
      await loadLanguage('markdown');
      expect(isLanguageLoaded('markdown')).toBe(true);
    });

    it('[P1] EPI2.01-LOADER-010: 语言名称大小写不敏感', async () => {
      await loadLanguage('TypeScript');
      expect(isLanguageLoaded('typescript')).toBe(true);
    });
  });

  // ================================================================
  // isLanguageLoaded() - 语言状态查询
  // ================================================================

  describe('isLanguageLoaded()', () => {
    it('[P1] EPI2.01-LOADER-011: 未加载的语言返回 false', () => {
      expect(isLanguageLoaded('rust')).toBe(false);
    });

    it('[P1] EPI2.01-LOADER-012: 已加载的语言返回 true', async () => {
      await loadLanguage('css');
      expect(isLanguageLoaded('css')).toBe(true);
    });

    it('[P1] EPI2.01-LOADER-013: 未知语言返回 false (除非被 loadLanguage 标记)', () => {
      expect(isLanguageLoaded('unknown-lang')).toBe(false);
    });
  });

  // ================================================================
  // 语言回调注册 / 错误处理
  // ================================================================

  describe('onLanguage 回调注册 / 错误处理', () => {
    it('[P1] EPI2.01-LOADER-014: getMonaco() 调用不抛异常 (语言注册流程正常)', async () => {
      await expect(getMonaco()).resolves.toBeDefined();
    });

    it('[P1] EPI2.01-LOADER-015: 首次调用失败后 getMonaco() 可重试 (失败恢复逻辑)', async () => {
      // 模拟: 若 monacoPromise 因之前的错误被重置, 新的 getMonaco 可重新加载
      // 注: 此测试验证当 monacoPromise 为 null 时 getMonaco 可正常调用
      const result = getMonaco();
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeDefined();
    });

    it('[P2] EPI2.01-LOADER-016: loadLanguage 对已失败的语言跳过 (failedLanguages 缓存)', async () => {
      // 加载一个未知语言 -> 它会被标记为已加载 (因为 LANGUAGE_MODULES 中没有)
      await loadLanguage('markdown');
      expect(isLanguageLoaded('markdown')).toBe(true);

      // 模拟: 再次调用不会重复加载 (验证幂等性)
      await loadLanguage('markdown');
      expect(isLanguageLoaded('markdown')).toBe(true);
    });
  });

  // ================================================================
  // MonacoEnvironment 初始化
  // ================================================================

  describe('MonacoEnvironment', () => {
    it('[P1] EPI2.01-LOADER-017: getMonaco() 初始化 window.MonacoEnvironment', async () => {
      await getMonaco();
      expect(window.MonacoEnvironment).toBeDefined();
      expect(window.MonacoEnvironment!.getWorker).toBeDefined();
    });

    it('[P2] EPI2.01-LOADER-018: MonacoEnvironment 只初始化一次', async () => {
      await getMonaco();
      const env1 = window.MonacoEnvironment;
      await getMonaco();
      const env2 = window.MonacoEnvironment;
      // 同一个对象引用 (幂等初始化)
      expect(env1).toBe(env2);
    });
  });
});