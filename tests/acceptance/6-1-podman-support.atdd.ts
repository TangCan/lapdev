// Story 6.1: Podman原生支持 - ATDD验收测试
// 遵循TDD红-绿-重构循环

import { assert } from 'https://deno.land/std/testing/asserts.ts';
import { existsSync } from 'https://deno.land/std/fs/mod.ts';
import * as path from 'https://deno.land/std/path/mod.ts';

const projectRoot = Deno.cwd();

// AC-1: Podman Compose配置
Deno.test('AC-1-1: Given 用户获取项目 When 查看项目根目录 Then 提供podman-compose.yml文件', () => {
  const composeFile = path.join(projectRoot, 'podman-compose.yml');
  assert(existsSync(composeFile), 'podman-compose.yml 文件不存在');
});

Deno.test('AC-1-2: Given podman-compose.yml存在 When 读取文件 Then 包含Lapdev服务定义', () => {
  const composeFile = path.join(projectRoot, 'podman-compose.yml');
  const content = Deno.readTextFileSync(composeFile);
  
  assert(content.includes('lapdev'), 'Compose文件应包含Lapdev服务');
  assert(content.includes('services'), 'Compose文件应包含services定义');
});

Deno.test('AC-1-3: Given podman-compose.yml存在 When 读取文件 Then 包含端口映射配置', () => {
  const composeFile = path.join(projectRoot, 'podman-compose.yml');
  const content = Deno.readTextFileSync(composeFile);
  
  assert(content.includes('8080'), '应包含前端端口8080');
  assert(content.includes('3000'), '应包含API端口3000');
});

Deno.test('AC-1-4: Given podman-compose.yml存在 When 读取文件 Then 包含工作区目录挂载', () => {
  const composeFile = path.join(projectRoot, 'podman-compose.yml');
  const content = Deno.readTextFileSync(composeFile);
  
  assert(content.includes('volume'), '应包含volume配置');
  assert(content.includes('workspace'), '应包含工作区挂载');
});

// AC-2: 自动化安装脚本
Deno.test('AC-2-1: Given 用户需要配置 When 查看scripts目录 Then 提供setup_podman.sh脚本', () => {
  const scriptFile = path.join(projectRoot, 'scripts', 'setup_podman.sh');
  assert(existsSync(scriptFile), 'setup_podman.sh 脚本不存在');
});

Deno.test('AC-2-2: Given setup_podman.sh存在 When 检查文件权限 Then 脚本可执行', () => {
  const scriptFile = path.join(projectRoot, 'scripts', 'setup_podman.sh');
  const stat = Deno.statSync(scriptFile);
  
  const isExecutable = stat.mode !== null && (stat.mode & 0o111) !== 0;
  assert(isExecutable, 'setup_podman.sh 脚本不可执行');
});

Deno.test('AC-2-3: Given setup_podman.sh存在 When 读取脚本 Then 包含Podman安装逻辑', () => {
  const scriptFile = path.join(projectRoot, 'scripts', 'setup_podman.sh');
  const content = Deno.readTextFileSync(scriptFile);
  
  assert(content.includes('podman'), '脚本应包含podman相关操作');
  assert(content.includes('install'), '脚本应包含安装逻辑');
});

Deno.test('AC-2-4: Given setup_podman.sh存在 When 读取脚本 Then 包含国内镜像配置', () => {
  const scriptFile = path.join(projectRoot, 'scripts', 'setup_podman.sh');
  const content = Deno.readTextFileSync(scriptFile);
  
  assert(content.includes('registry'), '脚本应包含镜像仓库配置');
  const hasMirrorConfig = content.includes('mirror') || content.includes('aliyun') || content.includes('acceleration');
  assert(hasMirrorConfig, '脚本应包含镜像加速配置');
});

// AC-3: Docker兼容性
Deno.test('AC-3-1: Given 用户有Docker镜像 When 检查项目 Then Dockerfile存在', () => {
  const dockerFile = path.join(projectRoot, 'Dockerfile');
  assert(existsSync(dockerFile), 'Dockerfile 不存在');
});

Deno.test('AC-3-2: Given Dockerfile存在 When 读取文件 Then 包含FROM指令', () => {
  const dockerFile = path.join(projectRoot, 'Dockerfile');
  const content = Deno.readTextFileSync(dockerFile);
  
  assert(content.includes('FROM '), 'Dockerfile应包含FROM指令');
});

Deno.test('AC-3-3: Given Dockerfile存在 When 读取文件 Then 不使用Docker特有指令', () => {
  const dockerFile = path.join(projectRoot, 'Dockerfile');
  const content = Deno.readTextFileSync(dockerFile);
  
  const dockerSpecificDirectives = ['--mount=type=secret', '--mount=type=ssh'];
  dockerSpecificDirectives.forEach(directive => {
    assert(!content.includes(directive), `Dockerfile不应包含Podman不支持的指令: ${directive}`);
  });
});

// AC-4: 文档说明
Deno.test('AC-4-1: Given 用户需要文档 When 查看docs目录 Then 提供Podman部署文档', () => {
  const docFile = path.join(projectRoot, 'docs', 'deployment-podman.md');
  assert(existsSync(docFile), 'deployment-podman.md 文档不存在');
});

Deno.test('AC-4-2: Given 部署文档存在 When 读取文档 Then 包含国内镜像源配置说明', () => {
  const docFile = path.join(projectRoot, 'docs', 'deployment-podman.md');
  const content = Deno.readTextFileSync(docFile);
  
  const hasRegistryConfig = content.includes('镜像源') || content.includes('mirror') || content.includes('registry');
  const hasChinaConfig = content.includes('国内') || content.includes('China') || content.includes('CN');
  assert(hasRegistryConfig, '文档应包含镜像源配置说明');
  assert(hasChinaConfig, '文档应包含国内镜像说明');
});

Deno.test('AC-4-3: Given 部署文档存在 When 读取文档 Then 包含离线镜像包加载说明', () => {
  const docFile = path.join(projectRoot, 'docs', 'deployment-podman.md');
  const content = Deno.readTextFileSync(docFile);
  
  const hasOfflineConfig = content.includes('离线') || content.includes('offline') || content.includes('load');
  assert(hasOfflineConfig, '文档应包含离线镜像包加载说明');
});