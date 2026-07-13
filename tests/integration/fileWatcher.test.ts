import { assert, assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import {
  handleWebSocket,
  broadcastFileChange,
  triggerGitStatusUpdate,
  startCleanupTimer,
  stopCleanupTimer,
  startFileWatcher,
  stopFileWatcher,
  registerTerminalClient,
  unregisterTerminalClient,
  getTerminalClient,
} from "../../backend/src/websocket/fileWatcher.ts";

Deno.test({
  name: "@p2 fileWatcher - broadcastFileChange",
  fn: async () => {
    await broadcastFileChange("modify", "/test.txt");
  },
});

Deno.test({
  name: "@p2 fileWatcher - broadcastFileChange with different event types",
  fn: async () => {
    await broadcastFileChange("create", "/new-file.txt");
    await broadcastFileChange("modify", "/modified-file.txt");
    await broadcastFileChange("remove", "/deleted-file.txt");
  },
});

Deno.test({
  name: "@p2 fileWatcher - triggerGitStatusUpdate",
  fn: () => {
    triggerGitStatusUpdate();
  },
});

Deno.test({
  name: "@p2 fileWatcher - startCleanupTimer and stopCleanupTimer",
  fn: () => {
    startCleanupTimer();
    stopCleanupTimer();
  },
});

Deno.test({
  name: "@p2 fileWatcher - startCleanupTimer idempotent",
  fn: () => {
    startCleanupTimer();
    startCleanupTimer();
    stopCleanupTimer();
  },
});

Deno.test({
  name: "@p2 fileWatcher - startFileWatcher and stopFileWatcher",
  fn: () => {
    startFileWatcher();
    stopFileWatcher();
  },
});

Deno.test({
  name: "@p2 fileWatcher - startFileWatcher idempotent",
  fn: () => {
    startFileWatcher();
    startFileWatcher();
    stopFileWatcher();
  },
});

Deno.test({
  name: "@p2 fileWatcher - stopFileWatcher without starting",
  fn: () => {
    stopFileWatcher();
  },
});

Deno.test({
  name: "@p2 fileWatcher - registerTerminalClient and unregisterTerminalClient",
  fn: () => {
    const mockWs = {
      readyState: 1,
      send: async () => {},
    };
    registerTerminalClient("test-session", mockWs as unknown as WebSocket);
    const client = getTerminalClient("test-session");
    assert(client !== undefined);
    unregisterTerminalClient("test-session");
    const afterUnregister = getTerminalClient("test-session");
    assertEquals(afterUnregister, undefined);
  },
});

Deno.test({
  name: "@p2 fileWatcher - getTerminalClient for non-existent session",
  fn: () => {
    const client = getTerminalClient("non-existent");
    assertEquals(client, undefined);
  },
});

Deno.test({
  name: "@p2 fileWatcher - stopCleanupTimer without starting",
  fn: () => {
    stopCleanupTimer();
  },
});