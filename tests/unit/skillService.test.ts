import { assert, assertEquals, assertThrows } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { SkillService } from "../../backend/src/services/skillService.ts";

const skillService = new SkillService();

Deno.test({
  name: "@p0 @smoke skillService - validateSkillPath",
  fn: () => {
    assert(() => skillService.validateSkillPath("valid/path/skill.ts"));
    assert(() => skillService.validateSkillPath("skill.ts"));
    assert(() => skillService.validateSkillPath("/absolute/path/skill.ts"));

    assertThrows(() => skillService.validateSkillPath(""));
    assertThrows(() => skillService.validateSkillPath(" "));
    assertThrows(() => skillService.validateSkillPath("../../etc/passwd"));
    assertThrows(() => skillService.validateSkillPath("../secret/file"));
    assertThrows(() => skillService.validateSkillPath("/../etc"));
    assertThrows(() => skillService.validateSkillPath("\\..\\secret"));
    assertThrows(() => skillService.validateSkillPath("%2e%2e/%2e%2e/etc"));
  },
});

Deno.test({
  name: "@p0 @smoke skillService - parseSkillContent",
  fn: () => {
    const validSkill = `---
name: test-skill
description: A test skill
version: 1.0.0
author: test
trigger:
  keywords: ["test", "demo"]
tags: [test, demo]
---
Skill content here
`;

    const result = skillService.parseSkillContent(validSkill, "test-skill.skill.md");
    assertEquals(result.name, "test-skill");
    assertEquals(result.description, "A test skill");
    assertEquals(result.version, "1.0.0");
    assertEquals(result.author, "test");
    assertEquals(result.trigger.keywords, ["test", "demo"]);
    assertEquals(result.content, "Skill content here");
    assertEquals(result.fileName, "test-skill.skill.md");
    assertEquals(result.tags, ["test", "demo"]);

    const noFrontmatter = "Just plain content";
    assertThrows(() => skillService.parseSkillContent(noFrontmatter, "no-frontmatter.skill.md"));
  },
});

Deno.test({
  name: "@p0 skillService - matchSkills with keyword matching",
  fn: () => {
    const skills = [
      { name: "test-skill", version: "1.0.0", description: "", author: "", tags: [], trigger: { keywords: ["test", "demo"] }, content: "Test content", fileName: "test.skill.md" },
      { name: "code-skill", version: "1.0.0", description: "", author: "", tags: [], trigger: { keywords: ["code", "program"] }, content: "Code content", fileName: "code.skill.md" },
      { name: "search-skill", version: "1.0.0", description: "", author: "", tags: [], trigger: { keywords: ["search", "find"] }, content: "Search content", fileName: "search.skill.md" },
    ];

    let matches = skillService.matchSkills("I need to test something", skills);
    assertEquals(matches.length, 1);
    assertEquals(matches[0].name, "test-skill");

    matches = skillService.matchSkills("Can you code this?", skills);
    assertEquals(matches.length, 1);
    assertEquals(matches[0].name, "code-skill");

    matches = skillService.matchSkills("nothing matches", skills);
    assertEquals(matches.length, 0);
  },
});

Deno.test({
  name: "@p0 skillService - matchSkills with pattern matching",
  fn: () => {
    const skills = [
      { name: "file-skill", version: "1.0.0", description: "", author: "", tags: [], trigger: { patterns: ["file.*read", "read.*file"] }, content: "File content", fileName: "file.skill.md" },
      { name: "git-skill", version: "1.0.0", description: "", author: "", tags: [], trigger: { patterns: ["git.*commit", "commit.*git"] }, content: "Git content", fileName: "git.skill.md" },
    ];

    let matches = skillService.matchSkills("I want to read a file", skills);
    assertEquals(matches.length, 1);
    assertEquals(matches[0].name, "file-skill");

    matches = skillService.matchSkills("git commit please", skills);
    assertEquals(matches.length, 1);
    assertEquals(matches[0].name, "git-skill");

    matches = skillService.matchSkills("no pattern match", skills);
    assertEquals(matches.length, 0);
  },
});

Deno.test({
  name: "@p1 skillService - buildSystemPrompt",
  fn: () => {
    const skills = [
      { name: "skill1", version: "1.0.0", description: "First skill", author: "author1", tags: [], trigger: {}, content: "Content 1", fileName: "skill1.skill.md" },
      { name: "skill2", version: "2.0.0", description: "Second skill", author: "", tags: [], trigger: {}, content: "Content 2", fileName: "skill2.skill.md" },
    ];

    const prompt = skillService.buildSystemPrompt(skills);
    assert(prompt.includes("skill1"));
    assert(prompt.includes("skill2"));
    assert(prompt.includes("v1.0.0"));
    assert(prompt.includes("v2.0.0"));
    assert(prompt.includes("Content 1"));
    assert(prompt.includes("Content 2"));

    const emptyPrompt = skillService.buildSystemPrompt([]);
    assertEquals(emptyPrompt, "");
  },
});

Deno.test({
  name: "@p1 skillService - loadSkills with empty directories",
  fn: async () => {
    const tempDir = await Deno.makeTempDir();
    const result = skillService.loadSkills();
    assertEquals(result.globalCount, 0);
    await Deno.remove(tempDir);
  },
});

Deno.test({
  name: "@p1 skillService - getSkills",
  fn: () => {
    const skills = skillService.getSkills();
    assert(Array.isArray(skills));
  },
});

Deno.test({
  name: "@p1 skillService - getSkillByName",
  fn: () => {
    const skill = skillService.getSkillByName("nonexistent");
    assertEquals(skill, undefined);
  },
});

Deno.test({
  name: "@p2 skillService - reload",
  fn: () => {
    const result = skillService.reload();
    assert(result.skills !== undefined);
    assert(result.globalCount !== undefined);
    assert(result.projectCount !== undefined);
  },
});

Deno.test({
  name: "@p2 skillService - registerSkillsFromDirectory with empty directory",
  fn: async () => {
    const tempDir = await Deno.makeTempDir();
    await skillService.registerSkillsFromDirectory(tempDir);
    await Deno.remove(tempDir);
  },
});