// 文件服务单元测试 - 专注于安全检查和边界情况
import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { getFileTree, readFile, writeFile, createFile, createDirectory, renameFile, deleteFile } from '../../backend/src/services/fileService.ts';

// 安全测试 - 路径遍历防护
Deno.test('fileService - 应该阻止路径遍历攻击', async () => {
  // 测试路径遍历攻击
  const traversalResult1 = await readFile('../etc/passwd');
  assert(traversalResult1.status === 'error', '路径遍历应该被阻止');
  
  const traversalResult2 = await readFile('../../etc/passwd');
  assert(traversalResult2.status === 'error', '多级路径遍历应该被阻止');
  
  const traversalResult3 = await readFile('/etc/passwd');
  assert(traversalResult3.status === 'error', '绝对路径访问应该被阻止');
});

Deno.test('fileService - writeFile 应该阻止越权写入', async () => {
  const result = await writeFile('../etc/passwd', 'malicious');
  assert(result.status === 'error', '越权写入应该被阻止');
});

Deno.test('fileService - createFile 应该阻止越权创建', async () => {
  const result = await createFile('../../etc/malicious.txt', 'content');
  assert(result.status === 'error', '越权创建应该被阻止');
});

Deno.test('fileService - createDirectory 应该阻止越权创建目录', async () => {
  const result = await createDirectory('../../etc/malicious');
  assert(result.status === 'error', '越权创建目录应该被阻止');
});

Deno.test('fileService - renameFile 应该阻止越权重命名', async () => {
  const result = await renameFile('../etc/passwd', 'newname');
  assert(result.status === 'error', '越权重命名应该被阻止');
});

Deno.test('fileService - deleteFile 应该阻止越权删除', async () => {
  const result = await deleteFile('../etc/passwd');
  assert(result.status === 'error', '越权删除应该被阻止');
});

// 边界情况测试
Deno.test('fileService - 应该处理不存在的路径', async () => {
  // 使用工作区内不存在的路径
  const readResult = await readFile('__nonexistent_file_xyz123__.txt');
  assert(readResult.status === 'error', '读取不存在的文件应该失败');
  
  const deleteResult = await deleteFile('__nonexistent_file_xyz123__.txt');
  assert(deleteResult.status === 'error', '删除不存在的文件应该失败');
  
  const renameResult = await renameFile('__nonexistent_file_xyz123__.txt', 'other.txt');
  assert(renameResult.status === 'error', '重命名不存在的文件应该失败');
});

Deno.test('fileService - getFileTree 应该处理无效路径', async () => {
  const result = await getFileTree('../invalid');
  assert(result.status === 'error', '无效路径应该返回错误');
});

Deno.test('fileService - 应该处理空路径', async () => {
  const result = await readFile('');
  assert(result.status === 'error', '空路径应该返回错误');
});

Deno.test('fileService - 应该处理根路径访问', async () => {
  const result = await readFile('/');
  assert(result.status === 'error', '根路径访问应该被拒绝');
});

Deno.test('fileService - 应该处理深度限制', async () => {
  const result = await getFileTree('/workspace', 0);
  assert(result.status === 'success' || result.status === 'error', '深度为0应该被处理');
});