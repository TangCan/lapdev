import React, { useState } from 'react';
import { useAgent } from '../../context/AgentContext';
import { OperationLogEntry } from '../../services/agentService';

interface OperationLogProps {
  className?: string;
}

type FilterType = OperationLogEntry['operationType'] | 'all';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'read', label: '读取' },
  { value: 'write', label: '写入' },
  { value: 'search', label: '搜索' },
  { value: 'create', label: '创建' },
  { value: 'delete', label: '删除' },
];

export const OperationLog: React.FC<OperationLogProps> = ({ className = '' }) => {
  const { clearLogs, filterLogsByType, exportLogs } = useAgent();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const filteredLogs = filterLogsByType(selectedFilter);

  const handleClearLogs = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearLogs = () => {
    clearLogs();
    setShowConfirmDialog(false);
  };

  const cancelClearLogs = () => {
    setShowConfirmDialog(false);
  };

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

  const getOperationLabel = (type: string) => {
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
        return type;
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
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`} data-testid="operation-log-panel">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-sm font-medium text-white">操作日志</h3>
          <span className="text-xs text-gray-500" data-testid="operation-count">
            共 {filteredLogs.length} 个操作
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            data-testid="filter-select"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as FilterType)}
            className="bg-gray-800 text-gray-300 text-xs border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-purple-500"
          >
            {FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {filteredLogs.length > 0 && (
            <>
              <button
                onClick={exportLogs}
                data-testid="export-logs-button"
                className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1"
                title="导出日志"
              >
                导出
              </button>
              <button
                onClick={handleClearLogs}
                data-testid="clear-logs-button"
                className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1"
                title="清空日志"
              >
                清空
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-3 max-h-64 overflow-auto">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm" data-testid="no-logs-message">
            暂无操作记录
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-2 bg-gray-800/50 rounded-lg text-xs"
                data-testid={`log-entry-${log.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{getOperationIcon(log.operationType)}</span>
                    <span className="text-gray-300 font-medium" data-testid="log-type">
                      {getOperationLabel(log.operationType)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={getResultColor(log.result)} data-testid="log-result">
                      {getResultLabel(log.result)}
                    </span>
                  </div>
                </div>
                <div className="text-gray-400 truncate" data-testid="log-path">
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

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-600 p-4 max-w-sm w-full mx-4">
            <h3 className="text-sm font-medium text-white mb-2">确认清空日志</h3>
            <p className="text-xs text-gray-400 mb-4">确定要清空所有操作日志吗？此操作无法撤销。</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelClearLogs}
                className="text-xs text-gray-400 hover:text-white px-3 py-1 border border-gray-600 rounded"
              >
                取消
              </button>
              <button
                onClick={confirmClearLogs}
                data-testid="confirm-clear-logs"
                className="text-xs text-white bg-red-600 hover:bg-red-500 px-3 py-1 rounded"
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
