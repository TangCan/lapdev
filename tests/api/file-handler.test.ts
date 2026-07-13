import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { handleFileTree, handleReadFile, handleWriteFile, handleCreateFile, handleRenameFile, handleDeleteFile, handleFormat, handleGetLanguages } from "../../backend/src/handlers/fileHandler.ts";

function createRequest(method: string, path: string, body?: string): Request {
  return new Request(`http://localhost:8000${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body,
  });
}

Deno.test({
  name: "@p1 fileHandler - handleFileTree with invalid path",
  fn: async () => {
    const req = createRequest("GET", "/api/files/tree?path=/nonexistent/path");
    const res = await handleFileTree(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 fileHandler - handleReadFile with missing file",
  fn: async () => {
    const req = createRequest("GET", "/api/files/read?path=/nonexistent/file.txt");
    const res = await handleReadFile(req);
    assertEquals(res.status, 404);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 fileHandler - handleWriteFile with missing parameters",
  fn: async () => {
    const req = createRequest("POST", "/api/files/write", JSON.stringify({}));
    const res = await handleWriteFile(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 fileHandler - handleFormat with valid code",
  fn: async () => {
    const req = createRequest("POST", "/api/files/format", JSON.stringify({
      content: "function test() { return 1; }",
      language: "javascript",
    }));
    const res = await handleFormat(req);
    assertEquals(res.status, 200);
    const json = await res.json();
    assert(json.status === 'success');
  },
});

Deno.test({
  name: "@p1 fileHandler - handleFormat with unsupported language",
  fn: async () => {
    const req = createRequest("POST", "/api/files/format", JSON.stringify({
      content: "some code",
      language: "unsupported-lang",
    }));
    const res = await handleFormat(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 fileHandler - handleGetLanguages",
  fn: async () => {
    const req = createRequest("GET", "/api/files/languages");
    const res = await handleGetLanguages(req);
    assertEquals(res.status, 200);
    const json = await res.json();
    assert(json.status === 'success');
    assert(Array.isArray(json.data));
  },
});