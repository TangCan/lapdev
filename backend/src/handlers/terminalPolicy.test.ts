import { assertEquals } from 'jsr:@std/assert@1';
import { isHighRiskCommand } from './terminalHandler.ts';

Deno.test('terminal policy identifies destructive and privileged commands', () => {
  assertEquals(isHighRiskCommand('sudo apt install x'), true);
  assertEquals(isHighRiskCommand('rm -rf /'), true);
  assertEquals(isHighRiskCommand('git reset --hard HEAD'), true);
  assertEquals(isHighRiskCommand('printf "hello"'), false);
});
