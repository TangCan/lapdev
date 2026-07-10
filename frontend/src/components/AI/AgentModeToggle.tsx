import React from 'react';
import { useAgent } from '../../context/AgentContext';

interface AgentModeToggleProps {
  className?: string;
}

export const AgentModeToggle: React.FC<AgentModeToggleProps> = ({ className = '' }) => {
  const { isAgentMode, setAgentMode } = useAgent();

  return (
    <button
      onClick={() => setAgentMode(!isAgentMode)}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
        transition-all duration-200 cursor-pointer
        ${isAgentMode
          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }
        ${className}
      `}
      title={isAgentMode ? '关闭Agent模式' : '开启Agent模式'}
      data-testid="agent-mode-toggle"
    >
      <div className={`
        w-2 h-2 rounded-full transition-all duration-200
        ${isAgentMode ? 'bg-white animate-pulse' : 'bg-gray-500'}
      `} />
      <span>
        {isAgentMode ? 'Agent 已开启' : 'Agent 模式'}
      </span>
    </button>
  );
};