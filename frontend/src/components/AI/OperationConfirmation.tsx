import React from 'react';
import { useAgent } from '../../context/AgentContext';
import { AgentOperation } from '../../services/agentService';

interface OperationConfirmationProps {
  operations: AgentOperation[];
  onClose: () => void;
}

const OperationConfirmation: React.FC<OperationConfirmationProps> = ({ operations, onClose }) => {
  const { approveOperation, rejectOperation, approveAllOperations, rejectAllOperations, executeApprovedOperations } = useAgent();

  const handleApprove = async (operationId: string) => {
    try {
      approveOperation(operationId);
      await executeApprovedOperations();
      onClose();
    } catch (error) {
      console.error('批准操作失败:', error);
      onClose();
    }
  };

  const handleReject = (operationId: string) => {
    rejectOperation(operationId);
    onClose();
  };

  const handleApproveAll = async () => {
    try {
      approveAllOperations();
      await executeApprovedOperations();
      onClose();
    } catch (error) {
      console.error('批量批准操作失败:', error);
      onClose();
    }
  };

  const handleRejectAll = () => {
    rejectAllOperations();
    onClose();
  };

  const getOperationTypeText = (type: AgentOperation['type']) => {
    switch (type) {
      case 'write': return '修改文件';
      case 'create': return '创建文件';
      case 'delete': return '删除文件';
      case 'read': return '读取文件';
      case 'search': return '搜索代码';
      default: return type;
    }
  };

  const renderDiffPreview = (operation: AgentOperation) => {
    if (!operation.content && !operation.originalContent) {
      return null;
    }

    const newLines = operation.content?.split('\n') || [];
    const oldLines = operation.originalContent?.split('\n') || [];

    const maxLength = Math.max(newLines.length, oldLines.length);
    const diffLines = [];

    for (let i = 0; i < maxLength; i++) {
      const newLine = newLines[i];
      const oldLine = oldLines[i];

      if (newLine === oldLine) {
        diffLines.push({
          type: 'unchanged' as const,
          content: newLine || '',
          lineNumber: i + 1,
        });
      } else if (!newLine && oldLine) {
        diffLines.push({
          type: 'deleted' as const,
          content: oldLine,
          lineNumber: i + 1,
        });
      } else if (newLine && !oldLine) {
        diffLines.push({
          type: 'added' as const,
          content: newLine,
          lineNumber: i + 1,
        });
      } else {
        diffLines.push({
          type: 'modified' as const,
          content: newLine || '',
          lineNumber: i + 1,
        });
      }
    }

    return (
      <div className="diff-preview" data-testid="operation-diff-preview">
        {diffLines.map((diffLine, index) => (
          <div key={index} className={`diff-line ${diffLine.type}`}>
            <span className="line-number">{diffLine.lineNumber}</span>
            <span className="line-content">
              {diffLine.type === 'deleted' ? `- ${diffLine.content}` :
               diffLine.type === 'added' ? `+ ${diffLine.content}` :
               diffLine.type === 'modified' ? `~ ${diffLine.content}` :
               diffLine.content}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="operation-confirmation-overlay">
      <div className="operation-confirmation-dialog" data-testid="operation-confirmation-dialog">
        <div className="dialog-header">
          <h3>确认操作</h3>
          <button className="dialog-close" onClick={onClose}>✕</button>
        </div>

        <div className="dialog-content">
          <div className="operation-summary">
            <span data-testid="operation-count">共 {operations.length} 个待确认操作</span>
          </div>

          <div className="operations-list">
            {operations.map((operation) => (
              <div key={operation.id} className="operation-item">
                <div className="operation-header">
                  <span className="operation-type" data-testid="operation-type">
                    {getOperationTypeText(operation.type)}
                  </span>
                  <span className="operation-target" data-testid="operation-target">
                    {operation.filePath}
                  </span>
                </div>
                
                {renderDiffPreview(operation)}

                <div className="operation-actions">
                  <button
                    className="action-btn approve"
                    onClick={() => handleApprove(operation.id)}
                    data-testid="operation-approve-button"
                  >
                    批准
                  </button>
                  <button
                    className="action-btn reject"
                    onClick={() => handleReject(operation.id)}
                    data-testid="operation-reject-button"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dialog-footer">
          <button
            className="footer-btn reject-all"
            onClick={handleRejectAll}
          >
            全部拒绝
          </button>
          {operations.length > 1 && (
            <button
              className="footer-btn approve-all"
              onClick={handleApproveAll}
              data-testid="operation-approve-all-button"
            >
              全部批准
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperationConfirmation;