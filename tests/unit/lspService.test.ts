import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { LspService } from "../../backend/src/services/lspService.ts";

const lspService = new LspService();

Deno.test({
  name: "@p2 lspService - startServer and stopServer",
  fn: async () => {
    await lspService.startServer("typescript");
    assert(lspService.isServerRunning("typescript"));
    await lspService.stopServer("typescript");
    assertEquals(lspService.isServerRunning("typescript"), false);
  },
});

Deno.test({
  name: "@p2 lspService - startServer idempotent",
  fn: async () => {
    await lspService.startServer("javascript");
    await lspService.startServer("javascript");
    assert(lspService.isServerRunning("javascript"));
    await lspService.stopServer("javascript");
  },
});

Deno.test({
  name: "@p2 lspService - getCompletions with running server",
  fn: async () => {
    await lspService.startServer("typescript");
    const completions = await lspService.getCompletions(
      "test.ts",
      "con",
      { line: 0, character: 3 }
    );
    assert(Array.isArray(completions));
    assert(completions.length > 0);
    await lspService.stopServer("typescript");
  },
});

Deno.test({
  name: "@p2 lspService - getCompletions without running server",
  fn: async () => {
    const completions = await lspService.getCompletions(
      "test.ts",
      "con",
      { line: 0, character: 3 }
    );
    assertEquals(completions.length, 0);
  },
});

Deno.test({
  name: "@p2 lspService - getHover with function definition",
  fn: async () => {
    const content = "function testFunc(a: string): number {\n  return parseInt(a);\n}";
    const hover = await lspService.getHover(
      "test.ts",
      content,
      { line: 0, character: 10 }
    );
    assert(hover !== null);
    assert(hover?.contents?.length > 0);
  },
});

Deno.test({
  name: "@p2 lspService - getHover with undefined variable",
  fn: async () => {
    const content = "const x = undefinedVar;";
    const hover = await lspService.getHover(
      "test.ts",
      content,
      { line: 0, character: 12 }
    );
    assert(hover !== null);
  },
});

Deno.test({
  name: "@p2 lspService - getHover with no content",
  fn: async () => {
    const hover = await lspService.getHover(
      "test.ts",
      "",
      { line: 0, character: 0 }
    );
    assertEquals(hover, null);
  },
});

Deno.test({
  name: "@p2 lspService - formatDocument with running server",
  fn: async () => {
    await lspService.startServer("javascript");
    const unformatted = "function test(){return 1;}";
    const formatted = await lspService.formatDocument("test.js", unformatted);
    assertEquals(typeof formatted, "string");
    await lspService.stopServer("javascript");
  },
});

Deno.test({
  name: "@p2 lspService - formatDocument without running server",
  fn: async () => {
    const content = "function test(){return 1;}";
    const formatted = await lspService.formatDocument("test.js", content);
    assertEquals(formatted, content);
  },
});

Deno.test({
  name: "@p2 lspService - getDefinition with function",
  fn: async () => {
    await lspService.startServer("typescript");
    const content = "function test() {\n}\n\ntest();";
    const definitions = await lspService.getDefinition(
      "test.ts",
      content,
      { line: 2, character: 0 }
    );
    assert(Array.isArray(definitions));
    await lspService.stopServer("typescript");
  },
});

Deno.test({
  name: "@p2 lspService - getDefinition without running server",
  fn: async () => {
    const definitions = await lspService.getDefinition(
      "test.ts",
      "function test() {}",
      { line: 0, character: 0 }
    );
    assertEquals(definitions.length, 0);
  },
});

Deno.test({
  name: "@p2 lspService - getReferences",
  fn: async () => {
    await lspService.startServer("javascript");
    const content = "const x = 1;\nconsole.log(x);";
    const references = await lspService.getReferences(
      "test.js",
      content,
      { line: 1, character: 11 }
    );
    assert(Array.isArray(references));
    await lspService.stopServer("javascript");
  },
});

Deno.test({
  name: "@p2 lspService - getDiagnostics",
  fn: async () => {
    await lspService.startServer("typescript");
    const content = "const x: number = \"string\";";
    const diagnostics = await lspService.getDiagnostics("test.ts", content);
    assert(Array.isArray(diagnostics));
    assert(diagnostics.length > 0);
    await lspService.stopServer("typescript");
  },
});

Deno.test({
  name: "@p2 lspService - getSignatureHelp",
  fn: async () => {
    await lspService.startServer("javascript");
    const content = "console.log(";
    const signatureHelp = await lspService.getSignatureHelp(
      "test.js",
      content,
      { line: 0, character: 12 }
    );
    assert(signatureHelp !== null);
    await lspService.stopServer("javascript");
  },
});

Deno.test({
  name: "@p2 lspService - renameSymbol",
  fn: async () => {
    await lspService.startServer("typescript");
    const content = "const x = 1;\nconsole.log(x);";
    const renameResult = await lspService.renameSymbol(
      "test.ts",
      content,
      { line: 0, character: 6 },
      "y"
    );
    assert(renameResult !== null);
    await lspService.stopServer("typescript");
  },
});

Deno.test({
  name: "@p2 lspService - getCodeActions",
  fn: async () => {
    await lspService.startServer("typescript");
    const actions = await lspService.getCodeActions(
      "test.ts",
      "const x = 1;",
      { start: { line: 0, character: 0 }, end: { line: 0, character: 12 } }
    );
    assert(Array.isArray(actions));
    await lspService.stopServer("typescript");
  },
});

Deno.test({
  name: "@p2 lspService - getTypeDefinition",
  fn: async () => {
    await lspService.startServer("typescript");
    const content = "interface Test {}\nconst x: Test = {};";
    const definitions = await lspService.getTypeDefinition(
      "test.ts",
      content,
      { line: 1, character: 10 }
    );
    assert(Array.isArray(definitions));
    await lspService.stopServer("typescript");
  },
});