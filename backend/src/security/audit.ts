import { redactAuditRecord } from './redaction.ts';

export interface SecurityAuditInput {
  outcome: 'allowed' | 'denied' | 'expired' | 'revoked' | 'failed';
  reason: string;
  principalId: string;
  workspaceId: string;
  sessionId: string;
  requestId: string;
  revision: number;
  [key: string]: unknown;
}

export interface SecurityAuditEvent {
  type: 'security_audit';
  version: 1;
  timestamp: string;
  outcome: SecurityAuditInput['outcome'];
  reason: string;
  correlation: {
    principalId: string;
    workspaceId: string;
    sessionId: string;
    requestId: string;
    revision: number;
  };
  details: Record<string, unknown>;
}

export function createSecurityAuditEvent(input: SecurityAuditInput): SecurityAuditEvent {
  const { principalId, workspaceId, sessionId, requestId, revision, outcome, reason, ...details } = input;
  return {
    type: 'security_audit',
    version: 1,
    timestamp: new Date().toISOString(),
    outcome,
    reason,
    correlation: { principalId, workspaceId, sessionId, requestId, revision },
    details: redactAuditRecord(details),
  };
}

export function emitSecurityAuditEvent(input: SecurityAuditInput): string {
  const serialized = JSON.stringify(createSecurityAuditEvent(input));
  console.info(serialized);
  return serialized;
}
