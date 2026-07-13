import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { handleSkillLoad, handleSkillMatch, handleSkillRegister, handleSkillList } from "../../backend/src/handlers/skillHandler.ts";

function createRequest(method: string, path: string, body?: string): Request {
  return new Request(`http://localhost:8000${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body,
  });
}

Deno.test({
  name: "@p0 @smoke skillHandler - handleSkillMatch with valid query",
  fn: async () => {
    const req = createRequest("POST", "/api/skills/match", JSON.stringify({ query: "test skill" }));
    const res = await handleSkillMatch(req);
    assertEquals(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json));
  },
});

Deno.test({
  name: "@p0 skillHandler - handleSkillMatch with empty query returns 400",
  fn: async () => {
    const req = createRequest("POST", "/api/skills/match", JSON.stringify({ query: "" }));
    const res = await handleSkillMatch(req);
    assertEquals(res.status, 400);
  },
});

Deno.test({
  name: "@p0 skillHandler - handleSkillMatch with missing query",
  fn: async () => {
    const req = createRequest("POST", "/api/skills/match", JSON.stringify({}));
    const res = await handleSkillMatch(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.error);
  },
});

Deno.test({
  name: "@p0 skillHandler - handleSkillMatch with invalid JSON",
  fn: async () => {
    const req = new Request("http://localhost:8000/api/skills/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    });
    const res = await handleSkillMatch(req);
    assertEquals(res.status, 500);
  },
});

Deno.test({
  name: "@p1 skillHandler - handleSkillList",
  fn: async () => {
    const req = createRequest("GET", "/api/skills/list");
    const res = await handleSkillList(req);
    assertEquals(res.status, 200);
    const json = await res.json();
    assert(Array.isArray(json));
  },
});

Deno.test({
  name: "@p1 skillHandler - handleSkillLoad",
  fn: async () => {
    const req = createRequest("GET", "/api/skills/load");
    const res = await handleSkillLoad(req);
    assertEquals(res.status, 200);
    const json = await res.json();
    assert(json.skills !== undefined);
  },
});

Deno.test({
  name: "@p1 skillHandler - handleSkillRegister with valid directory",
  fn: async () => {
    const tempDir = await Deno.makeTempDir();
    const req = createRequest("POST", "/api/skills/register", JSON.stringify({ skillsDir: tempDir }));
    const res = await handleSkillRegister(req);
    assertEquals(res.status, 200);
    const json = await res.json();
    assert(json.success);
    await Deno.remove(tempDir);
  },
});

Deno.test({
  name: "@p1 skillHandler - handleSkillRegister with invalid directory",
  fn: async () => {
    const req = createRequest("POST", "/api/skills/register", JSON.stringify({ skillsDir: "/nonexistent/path" }));
    const res = await handleSkillRegister(req);
    assertEquals(res.status, 200);
    await Deno.remove("/nonexistent/path").catch(() => {});
  },
});

Deno.test({
  name: "@p1 skillHandler - handleSkillRegister with missing directory",
  fn: async () => {
    const req = createRequest("POST", "/api/skills/register", JSON.stringify({}));
    const res = await handleSkillRegister(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.error);
  },
});