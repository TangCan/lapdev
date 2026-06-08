// Story 6.2: 国内代码托管与社区 - ATDD验收测试
// 遵循TDD红-绿-重构循环

import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { existsSync } from 'https://deno.land/std/fs/mod.ts';
import * as path from 'https://deno.land/std/path/mod.ts';

const projectRoot = Deno.cwd();

// AC-1: Gitee主仓库托管
Deno.test('AC-1-1: Given 用户访问仓库 When 选择托管平台 Then Gitee主仓库配置存在', () => {
  const giteeDir = path.join(projectRoot, '.gitee');
  assert(existsSync(giteeDir), '.gitee 目录不存在');
});

Deno.test('AC-1-2: Given Gitee配置存在 When 检查目录结构 Then workflows子目录存在', () => {
  const workflowsDir = path.join(projectRoot, '.gitee', 'workflows');
  assert(existsSync(workflowsDir), '.gitee/workflows 目录不存在');
});

// AC-2: GitHub镜像同步
Deno.test('AC-2-1: Given 需要镜像同步 When 查看配置 Then gitee配置文件包含镜像同步设置', () => {
  const workflowsDir = path.join(projectRoot, '.gitee', 'workflows');
  assert(existsSync(workflowsDir), '需要先创建workflows目录');
  
  const files = Array.from(Deno.readDirSync(workflowsDir));
  const hasSyncWorkflow = files.some(file => file.name.includes('sync') || file.name.includes('mirror'));
  assert(hasSyncWorkflow, '应存在镜像同步工作流配置');
});

Deno.test('AC-2-2: Given 贡献指南存在 When 读取文档 Then 包含国内访问说明', () => {
  const contributingFile = path.join(projectRoot, 'docs', 'contributing.md');
  assert(existsSync(contributingFile), 'contributing.md 文档不存在');
  const content = Deno.readTextFileSync(contributingFile);
  const hasGiteeInfo = content.includes('Gitee') || content.includes('gitee');
  const hasChinaInfo = content.includes('国内') || content.includes('China');
  assert(hasGiteeInfo || hasChinaInfo, '贡献指南应包含国内访问说明');
});

// AC-3: Gitee DevOps CI
Deno.test('AC-3-1: Given 代码提交 When 触发CI Then Gitee CI配置文件存在', () => {
  const ciFile = path.join(projectRoot, '.gitee', 'workflows', 'ci.yml');
  assert(existsSync(ciFile), '.gitee/workflows/ci.yml 配置文件不存在');
});

Deno.test('AC-3-2: Given CI配置存在 When 读取文件 Then 包含自动化测试配置', () => {
  const ciFile = path.join(projectRoot, '.gitee', 'workflows', 'ci.yml');
  const content = Deno.readTextFileSync(ciFile);
  
  assert(content.includes('test'), 'CI配置应包含测试步骤');
});

Deno.test('AC-3-3: Given CI配置存在 When 读取文件 Then 包含镜像构建配置', () => {
  const ciFile = path.join(projectRoot, '.gitee', 'workflows', 'ci.yml');
  const content = Deno.readTextFileSync(ciFile);
  
  const hasBuildConfig = content.includes('build') || content.includes('docker') || content.includes('podman');
  assert(hasBuildConfig, 'CI配置应包含镜像构建步骤');
});

Deno.test('AC-3-4: Given CI配置存在 When 读取文件 Then 包含部署相关配置', () => {
  const ciFile = path.join(projectRoot, '.gitee', 'workflows', 'ci.yml');
  const content = Deno.readTextFileSync(ciFile);
  
  const hasDeployConfig = content.includes('deploy') || content.includes('push') || content.includes('registry');
  assert(hasDeployConfig, 'CI配置应包含部署或镜像推送步骤');
});

// 技术要求验证
Deno.test('Tech-1: Given 项目配置 When 检查文件结构 Then .gitee目录结构完整', () => {
  const requiredPaths = [
    '.gitee',
    '.gitee/workflows',
    '.gitee/workflows/ci.yml'
  ];
  
  requiredPaths.forEach(reqPath => {
    const fullPath = path.join(projectRoot, reqPath);
    assert(existsSync(fullPath), `${reqPath} 不存在`);
  });
});

Deno.test('Tech-2: Given CI配置存在 When 读取文件 Then 包含正确的触发器配置', () => {
  const ciFile = path.join(projectRoot, '.gitee', 'workflows', 'ci.yml');
  const content = Deno.readTextFileSync(ciFile);
  
  const hasTrigger = content.includes('on:') || content.includes('trigger:');
  assert(hasTrigger, 'CI配置应包含触发器定义');
});

Deno.test('Tech-3: Given CI配置存在 When 读取文件 Then 包含Gitee相关配置', () => {
  const ciFile = path.join(projectRoot, '.gitee', 'workflows', 'ci.yml');
  const content = Deno.readTextFileSync(ciFile);
  
  const hasGiteeConfig = content.toLowerCase().includes('gitee');
  assert(hasGiteeConfig, 'CI配置应包含Gitee相关配置');
});