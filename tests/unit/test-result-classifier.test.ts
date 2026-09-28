import { assertEquals } from 'jsr:@std/assert@1';
import { classifyTestResult } from '../../scripts/test-result-classifier.ts';
Deno.test('classifies environment and assertion failures separately', () => {
  assertEquals(classifyTestResult(1, 'spawnSync /bin/sh EPERM'), 'environment');
  assertEquals(classifyTestResult(1, 'expect(received).toBe(expected)'), 'test');
  assertEquals(classifyTestResult(0, ''), 'pass');
});
