import React, { useState } from 'react';
import { useAgent } from '../../context/AgentContext';

interface AgentOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentOperationModal: React.FC<AgentOperationModalProps> = ({ isOpen, onClose }) => {
  const {
    pendingOperations,
    approveOperation,
    rejectOperation,
    approveAllOperations,
    rejectAllOperations,
    executeApprovedOperations,
    clearPendingOperations,
  } = useAgent();

  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedOperationId(null);
    clearPendingOperations();
    onClose();
  };

  const handleExecute = async () => {
    await executeApprovedOperations();
    onClose();
  };

  const approvedCount = pendingOperations.filter(op => op.status === 'approved').length;
  const rejectedCount = pendingOperations.filter(op => op.status === 'rejected').length;
  const pendingCount = pendingOperations.filter(op => op.status === 'pending').length;

  if (!isOpen) return null;

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <span className="text-green-400">+</span>;
      case 'write':
        return <span className="text-blue-400">✏️</span>;
      case 'delete':
        return <span className="text-red-400">🗑️</span>;
      case 'read':
        return <span className="text-gray-400">📖</span>;
      case 'search':
        return <span className="text-yellow-400">🔍</span>;
      default:
        return <span className="text-gray-400">📄</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 text-xs bg-green-900/50 text-green-400 rounded">已批准</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 text-xs bg-red-900/50 text-red-400 rounded">已拒绝</span>;
      default:
        return <span className="px-2 py-0.5 text-xs bg-gray-900/50 text-gray-400 rounded">待确认</span>;
    }
  };

  const getOperationTypeLabel = (type: string) => {
    switch (type) {
      case 'create':
        return '创建文件';
      case 'write':
        return '修改文件';
      case 'delete':
        return '删除文件';
      case 'read':
        return '读取文件';
      case 'search':
        return '搜索代码';
      default:
        return '未知操作';
    }
  };

  const renderDiffPreview = (operation: typeof pendingOperations[0]) => {
    if (operation.type !== 'write' || !operation.originalContent || !operation.content) {
      return null;
    }

    const originalLines = operation.originalContent.split('\n');
    const newLines = operation.content.split('\n');

    return (
      <div className="mt-3 p-3 bg-gray-900 rounded-lg max-h-60 overflow-auto">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Diff 预览</h4>
        <div className="font-mono text-xs">
          {newLines.map((line, index) => {
            const originalLine = originalLines[index];
            if (originalLine === line) {
              return <div key={index} className="text-gray-500">{line}</div>;
            } else if (!originalLine) {
              return <div key={index} className="text-green-400">+ {line}</div>;
            } else {
              return (
                <div key={index}>
                  <div className="text-red-400">- {originalLine}</div>
                  <div className="text-green-400">+ {line}</div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 对话框内容 */}
      <div className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-700">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Agent 操作确认</h2>
              <p className="text-sm text-gray-400">
                {pendingOperations.length} 个操作等待确认
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="text-gray-400">✕</span>
          </button>
        </div>

        {/* 操作列表 */}
        <div className="p-4 overflow-auto max-h-[50vh]">
          {pendingOperations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              暂无待确认的操作
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOperations.map((operation) => (
                <div
                  key={operation.id}
                  className={`
                    p-3 rounded-lg border transition-all cursor-pointer
                    ${selectedOperationId === operation.id
                      ? 'border-purple-500 bg-gray-800/50'
                      : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                    }
                  `}
                  onClick={() => setSelectedOperationId(operation.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getOperationIcon(operation.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {getOperationTypeLabel(operation.type)}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-md">
                          {operation.filePath}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(operation.status)}
                  </div>

                  {selectedOperationId === operation.id && renderDiffPreview(operation)}

                  {/* 操作按钮 */}
                  {selectedOperationId === operation.id && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          approveOperation(operation.id);
                        }}
                        disabled={operation.status === 'approved'}
                        className={`
                          px-3 py-1.5 text-sm rounded-lg transition-colors
                          ${operation.status === 'approved'
                            ? 'bg-green-900/50 text-green-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                          }
                        `}
                      >
                        ✓ 批准
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          rejectOperation(operation.id);
                        }}
                        disabled={operation.status === 'rejected'}
                        className={`
                          px-3 py-1.5 text-sm rounded-lg transition-colors
                          ${operation.status === 'rejected'
                            ? 'bg-red-900/50 text-red-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                          }
                        `}
                      >
                        ✗ 拒绝
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 border-t border-gray-700 bg-gray-900/80">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-gray-400">
              <span>已批准: <span className="text-green-400">{approvedCount}</span></span>
              <span>已拒绝: <span className="text-red-400">{rejectedCount}</span></span>
              <span>待确认: <span className="text-gray-300">{pendingCount}</span></span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  rejectAllOperations();
                }}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                全部拒绝
              </button>
              <button
                onClick={() => {
                  approveAllOperations();
                }}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                全部批准
              </button>
              <button
                onClick={handleExecute}
                disabled={approvedCount === 0}
                className={`
                  px-6 py-2 text-sm font-medium rounded-lg transition-colors
                  ${approvedCount === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white'
                  }
                `}
              >
                执行 ({approvedCount})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};