import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { handleGitStatus, handleGitDiff, handleGitBranches, handleGitStage, handleGitCommit, handleGitCheckout } from "../../backend/src/handlers/gitHandler.ts";

function createRequest(method: string, path: string, body?: string): Request {
  return new Request(`http://localhost:8000${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body,
  });
}

Deno.test({
  name: "@p1 gitHandler - handleGitDiff with missing path",
  fn: async () => {
    const req = createRequest("GET", "/api/git/diff");
    const res = await handleGitDiff(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 gitHandler - handleGitDiff with too long path",
  fn: async () => {
    const longPath = "/api/git/diff?path=" + "a".repeat(3000);
    const req = createRequest("GET", longPath);
    const res = await handleGitDiff(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 gitHandler - handleGitStage with missing paths",
  fn: async () => {
    const req = createRequest("POST", "/api/git/stage", JSON.stringify({}));
    const res = await handleGitStage(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 gitHandler - handleGitStage with too many paths",
  fn: async () => {
    const paths = Array.from({ length: 101 }, (_, i) => `file${i}.txt`);
    const req = createRequest("POST", "/api/git/stage", JSON.stringify({ paths }));
    const res = await handleGitStage(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 gitHandler - handleGitCommit with missing message",
  fn: async () => {
    const req = createRequest("POST", "/api/git/commit", JSON.stringify({}));
    const res = await handleGitCommit(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 gitHandler - handleGitCommit with too long message",
  fn: async () => {
    const longMessage = "a".repeat(2000);
    const req = createRequest("POST", "/api/git/commit", JSON.stringify({ message: longMessage }));
    const res = await handleGitCommit(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 gitHandler - handleGitCheckout with missing branch",
  fn: async () => {
    const req = createRequest("POST", "/api/git/checkout", JSON.stringify({}));
    const res = await handleGitCheckout(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 gitHandler - handleGitCheckout with too long branch",
  fn: async () => {
    const longBranch = "a".repeat(300);
    const req = createRequest("POST", "/api/git/checkout", JSON.stringify({ branch: longBranch }));
    const res = await handleGitCheckout(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});