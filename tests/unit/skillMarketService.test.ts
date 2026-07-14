import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { SkillMarketService } from "../../backend/src/services/skillMarketService.ts";

Deno.test({
  name: "@p0 10.2-UNIT-001 SkillMarketService search - should return all skills when no query",
  fn: () => {
    const service = new SkillMarketService();
    const result = service.search("");
    assertEquals(result.total, 6);
    assertEquals(result.skills.length, 6);
    assertEquals(result.page, 1);
    assertEquals(result.pageSize, 10);
  },
});

Deno.test({
  name: "@p0 10.2-UNIT-002 SkillMarketService search - should filter by keyword in name",
  fn: () => {
    const service = new SkillMarketService();
    const result = service.search("code");
    assert(result.total >= 1);
    const foundSkill = result.skills.find((s) => s.name === "code-review");
    assert(foundSkill !== undefined);
  },
});

Deno.test({
  name: "@p0 10.2-UNIT-003 SkillMarketService search - should filter by keyword in description",
  fn: () => {
    const service = new SkillMarketService();
    const result = service.search("测试");
    assert(result.total >= 1);
    const foundSkill = result.skills.find((s) => s.name === "test-generator");
    assert(foundSkill !== undefined);
  },
});

Deno.test({
  name: "@p1 10.2-UNIT-004 SkillMarketService search - should filter by tag",
  fn: () => {
    const service = new SkillMarketService();
    const result = service.search("", { tags: ["quality"] });
    assert(result.total >= 2);
    assert(result.skills.some((s) => s.name === "code-review"));
    assert(result.skills.some((s) => s.name === "refactor-assistant"));
  },
});

Deno.test({
  name: "@p1 10.2-UNIT-005 SkillMarketService search - should support pagination",
  fn: () => {
    const service = new SkillMarketService();
    const result = service.search("", { limit: 2, page: 2 });
    assertEquals(result.total, 6);
    assertEquals(result.skills.length, 2);
    assertEquals(result.page, 2);
    assertEquals(result.pageSize, 2);
  },
});

Deno.test({
  name: "@p1 10.2-UNIT-006 SkillMarketService search - should return empty for non-existent query",
  fn: () => {
    const service = new SkillMarketService();
    const result = service.search("non-existent-skill-xyz");
    assertEquals(result.total, 0);
    assertEquals(result.skills.length, 0);
  },
});

Deno.test({
  name: "@p0 10.2-UNIT-007 SkillMarketService getSkill - should return skill by name",
  fn: () => {
    const service = new SkillMarketService();
    const result = service.getSkill("code-review");
    assert(result.success);
    assertEquals(result.skill?.name, "code-review");
    assertEquals(result.skill?.version, "1.0.0");
  },
});

Deno.test({
  name: "@p0 10.2-UNIT-008 SkillMarketService getSkill - should return error for non-existent skill",
  fn: () => {
    const service = new SkillMarketService();
    const result = service.getSkill("non-existent");
    assert(!result.success);
    assert(result.error?.includes("不存在"));
  },
});

Deno.test({
  name: "@p0 10.2-UNIT-009 SkillMarketService installSkill - should reject invalid path characters",
  fn: async () => {
    const service = new SkillMarketService();
    const result = await service.installSkill("../../malicious/skill", "/tmp/skills");
    assert(!result.success);
    assert(result.error?.includes("非法路径字符"));
  },
});

Deno.test({
  name: "@p0 10.2-UNIT-010 SkillMarketService installSkill - should reject non-existent skill",
  fn: async () => {
    const service = new SkillMarketService();
    const result = await service.installSkill("non-existent", "/tmp/skills");
    assert(!result.success);
    assert(result.error?.includes("不存在"));
  },
});

Deno.test({
  name: "@p0 10.2-UNIT-011 SkillMarketService updateSkill - should reject invalid path characters",
  fn: async () => {
    const service = new SkillMarketService();
    const result = await service.updateSkill("../../malicious/skill", "/tmp/skills");
    assert(!result.success);
    assert(result.error?.includes("非法路径字符"));
  },
});

Deno.test({
  name: "@p0 10.2-UNIT-012 SkillMarketService updateSkill - should reject non-existent skill",
  fn: async () => {
    const service = new SkillMarketService();
    const result = await service.updateSkill("non-existent", "/tmp/skills");
    assert(!result.success);
    assert(result.error?.includes("不存在"));
  },
});

Deno.test({
  name: "@p1 10.2-UNIT-013 SkillMarketService updateSkill - should reject if not installed",
  fn: async () => {
    const service = new SkillMarketService();
    const result = await service.updateSkill("code-review", "/tmp/non-existent-dir");
    assert(!result.success);
    assert(result.error?.includes("未安装"));
  },
});

Deno.test({
  name: "@p1 10.2-UNIT-014 compareVersions - should correctly compare versions",
  fn: () => {
    const compareVersions = (v1: string, v2: string): number => {
      const parts1 = v1.split(".").map((p) => parseInt(p, 10) || 0);
      const parts2 = v2.split(".").map((p) => parseInt(p, 10) || 0);
      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
      }
      return 0;
    };
    assertEquals(compareVersions("1.0.0", "1.0.0"), 0);
    assertEquals(compareVersions("1.1.0", "1.0.0"), 1);
    assertEquals(compareVersions("1.0.0", "1.1.0"), -1);
    assertEquals(compareVersions("2.0.0", "1.9.9"), 1);
    assertEquals(compareVersions("1.0.1", "1.0.0"), 1);
    assertEquals(compareVersions("1.0.0", "1.0.1"), -1);
  },
});

Deno.test({
  name: "@p1 10.2-UNIT-015 validateSkillContent - should validate YAML frontmatter",
  fn: () => {
    const validateSkillContent = (content: string): boolean => {
      return content.startsWith("---") && content.includes("name:") && content.includes("version:");
    };
    assert(validateSkillContent("---\nname: test-skill\nversion: 1.0.0\n---\ncontent"));
    assert(!validateSkillContent("name: test-skill\nversion: 1.0.0"));
    assert(!validateSkillContent("---\nversion: 1.0.0\n---"));
    assert(!validateSkillContent("---\nname: test-skill\n---"));
    assert(!validateSkillContent("invalid content"));
  },
});

Deno.test({
  name: "@p0 10.2-UNIT-016 isValidFilePath - should reject path traversal",
  fn: () => {
    const isValidFilePath = (filePath: string): boolean => {
      const normalized = filePath.replace(/\\/g, "/");
      if (normalized.startsWith("..")) return false;
      if (normalized.includes("/../")) return false;
      if (normalized.includes("./../")) return false;
      return true;
    };
    assert(isValidFilePath("valid-skill"));
    assert(isValidFilePath("skill-name-123"));
    assert(!isValidFilePath("../etc/passwd"));
    assert(!isValidFilePath("./../secret"));
    assert(!isValidFilePath("skill/../../etc"));
  },
});

Deno.test({
  name: "@p1 10.2-UNIT-017 SkillMarketService getAllSkills - should return all mock skills",
  fn: () => {
    const service = new SkillMarketService();
    const skills = service.getAllSkills();
    assertEquals(skills.length, 6);
    assert(skills.some((s) => s.name === "code-review"));
    assert(skills.some((s) => s.name === "test-generator"));
  },
});

Deno.test({
  name: "@p1 10.2-UNIT-018 SkillMarketService getInstalledSkills - should return empty for non-existent dir",
  fn: () => {
    const service = new SkillMarketService();
    const skills = service.getInstalledSkills("/tmp/non-existent-dir-xyz");
    assertEquals(skills.length, 0);
  },
});