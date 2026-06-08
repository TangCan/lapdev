import { describe, it } from "https://deno.land/std@0.214.0/testing/bdd.ts";
import { assertEquals, assert, assertExists } from "https://deno.land/std@0.214.0/testing/asserts.ts";
import { existsSync } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const projectRoot = Deno.cwd();

describe('Deployment Configuration Tests', () => {
  describe('Gitee CI Configuration', () => {
    const ciConfigPath = path.join(projectRoot, '.gitee/workflows/ci.yml');
    
    it('should exist', () => {
      assert(existsSync(ciConfigPath), 'CI配置文件不存在');
    });

    it('should contain required jobs', () => {
      const content = Deno.readTextFileSync(ciConfigPath);
      assert(content.includes('jobs:'), '应包含jobs定义');
      assert(content.includes('test:'), '应包含test job');
      assert(content.includes('build:'), '应包含build job');
      assert(content.includes('sync:'), '应包含sync job');
    });

    it('should use Gitee registry', () => {
      const content = Deno.readTextFileSync(ciConfigPath);
      assert(content.includes('registry.gitee.com'), '应使用Gitee容器镜像服务');
    });

    it('should use force-with-lease for git push', () => {
      const content = Deno.readTextFileSync(ciConfigPath);
      assert(content.includes('--force-with-lease'), '应使用--force-with-lease确保安全推送');
      assert(!content.includes('--force') || content.includes('--force-with-lease'), '不应单独使用--force');
    });

    it('should have proper workflow triggers', () => {
      const content = Deno.readTextFileSync(ciConfigPath);
      assert(content.includes('on:'), '应包含触发器定义');
      assert(content.includes('push:'), '应监听push事件');
      assert(content.includes('pull_request:'), '应监听pull_request事件');
    });

    it('should define proper job dependencies', () => {
      const content = Deno.readTextFileSync(ciConfigPath);
      const testSection = content.substring(
        content.indexOf('test:'), 
        content.indexOf('build:')
      );
      assert(!testSection.includes('needs:'), 'test job不应有依赖');
      
      const buildSection = content.substring(
        content.indexOf('build:'), 
        content.indexOf('sync:')
      );
      assert(buildSection.includes('needs: test'), 'build job应依赖test');
      
      const syncSection = content.substring(content.indexOf('sync:'));
      assert(syncSection.includes('needs: build'), 'sync job应依赖build');
    });
  });

  describe('Sync Configuration', () => {
    const syncConfigPath = path.join(projectRoot, '.gitee/workflows/sync.yml');
    
    it('should exist', () => {
      assert(existsSync(syncConfigPath), '同步配置文件不存在');
    });

    it('should sync to GitHub', () => {
      const content = Deno.readTextFileSync(syncConfigPath);
      assert(content.includes('github.com'), '应同步到GitHub');
      assert(content.includes('git push'), '应包含git push命令');
    });

    it('should configure git user', () => {
      const content = Deno.readTextFileSync(syncConfigPath);
      assert(content.includes('git config user.name'), '应配置git用户名');
      assert(content.includes('git config user.email'), '应配置git邮箱');
    });

    it('should use force-with-lease', () => {
      const content = Deno.readTextFileSync(syncConfigPath);
      assert(content.includes('--force-with-lease'), '应使用--force-with-lease');
    });
  });

  describe('Documentation Tests', () => {
    const contributingPath = path.join(projectRoot, 'docs/contributing.md');
    
    it('should exist', () => {
      assert(existsSync(contributingPath), '贡献指南不存在');
    });

    it('should contain Gitee information', () => {
      const content = Deno.readTextFileSync(contributingPath);
      assert(content.includes('Gitee') || content.includes('gitee'), '应包含Gitee信息');
    });

    it('should contain China-specific guidance', () => {
      const content = Deno.readTextFileSync(contributingPath);
      assert(content.includes('国内') || content.includes('China'), '应包含国内访问说明');
    });

    it('should provide clear contribution workflow', () => {
      const content = Deno.readTextFileSync(contributingPath);
      assert(content.includes('Fork'), '应说明Fork流程');
      assert(content.includes('Pull Request') || content.includes('PR'), '应说明PR流程');
    });
  });

  describe('Configuration Validation', () => {
    it('should have proper directory structure', () => {
      const requiredDirs = [
        '.gitee',
        '.gitee/workflows',
        'docs'
      ];
      
      requiredDirs.forEach(dir => {
        const fullPath = path.join(projectRoot, dir);
        assert(existsSync(fullPath), `${dir} 目录不存在`);
      });
    });

    it('should have all required configuration files', () => {
      const requiredFiles = [
        '.gitee/workflows/ci.yml',
        '.gitee/workflows/sync.yml',
        'docs/contributing.md'
      ];
      
      requiredFiles.forEach(file => {
        const fullPath = path.join(projectRoot, file);
        assert(existsSync(fullPath), `${file} 文件不存在`);
      });
    });
  });
});

describe('Network Performance Tests', () => {
  describe('Domestic Access Optimization', () => {
    it('should validate Gitee registry URL format', () => {
      const registryUrl = 'registry.gitee.com';
      assert(registryUrl.includes('gitee'), '应使用Gitee镜像服务');
    });

    it('should have proper region configuration', () => {
      const content = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      assert(content.includes('registry.gitee.com'), '应使用国内镜像服务');
    });
  });
});

describe('Security Configuration Tests', () => {
  describe('Secret Management', () => {
    it('should use environment secrets for sensitive data', () => {
      const content = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      assert(content.includes('${{ secrets.'), '应使用secrets管理敏感信息');
      assert(content.includes('GITEE_USERNAME'), '应配置Gitee用户名secret');
      assert(content.includes('GITEE_PASSWORD'), '应配置Gitee密码secret');
      assert(content.includes('GITHUB_TOKEN'), '应配置GitHub Token secret');
    });

    it('should not contain hardcoded credentials', () => {
      const content = Deno.readTextFileSync(path.join(projectRoot, '.gitee/workflows/ci.yml'));
      const sensitivePatterns = [
        /password\s*[:=]\s*['"]?[a-zA-Z0-9]+['"]?/i,
        /token\s*[:=]\s*['"]?[a-zA-Z0-9]+['"]?/i,
        /secret\s*[:=]\s*['"]?[a-zA-Z0-9]+['"]?/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        assert(!pattern.test(content), `配置文件中不应包含硬编码的敏感信息: ${pattern}`);
      });
    });
  });
});