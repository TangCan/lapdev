import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { skillMarketService } from "../../backend/src/services/skillMarketService.ts";

Deno.test({
  name: "@p0 @smoke Story 10.2 - SkillMarketService search with valid keyword",
  fn: () => {
    const result = skillMarketService.search("code");
    assert(result.total > 0, "搜索结果应该不为空");
    assert(result.skills.some((s) => s.name.includes("code")), "搜索结果应该包含匹配的Skill");
  },
});

Deno.test({
  name: "@p1 Story 10.2 - SkillMarketService search with non-existent keyword",
  fn: () => {
    const result = skillMarketService.search("nonexistent-skill-xyz");
    assertEquals(result.total, 0, "搜索不存在的关键词应该返回空结果");
    assertEquals(result.skills.length, 0, "搜索不存在的关键词应该返回空列表");
  },
});

Deno.test({
  name: "@p2 Story 10.2 - SkillMarketService search with empty query",
  fn: () => {
    const result = skillMarketService.search("");
    assertEquals(result.total, 6, "空查询应该返回所有Skill");
  },
});

Deno.test({
  name: "@p0 @smoke Story 10.2 - SkillMarketService getSkill for existing skill",
  fn: () => {
    const result = skillMarketService.getSkill("code-review");
    assert(result.success, "应该成功获取Skill详情");
    assert(result.skill, "应该返回Skill信息");
    assertEquals(result.skill!.name, "code-review", "Skill名称应该正确");
    assertEquals(result.skill!.author, "lapdev", "作者应该正确");
  },
});

Deno.test({
  name: "@p1 Story 10.2 - SkillMarketService getSkill for non-existent skill",
  fn: () => {
    const result = skillMarketService.getSkill("nonexistent-skill");
    assertEquals(result.success, false, "不存在的Skill应该返回失败");
    assert(result.error, "应该返回错误信息");
  },
});

Deno.test({
  name: "@p0 @smoke Story 10.2 - SkillMarketService getAllSkills",
  fn: () => {
    const skills = skillMarketService.getAllSkills();
    assertEquals(skills.length, 6, "应该返回所有6个mock Skill");
  },
});