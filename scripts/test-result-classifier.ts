export type TestFailureCategory = 'environment' | 'test' | 'product-regression' | 'pass';
export function classifyTestResult(exitCode: number, output: string): TestFailureCategory {
  if (exitCode === 0) return 'pass';
  if (/spawnSync .*EPERM|permission denied|command not found|no justfile/i.test(output)) return 'environment';
  if (/expect\(|assert|test failed|failed \(/i.test(output)) return 'test';
  return 'product-regression';
}
