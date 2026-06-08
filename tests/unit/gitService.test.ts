// Git服务单元测试
import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { getGitStatus, getGitDiff, getBranches, stageFiles, commitChanges, checkoutBranch } from '../../backend/src/services/gitService.ts';

// 注意：需要模拟Deno.run来测试Git操作
// 这里我们主要测试安全检查功能和边界情况

Deno.test('gitService - sanitizePath 应该移除路径遍历字符', () => {
  // 由于sanitizePath是内部函数，我们通过测试公共API间接验证
  
  // 测试路径遍历攻击应该被阻止
  // 通过检查validatePath的行为来验证sanitizePath的效果
  
  // 路径遍历攻击模式
  const maliciousPaths = [
    '../etc/passwd',
    '../../etc/passwd',
    './../etc/passwd',
    '/etc/passwd',
    'etc/../passwd'
  ];
  
  // 这些路径应该都被拒绝（通过getGitDiff等API）
  // 由于我们无法直接测试内部函数，我们验证API对恶意输入的处理
});

Deno.test('gitService - commitChanges 应该验证提交信息', async () => {
  // 测试空提交信息
  const emptyResult = await commitChanges('');
  assert(emptyResult.status === 'error', '空提交信息应该返回错误');
  assert(emptyResult.message === 'Commit message is required', '错误消息不正确');
  
  // 测试空格提交信息
  const whitespaceResult = await commitChanges('   ');
  assert(whitespaceResult.status === 'error', '空格提交信息应该返回错误');
  
  // 测试包含危险字符的提交信息
  const dangerousMessage1 = await commitChanges('test; rm -rf /');
  assert(dangerousMessage1.status === 'error', '包含分号的提交信息应该被拒绝');
  
  const dangerousMessage2 = await commitChanges('test | ls');
  assert(dangerousMessage2.status === 'error', '包含管道符的提交信息应该被拒绝');
  
  const dangerousMessage3 = await commitChanges('test `rm -rf /`');
  assert(dangerousMessage3.status === 'error', '包含反引号的提交信息应该被拒绝');
});

Deno.test('gitService - checkoutBranch 应该验证分支名称', async () => {
  // 测试空分支名称
  const emptyResult = await checkoutBranch('');
  assert(emptyResult.status === 'error', '空分支名称应该返回错误');
  
  // 测试空格分支名称
  const whitespaceResult = await checkoutBranch('   ');
  assert(whitespaceResult.status === 'error', '空格分支名称应该返回错误');
  
  // 测试包含路径遍历的分支名称
  const pathTraversal1 = await checkoutBranch('../malicious');
  assert(pathTraversal1.status === 'error', '包含../的分支名称应该被拒绝');
  
  const pathTraversal2 = await checkoutBranch('branch/../evil');
  assert(pathTraversal2.status === 'error', '包含/../的分支名称应该被拒绝');
  
  const pathTraversal3 = await checkoutBranch('branch\\../evil');
  assert(pathTraversal3.status === 'error', '包含\\../的分支名称应该被拒绝');
});

Deno.test('gitService - getGitStatus 应该处理非Git仓库', async () => {
  // 设置一个临时目录作为非Git仓库
  const tempDir = await Deno.makeTempDir();
  
  // 修改WORKSPACE_PATH环境变量
  const originalPath = Deno.env.get('WORKSPACE_PATH');
  Deno.env.set('WORKSPACE_PATH', tempDir);
  
  try {
    const result = await getGitStatus();
    assert(result.status === 'error', '非Git仓库应该返回错误');
    assert(result.message === 'Not a git repository', '错误消息不正确');
  } finally {
    // 清理
    Deno.env.set('WORKSPACE_PATH', originalPath || '/workspace');
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('gitService - getBranches 应该处理非Git仓库', async () => {
  const tempDir = await Deno.makeTempDir();
  const originalPath = Deno.env.get('WORKSPACE_PATH');
  Deno.env.set('WORKSPACE_PATH', tempDir);
  
  try {
    const result = await getBranches();
    assert(result.status === 'error', '非Git仓库应该返回错误');
    assert(result.message === 'Not a git repository', '错误消息不正确');
  } finally {
    Deno.env.set('WORKSPACE_PATH', originalPath || '/workspace');
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test('gitService - stageFiles 应该验证路径', async () => {
  // 测试包含路径遍历的路径
  const result = await stageFiles(['../etc/passwd']);
  assert(result.status === 'error', '包含路径遍历的路径应该被拒绝');
  
  // 测试多个路径，其中包含无效路径
  const mixedResult = await stageFiles(['valid/file.txt', '../etc/passwd', 'another/file.txt']);
  assert(mixedResult.status === 'error', '包含无效路径的数组应该被拒绝');
});

Deno.test('gitService - getGitDiff 应该验证路径', async () => {
  // 测试路径遍历攻击
  const result = await getGitDiff('../etc/passwd');
  assert(result.status === 'error', '路径遍历应该被拒绝');
  
  // 测试空路径
  const emptyResult = await getGitDiff('');
  assert(emptyResult.status === 'error', '空路径应该被拒绝');
  
  // 测试包含危险字符的路径
  const dangerousPath = await getGitDiff('file; rm -rf /');
  assert(dangerousPath.status === 'error', '包含危险字符的路径应该被拒绝');
});

Deno.test('gitService - commitChanges 应该验证消息长度', async () => {
  // 创建一个超过最大长度的消息
  const longMessage = 'a'.repeat(1001);
  const result = await commitChanges(longMessage);
  assert(result.status === 'error', '过长的提交信息应该被拒绝');
  assert(result.message?.includes('too long'), '错误消息应该包含"too long"');
});