import React from 'react';
import { useAgent } from '../../context/AgentContext';

interface OperationLogProps {
  className?: string;
}

export const OperationLog: React.FC<OperationLogProps> = ({ className = '' }) => {
  const { operationLogs, clearLogs } = useAgent();

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

  const getResultColor = (result: string) => {
    switch (result) {
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'rejected':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'success':
        return '成功';
      case 'failed':
        return '失败';
      case 'rejected':
        return '已拒绝';
      case 'pending':
        return '待处理';
      default:
        return result;
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-sm font-medium text-white">操作日志</h3>
        </div>
        {operationLogs.length > 0 && (
          <button
            onClick={clearLogs}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            清空日志
          </button>
        )}
      </div>

      {/* 日志列表 */}
      <div className="p-3 max-h-64 overflow-auto">
        {operationLogs.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            暂无操作记录
          </div>
        ) : (
          <div className="space-y-2">
            {operationLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 bg-gray-800/50 rounded-lg text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{getOperationIcon(log.operationType)}</span>
                    <span className="text-gray-300 font-medium">
                      {log.operationType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={getResultColor(log.result)}>
                      {getResultLabel(log.result)}
                    </span>
                  </div>
                </div>
                <div className="text-gray-400 truncate">
                  {log.filePath}
                </div>
                {log.details && (
                  <div className="text-gray-500 mt-1">
                    {log.details}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};