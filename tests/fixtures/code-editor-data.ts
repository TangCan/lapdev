export const testFileData = {
  name: 'test-file.txt',
  content: 'Test file content',
  path: '/workspace/test-file.txt',
  type: 'file',
  lastModified: new Date().toISOString(),
  size: 18,
};

export const testJSFile = {
  name: 'test.js',
  content: 'function foo() { return 1; }',
  path: '/workspace/test.js',
  type: 'file',
  language: 'javascript',
};

export const testTSFile = {
  name: 'test.ts',
  content: 'const x: number = 1;',
  path: '/workspace/test.ts',
  type: 'file',
  language: 'typescript',
};

export const testPythonFile = {
  name: 'test.py',
  content: 'def foo():\n    return 1',
  path: '/workspace/test.py',
  type: 'file',
  language: 'python',
};

export const testRustFile = {
  name: 'test.rs',
  content: 'fn main() {\n    println!("Hello");\n}',
  path: '/workspace/test.rs',
  type: 'file',
  language: 'rust',
};

export const testLargeFile = {
  name: 'large-file.txt',
  content: 'Line '.repeat(1000),
  path: '/workspace/large-file.txt',
  type: 'file',
};

export const supportedLanguages = [
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'java',
  'cpp',
  'csharp',
  'json',
  'yaml',
  'markdown',
];

export const createTestFile = (overrides: Partial<typeof testFileData> = {}) => ({
  ...testFileData,
  ...overrides,
});

export const createJSFile = (overrides: Partial<typeof testJSFile> = {}) => ({
  ...testJSFile,
  ...overrides,
});

export const createTSFile = (overrides: Partial<typeof testTSFile> = {}) => ({
  ...testTSFile,
  ...overrides,
});