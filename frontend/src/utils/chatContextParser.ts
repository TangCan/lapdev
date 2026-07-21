// 聊天上下文解析工具
// 支持 @file:path 和 @selection 语法

export interface ChatContextItem {
  type: 'file' | 'selection';
  path?: string;
  content: string;
}

const FILE_REF_PATTERN = /@file:([^\s]+)/g;
const SELECTION_REF_PATTERN = /@selection/g;

const MAX_CONTEXT_FILES = 10;

function sanitizePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');

  if (normalized.includes('..')) {
    throw new Error('Path traversal not allowed');
  }

  if (normalized.startsWith('/') || normalized.match(/^[a-zA-Z]:/)) {
    throw new Error('Absolute paths not allowed');
  }

  return normalized;
}

/**
 * 解析消息中的上下文引用
 * @param content 用户输入的消息内容
 * @returns 解析出的上下文信息数组
 */
export async function parseContextReferences(content: string): Promise<ChatContextItem[]> {
  const contexts: ChatContextItem[] = [];

  const fileMatches = [...content.matchAll(FILE_REF_PATTERN)];

  if (fileMatches.length > MAX_CONTEXT_FILES) {
    throw new Error(`Too many file references (max ${MAX_CONTEXT_FILES})`);
  }

  for (const match of fileMatches) {
    const rawPath = match[1];

    let filePath: string;
    try {
      filePath = sanitizePath(rawPath);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Invalid path');
    }

    try {
      const fileContent = await readFileContent(filePath);
      contexts.push({
        type: 'file',
        path: filePath,
        content: fileContent,
      });
    } catch {
      contexts.push({
        type: 'file',
        path: filePath,
        content: `[Error: File not found or inaccessible]`,
      });
    }
  }

  if (SELECTION_REF_PATTERN.test(content)) {
    const selectionContent = await getCurrentSelection();
    contexts.push({
      type: 'selection',
      content: selectionContent || '[No selection available]',
    });
  }

  return contexts;
}

/**
 * 读取文件内容
 * @param filePath 文件路径
 * @returns 文件内容
 */
async function readFileContent(filePath: string): Promise<string> {
  const response = await fetch(`/api/v1/files/content?path=${encodeURIComponent(filePath)}`);
  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.status}`);
  }
  const result = await response.json();
  return result.content || '';
}

/**
 * 获取当前编辑器选中的内容
 * @returns 选中的文本内容
 */
async function getCurrentSelection(): Promise<string | null> {
  // 尝试从编辑器获取选中内容
  // 这里需要与编辑器集成，暂时返回空
  // 实际实现时需要调用 Monaco Editor 的 API
  try {
    const response = await fetch('/api/v1/editor/selection');
    if (response.ok) {
      const result = await response.json();
      return result.selection || null;
    }
  } catch (error) {
    console.warn('Failed to get editor selection:', error);
  }
  return null;
}

/**
 * 提取消息中的文件路径引用
 * @param content 消息内容
 * @returns 文件路径数组
 */
export function extractFileReferences(content: string): string[] {
  const paths: string[] = [];
  const matches = content.matchAll(FILE_REF_PATTERN);
  for (const match of matches) {
    paths.push(match[1]);
  }
  return paths;
}

/**
 * 检查消息是否包含上下文引用
 * @param content 消息内容
 * @returns 是否包含上下文引用
 */
export function hasContextReferences(content: string): boolean {
  return FILE_REF_PATTERN.test(content) || SELECTION_REF_PATTERN.test(content);
}

/**
 * 格式化上下文信息用于发送给AI
 * @param contexts 上下文数组
 * @returns 格式化后的上下文字符串
 */
export function formatContextForAI(contexts: ChatContextItem[]): string {
  if (contexts.length === 0) return '';

  let formatted = '\n\n--- Context References ---\n';
  
  for (const context of contexts) {
    if (context.type === 'file') {
      formatted += `\n📄 File: ${context.path}\n\`\`\`\n${context.content}\n\`\`\`\n`;
    } else if (context.type === 'selection') {
      formatted += `\n✂️ Selection:\n\`\`\`\n${context.content}\n\`\`\`\n`;
    }
  }

  return formatted;
}