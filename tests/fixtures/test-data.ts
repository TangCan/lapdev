export const testFileData = {
  name: 'test-file.txt',
  content: 'Test file content',
  path: '/workspace/test-file.txt',
  type: 'file',
};

export const testFolderData = {
  name: 'test-folder',
  path: '/workspace/test-folder',
  type: 'directory',
};

export const testWorkspacePath = '/workspace';

export const createTestFile = (overrides: Partial<typeof testFileData> = {}) => ({
  ...testFileData,
  ...overrides,
});

export const createTestFolder = (overrides: Partial<typeof testFolderData> = {}) => ({
  ...testFolderData,
  ...overrides,
});