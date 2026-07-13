import { assert, assertEquals, assertNotEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { skillValidator } from '../../backend/src/utils/skillValidator.ts';
import { skillPublishService } from '../../backend/src/services/skillPublishService.ts';

Deno.test('Story 10.1: Skill发布命令 - ATDD Acceptance Tests', async (t) => {
  let tempDir: string;

  await t.step('Setup', () => {
    tempDir = Deno.makeTempDirSync({ prefix: 'test-skill-publish-' });
  });

  function createSkillFile(fileName: string, content: string): string {
    const filePath = `${tempDir}/${fileName}`;
    Deno.writeTextFileSync(filePath, content);
    return filePath;
  }

  const VALID_SKILL_CONTENT = `---
name: "test-skill"
version: "1.0.0"
description: "Test skill description"
author: "Test Author"
tags: ["test", "demo"]
trigger:
  keywords: ["hello"]
---

## 指令说明

This is a test skill.
`;

  await t.step('Scenario 1: Skill文件格式验证', async (t) => {
    await t.step('TC-10.1.1: 有效Skill文件验证通过', async () => {
      const filePath = createSkillFile('valid.skill.md', VALID_SKILL_CONTENT);
      
      const result = await skillValidator.validateSkillFile(filePath);
      
      assert(result.isValid, 'Skill文件应该验证通过');
      assertEquals(result.errors.length, 0, '错误列表应该为空');
    });

    await t.step('TC-10.1.2: 缺少名称字段验证失败', async () => {
      const content = `---
version: "1.0.0"
description: "Test skill description"
author: "Test Author"
---

## 指令说明

Skill without name.
`;
      const filePath = createSkillFile('missing-name.skill.md', content);
      
      const result = await skillValidator.validateSkillFile(filePath);
      
      assert(!result.isValid, '缺少名称字段应该验证失败');
      assert((result.errors as string[]).some((e: string) => e.includes('缺少必填字段：name')), '错误信息应该包含name');
    });

    await t.step('TC-10.1.3: 缺少版本字段验证失败', async () => {
      const content = `---
name: "test-skill"
description: "Test skill description"
author: "Test Author"
---

## 指令说明

Skill without version.
`;
      const filePath = createSkillFile('missing-version.skill.md', content);
      
      const result = await skillValidator.validateSkillFile(filePath);
      
      assert(!result.isValid, '缺少版本字段应该验证失败');
      assert((result.errors as string[]).some((e: string) => e.includes('缺少必填字段：version')), '错误信息应该包含version');
    });

    await t.step('TC-10.1.4: 缺少描述字段验证失败', async () => {
      const content = `---
name: "test-skill"
version: "1.0.0"
author: "Test Author"
---

## 指令说明

Skill without description.
`;
      const filePath = createSkillFile('missing-description.skill.md', content);
      
      const result = await skillValidator.validateSkillFile(filePath);
      
      assert(!result.isValid, '缺少描述字段应该验证失败');
      assert((result.errors as string[]).some((e: string) => e.includes('缺少必填字段：description')), '错误信息应该包含description');
    });

    await t.step('TC-10.1.5: 缺少作者字段验证失败', async () => {
      const content = `---
name: "test-skill"
version: "1.0.0"
description: "Test skill description"
---

## 指令说明

Skill without author.
`;
      const filePath = createSkillFile('missing-author.skill.md', content);
      
      const result = await skillValidator.validateSkillFile(filePath);
      
      assert(!result.isValid, '缺少作者字段应该验证失败');
      assert((result.errors as string[]).some((e: string) => e.includes('缺少必填字段：author')), '错误信息应该包含author');
    });
  });

  await t.step('Scenario 2: 格式错误处理', async (t) => {
    await t.step('TC-10.1.6: 无效YAML格式处理', async () => {
      const content = `---
name: "test-skill"
version: "1.0.0"
description: "Test"
author: "Test Author"
invalid: [broken yaml
---

## 指令说明

Skill with invalid YAML.
`;
      const filePath = createSkillFile('invalid-yaml.skill.md', content);
      
      const result = await skillValidator.validateSkillFile(filePath);
      
      assert(!result.isValid, '无效YAML应该验证失败');
      assert((result.errors as string[]).some((e: string) => e.includes('无效的YAML格式')), '错误信息应该包含YAML');
    });

    await t.step('TC-10.1.7: 无效版本号格式处理', async () => {
      const content = `---
name: "test-skill"
version: "invalid-version"
description: "Test skill description"
author: "Test Author"
---

## 指令说明

Skill with invalid version format.
`;
      const filePath = createSkillFile('invalid-version.skill.md', content);
      
      const result = await skillValidator.validateSkillFile(filePath);
      
      assert(!result.isValid, '无效版本号应该验证失败');
      assert((result.errors as string[]).some((e: string) => e.includes('无效的版本号格式')), '错误信息应该包含版本号');
    });

    await t.step('TC-10.1.8: 缺少YAML frontmatter处理', async () => {
      const content = `## 指令说明

Skill without frontmatter.
`;
      const filePath = createSkillFile('no-frontmatter.skill.md', content);
      
      const result = await skillValidator.validateSkillFile(filePath);
      
      assert(!result.isValid, '缺少frontmatter应该验证失败');
      assert((result.errors as string[]).some((e: string) => e.includes('缺少YAML frontmatter')), '错误信息应该包含frontmatter');
    });
  });

  await t.step('Scenario 3: 用户认证检查', async (t) => {
    await t.step('TC-10.1.9: 未登录时发布失败', async () => {
      await skillPublishService.logout();
      
      const filePath = createSkillFile('valid.skill.md', VALID_SKILL_CONTENT);
      
      const result = await skillPublishService.publish(filePath);
      
      assert(!result.success, '未登录时发布应该失败');
      assert(result.error && result.error.includes('请先登录'), '错误信息应该包含登录提示');
    });

    await t.step('TC-10.1.10: 登录成功', async () => {
      const result = await skillPublishService.login('test-api-key-123456789012345678901234567890');
      
      assert(result.success, '登录应该成功');
      assert(result.message.includes('登录成功'), '消息应该包含登录成功');
    });

    await t.step('TC-10.1.11: 已登录时发布验证通过', async () => {
      await skillPublishService.login('test-api-key-123456789012345678901234567890');
      
      const filePath = createSkillFile('valid.skill.md', VALID_SKILL_CONTENT);
      
      const result = await skillPublishService.publish(filePath);
      
      assert(result.success, '已登录时发布应该成功');
      assert(result.message.includes('发布成功'), '消息应该包含发布成功');
    });

    await t.step('TC-10.1.12: 无效API Key处理', async () => {
      await skillPublishService.login('short');
      
      const filePath = createSkillFile('valid.skill.md', VALID_SKILL_CONTENT);
      
      const result = await skillPublishService.publish(filePath);
      
      assert(!result.success, '无效API Key应该发布失败');
      assert(result.error && result.error.includes('无效的API Key'), '错误信息应该包含无效API Key');
    });
  });

  await t.step('Scenario 4: 命令行参数处理', async (t) => {
    await t.step('TC-10.1.13: Dry Run模式验证', async () => {
      await skillPublishService.login('test-api-key-123456789012345678901234567890');
      
      const filePath = createSkillFile('valid.skill.md', VALID_SKILL_CONTENT);
      
      const result = await skillPublishService.publish(filePath, true);
      
      assert(result.success, 'Dry Run应该成功');
      assert(result.message.includes('Dry Run'), '消息应该包含Dry Run');
    });

    await t.step('TC-10.1.14: 不存在的文件处理', async () => {
      const result = await skillValidator.validateSkillFile('/path/to/nonexistent.skill.md');
      
      assert(!result.isValid, '不存在的文件应该验证失败');
      assert((result.errors as string[]).some((e: string) => e.includes('文件不存在')), '错误信息应该包含文件不存在');
    });
  });

  await t.step('Cleanup', () => {
    Deno.removeSync(tempDir, { recursive: true });
  });
});
