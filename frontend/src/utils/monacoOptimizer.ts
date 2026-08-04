import type { editor } from 'monaco-editor';
import { getMonacoSync } from '../services/monacoLoader';
import { FormatCache, type FormatCacheOptions } from './formatCache';

function getMonacoMod() {
  const mod = getMonacoSync();
  if (!mod) throw new Error('Monaco not loaded yet. Call getMonaco() first.');
  return mod;
}

/** 大文件行数阈值 */
export const LARGE_FILE_THRESHOLD = 10000;

/** 超大文件行数阈值 */
export const HUGE_FILE_THRESHOLD = 50000;

/**
 * 计算文件内容的行数
 * @param content 文件内容
 * @returns 行数（空字符串返回 0）
 */
export function getLineCount(content: string): number {
  if (!content) return 0;
  return content.split('\n').length;
}

/**
 * 检测文件是否为大文件
 * @param content 文件内容
 * @returns 是否为大文件（行数 > 10,000）
 */
export function isLargeFile(content: string): boolean {
  return getLineCount(content) > LARGE_FILE_THRESHOLD;
}

/**
 * 检测文件是否为超大文件
 * @param content 文件内容
 * @returns 是否为超大文件（行数 > 50,000）
 */
export function isHugeFile(content: string): boolean {
  return getLineCount(content) > HUGE_FILE_THRESHOLD;
}

/**
 * 根据文件内容生成优化的 Monaco 编辑器选项。
 *
 * 覆盖策略：当文件为大文件或超大文件时，优化器以性能优先，
 * 会覆盖 baseOptions 中的以下字段：minimap、folding、hover、
 * codeLens、links、inlineSuggest、fontLigatures、smoothScrolling、
 * scrollBeyondLastLine、multiCursorLimit、lineNumbers、renderWhitespace、
 * glyphMargin、suggest。
 * 其他字段（如 fontSize、readOnly、theme 等）原样保留。
 *
 * 小文件下，minimap 尊重用户显式意图（baseOptions 中的设置）。
 *
 * @param content 文件内容
 * @param baseOptions 基础选项（用户显式传入的选项）
 * @returns 优化后的编辑器选项
 */
export function getOptimizedEditorOptions(
  content: string,
  baseOptions?: editor.IStandaloneEditorConstructionOptions
): editor.IStandaloneEditorConstructionOptions {
  const lineCount = getLineCount(content);
  const isLarge = lineCount > LARGE_FILE_THRESHOLD;
  const isHuge = lineCount > HUGE_FILE_THRESHOLD;

  const userMinimapEnabled = baseOptions?.minimap?.enabled ?? true;

  const optimizedOptions: editor.IStandaloneEditorConstructionOptions = {
    ...baseOptions,
    minimap: { enabled: isLarge ? false : userMinimapEnabled },
    folding: !isLarge,
    inlineSuggest: { enabled: !isLarge },
    scrollBeyondLastLine: isLarge ? false : true,
    smoothScrolling: !isHuge,
    codeLens: !isLarge,
    hover: { enabled: !isLarge },
    links: !isLarge,
    multiCursorLimit: isHuge ? 1 : 10000,
    lineNumbers: isHuge ? 'off' : 'on',
    renderWhitespace: isLarge ? 'none' : 'selection',
    fontLigatures: !isLarge,
    glyphMargin: !isLarge,
    ...(isLarge ? { quickSuggestions: false } : {}),
  };

  return optimizedOptions;
}

/**
 * 创建优化后的 Monaco 编辑器实例
 * @param container 容器元素
 * @param content 文件内容
 * @param language 语言
 * @param baseOptions 基础选项
 * @returns Monaco 编辑器实例
 */
export function createOptimizedEditor(
  container: HTMLElement,
  content: string,
  language: string,
  baseOptions?: editor.IStandaloneEditorConstructionOptions
): editor.IStandaloneCodeEditor {
  const options = getOptimizedEditorOptions(content, {
    ...baseOptions,
    value: content,
    language,
    automaticLayout: true,
  });

  return getMonacoMod().editor.create(container, options);
}

// ============================================================
// 格式化缓存集成 (EPI2.03)
// ============================================================

/**
 * 创建格式化缓存实例
 * @param options 缓存选项
 * @returns FormatCache 实例
 */
export function createFormatCache(options?: FormatCacheOptions): FormatCache {
  return new FormatCache(options);
}