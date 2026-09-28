const SECRET_KEYS = /apiKey|authorization|token|password|secret|prompt/i;
export function redactAuditValue(key: string, value: unknown): unknown {
  if (SECRET_KEYS.test(key)) return '[REDACTED]';
  if (typeof value === 'string' && value.length > 512) return `${value.slice(0, 512)}…[TRUNCATED]`;
  return value;
}
export function redactAuditRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, redactAuditValue(key, value)]));
}
