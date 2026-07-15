export interface OperationLogEntry {
  id: string;
  operationType: 'read' | 'write' | 'search' | 'create' | 'delete';
  filePath: string;
  result: 'success' | 'failed' | 'rejected' | 'pending';
  timestamp: number;
  details?: string;
}

export type OperationType = OperationLogEntry['operationType'];

export type OperationResultType = OperationLogEntry['result'];
