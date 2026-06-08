import { describe, it } from "https://deno.land/std@0.214.0/testing/bdd.ts";
import { assertEquals, assert, assertExists } from "https://deno.land/std@0.214.0/testing/asserts.ts";
import { existsSync, walk } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const projectRoot = Deno.cwd();

describe('Deployment Integration Tests', () => {
  describe('CI/CD Pipeline Integration', () => {
    it('should have all required CI stages defined', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      
      const stages = ['test', 'build', 'sync'];
      stages.forEach(stage => {
        assert(ciConfig.includes(`${stage}:`), `CI配置应包含${stage}阶段`);
      });
    });

    it('should have proper execution order', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      
      const testIndex = ciConfig.indexOf('test:');
      const buildIndex = ciConfig.indexOf('build:');
      const syncIndex = ciConfig.indexOf('sync:');
      
      assert(testIndex < buildIndex, 'test应在build之前');
      assert(buildIndex < syncIndex, 'build应在sync之前');
    });

    it('should run tests on push and PR', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      
      assert(ciConfig.includes('push:'), '应在push时触发');
      assert(ciConfig.includes('pull_request:'), '应在PR时触发');
    });

    it('should build Docker image after tests pass', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      
      const buildSection = ciConfig.substring(
        ciConfig.indexOf('build:'),
        ciConfig.indexOf('sync:')
      );
      
      assert(buildSection.includes('needs: test'), 'build应依赖test');
      assert(buildSection.includes('docker/build-push-action'), '应使用Docker build action');
    });

    it('should sync to GitHub after build', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      
      const syncSection = ciConfig.substring(ciConfig.indexOf('sync:'));
      
      assert(syncSection.includes('needs: build'), 'sync应依赖build');
      assert(syncSection.includes('github.com'), '应同步到GitHub');
    });
  });

  describe('Configuration Consistency', () => {
    it('should use consistent registry across configurations', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      
      const registryMatches = ciConfig.match(/registry\.[a-zA-Z0-9.-]+/g);
      assertExists(registryMatches);
      
      const uniqueRegistries = [...new Set(registryMatches)];
      assertEquals(uniqueRegistries.length, 1, '应使用统一的镜像仓库');
      assertEquals(uniqueRegistries[0], 'registry.gitee.com', '应使用Gitee镜像服务');
    });

    it('should have matching repository references', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      const syncConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/sync.yml'));
      const contributingDoc = Deno.readTextFileSync(path.join(projectRoot, 'docs/contributing.md'));
      
      const expectedRepo = 'lapdev/lapdev';
      
      assert(ciConfig.includes(expectedRepo), 'CI配置应引用正确的仓库');
      assert(syncConfig.includes(expectedRepo), '同步配置应引用正确的仓库');
      assert(contributingDoc.includes('gitee.com/lapdev/lapdev'), '贡献指南应包含正确的仓库地址');
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should use cross-platform compatible actions', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      
      const crossPlatformActions = [
        'actions/checkout',
        'docker/setup-qemu-action',
        'docker/setup-buildx-action',
        'docker/login-action',
        'docker/build-push-action',
        'denoland/setup-deno'
      ];
      
      crossPlatformActions.forEach(action => {
        assert(ciConfig.includes(action), `应使用跨平台兼容的action: ${action}`);
      });
    });

    it('should specify Deno version explicitly', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      
      assert(ciConfig.includes('deno-version:'), '应明确指定Deno版本');
      assert(ciConfig.includes('v1.42.0'), '应使用指定版本v1.42.0');
    });
  });

  describe('Documentation Integration', () => {
    it('should document all required secrets', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      const contributingDoc = Deno.readTextFileSync(path.join(projectRoot, 'docs/contributing.md'));
      
      const secretsUsed = ['GITEE_USERNAME', 'GITEE_PASSWORD', 'GITHUB_TOKEN'];
      
      secretsUsed.forEach(secret => {
        assert(ciConfig.includes(secret), `CI配置应使用${secret}`);
      });
    });

    it('should provide clear setup instructions', () => {
      const contributingDoc = Deno.readTextFileSync(path.join(projectRoot, 'docs/contributing.md'));
      
      assert(contributingDoc.includes('git clone'), '应提供克隆仓库的说明');
      assert(contributingDoc.includes('git checkout'), '应提供创建分支的说明');
    });
  });

  describe('Deployment Artifact Validation', () => {
    it('should have all required workflow files', async () => {
      const workflowDir = path.join(projectRoot, '.gitee/workflows');
      const files = [];
      
      for await (const entry of walk(workflowDir)) {
        if (entry.isFile) {
          files.push(entry.name);
        }
      }
      
      assert(files.includes('ci.yml'), '应存在ci.yml');
      assert(files.includes('sync.yml'), '应存在sync.yml');
    });

    it('should validate workflow file formats', () => {
      const ciConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      const syncConfig = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/sync.yml'));
      
      assert(ciConfig.startsWith('name:'), 'YAML文件应以name开头');
      assert(syncConfig.startsWith('name:'), 'YAML文件应以name开头');
      
      assert(ciConfig.includes('on:'), '应包含触发器配置');
      assert(ciConfig.includes('jobs:'), '应包含jobs配置');
      assert(syncConfig.includes('on:'), '应包含触发器配置');
      assert(syncConfig.includes('jobs:'), '应包含jobs配置');
    });
  });
});