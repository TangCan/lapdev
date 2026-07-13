import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { handleAiConfigGet, handleAiConfigPost, handleAiConfigPut, handleAiConfigDelete, handleAiActiveModel, handleAiTest, handleAiChat } from "../../backend/src/handlers/aiHandler.ts";

function createRequest(method: string, path: string, body?: string): Request {
  return new Request(`http://localhost:8000${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body,
  });
}

Deno.test({
  name: "@p1 @smoke aiHandler - handleAiConfigGet",
  fn: async () => {
    const req = createRequest("GET", "/api/ai/config");
    const res = await handleAiConfigGet(req);
    assertEquals(res.status, 200);
    const json = await res.json();
    assert(json.status === 'success');
    assert(json.data !== undefined);
    assert(Array.isArray(json.data.models));
  },
});

Deno.test({
  name: "@p1 aiHandler - handleAiConfigPost with valid config",
  fn: async () => {
    const req = createRequest("POST", "/api/ai/config", JSON.stringify({
      name: "Test Config",
      provider: "openai",
      apiKey: "test-api-key",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o",
    }));
    const res = await handleAiConfigPost(req);
    assertEquals(res.status, 201);
    const json = await res.json();
    assert(json.status === 'success');
    assert(json.data !== undefined);
  },
});

Deno.test({
  name: "@p1 aiHandler - handleAiConfigPost with missing fields",
  fn: async () => {
    const req = createRequest("POST", "/api/ai/config", JSON.stringify({
      name: "Test Config",
    }));
    const res = await handleAiConfigPost(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 aiHandler - handleAiConfigPost with invalid provider",
  fn: async () => {
    const req = createRequest("POST", "/api/ai/config", JSON.stringify({
      name: "Test Config",
      provider: "invalid-provider",
      apiKey: "test-api-key",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o",
    }));
    const res = await handleAiConfigPost(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 aiHandler - handleAiConfigPut with missing id",
  fn: async () => {
    const req = createRequest("PUT", "/api/ai/config", JSON.stringify({
      name: "Updated Name",
    }));
    const res = await handleAiConfigPut(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 aiHandler - handleAiConfigDelete with missing id",
  fn: async () => {
    const req = createRequest("DELETE", "/api/ai/config");
    const res = await handleAiConfigDelete(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 aiHandler - handleAiActiveModel with missing id",
  fn: async () => {
    const req = createRequest("POST", "/api/ai/active", JSON.stringify({}));
    const res = await handleAiActiveModel(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 aiHandler - handleAiTest with missing fields",
  fn: async () => {
    const req = createRequest("POST", "/api/ai/test", JSON.stringify({}));
    const res = await handleAiTest(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 aiHandler - handleAiChat with missing modelId",
  fn: async () => {
    const req = createRequest("POST", "/api/ai/chat", JSON.stringify({
      messages: [{ role: "user", content: "Hello" }],
    }));
    const res = await handleAiChat(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});

Deno.test({
  name: "@p1 aiHandler - handleAiChat with missing messages",
  fn: async () => {
    const req = createRequest("POST", "/api/ai/chat", JSON.stringify({
      modelId: "mock-model-1",
    }));
    const res = await handleAiChat(req);
    assertEquals(res.status, 400);
    const json = await res.json();
    assert(json.status === 'error');
  },
});