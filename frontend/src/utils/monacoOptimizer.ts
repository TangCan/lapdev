import * as monaco from 'monaco-editor';

/** 大文件行数阈值 */
export const LARGE_FILE_THRESHOLD = 10000;

/** 超大文件行数阈值 */
export const HUGE_FILE_THRESHOLD = 50000;

/**
 * 检测文件是否为大文件
 * @param content 文件内容
 * @returns 是否为大文件
 */
export function isLargeFile(content: string): boolean {
  const lineCount = content.split('\n').length;
  return lineCount > LARGE_FILE_THRESHOLD;
}

/**
 * 检测文件是否为超大文件
 * @param content 文件内容
 * @returns 是否为超大文件
 */
export function isHugeFile(content: string): boolean {
  const lineCount = content.split('\n').length;
  return lineCount > HUGE_FILE_THRESHOLD;
}

/**
 * 根据文件内容生成优化的 Monaco 编辑器选项
 * @param content 文件内容
 * @param baseOptions 基础选项
 * @returns 优化后的编辑器选项
 */
export function getOptimizedEditorOptions(
  content: string,
  baseOptions?: monaco.editor.IStandaloneEditorConstructionOptions
): monaco.editor.IStandaloneEditorConstructionOptions {
  const lineCount = content.split('\n').length;
  const isLarge = lineCount > LARGE_FILE_THRESHOLD;
  const isHuge = lineCount > HUGE_FILE_THRESHOLD;

  const optimizedOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    ...baseOptions,
    // 大文件禁用 minimap 以提升性能
    minimap: { enabled: !isLarge },
    // 大文件禁用代码折叠
    folding: !isLarge,
    // 大文件禁用行内提示
    inlineSuggest: { enabled: !isLarge },
    // 大文件减少滚动时渲染的额外行数
    scrollBeyondLastLine: !isLarge,
    // 超大文件禁用平滑滚动
    smoothScrolling: !isHuge,
    // 大文件禁用代码镜头
    codeLens: !isLarge,
    // 大文件禁用悬停提示
    hover: { enabled: !isLarge },
    // 大文件禁用链接检测
    links: !isLarge,
    // 大文件限制多光标
    multiCursorLimit: isLarge ? 1 : 10000,
    // 超大文件使用固定行高以优化滚动
    lineNumbers: isHuge ? 'off' : 'on',
    // 大文件减少渲染优化
    renderWhitespace: isLarge ? 'none' : 'selection',
    // 大文件禁用字体连字
    fontLigatures: !isLarge,
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
  baseOptions?: monaco.editor.IStandaloneEditorConstructionOptions
): monaco.editor.IStandaloneCodeEditor {
  const options = getOptimizedEditorOptions(content, {
    ...baseOptions,
    value: content,
    language,
    automaticLayout: true,
  });

  return monaco.editor.create(container, options);
}
