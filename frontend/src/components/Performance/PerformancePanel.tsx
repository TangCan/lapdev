import React, { useState } from 'react';
import { Activity, Cpu, HardDrive, Clock, Network, AlertTriangle, CheckCircle, XCircle, MinusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
import type { PerformanceLevel, NetworkRequest } from '../../types/performance';

const StatusIcon: React.FC<{ level: PerformanceLevel }> = ({ level }) => {
  const iconProps = { className: 'w-4 h-4' };
  
  switch (level) {
    case 'excellent':
      return <CheckCircle className={`${iconProps.className} text-green-400`} />;
    case 'good':
      return <MinusCircle className={`${iconProps.className} text-blue-400`} />;
    case 'warning':
      return <AlertTriangle className={`${iconProps.className} text-yellow-400`} />;
    case 'critical':
      return <XCircle className={`${iconProps.className} text-red-400`} />;
    default:
      return <CheckCircle className={`${iconProps.className} text-gray-400`} />;
  }
};

const StatusBadge: React.FC<{ level: PerformanceLevel; label: string }> = ({ level, label }) => {
  const bgColors = {
    excellent: 'bg-green-500/20 text-green-400',
    good: 'bg-blue-500/20 text-blue-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    critical: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColors[level]}`}>
      {label}
    </span>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  level: PerformanceLevel;
}> = ({ icon, label, value, unit = '', level }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-gray-400">{icon}</div>
        <span className="text-xs text-gray-400">{label}</span>
        <StatusIcon level={level} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-white">{value}</span>
        {unit && <span className="text-xs text-gray-400">{unit}</span>}
      </div>
    </div>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const NetworkRequestItem: React.FC<{ request: NetworkRequest }> = ({ request }) => {
  const statusColor = request.status >= 200 && request.status < 300 ? 'text-green-400' :
                      request.status >= 300 && request.status < 400 ? 'text-blue-400' :
                      request.status >= 400 ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="flex items-center gap-2 text-xs py-1 border-b border-gray-700/30 last:border-b-0">
      <span className="w-16 font-medium text-gray-400">{request.method}</span>
      <span className={statusColor}>{request.status}</span>
      <span className="flex-1 truncate text-gray-300" title={request.url}>{request.url}</span>
      <span className="text-gray-400 w-20 text-right">{request.duration}ms</span>
      <span className="text-gray-400 w-16 text-right">{formatBytes(request.size)}</span>
    </div>
  );
};

export const PerformancePanel: React.FC = () => {
  const { metrics, status } = usePerformanceMonitor();
  const [expandedSections, setExpandedSections] = useState({
    network: false,
    components: false,
  });

  const toggleSection = (section: 'network' | 'components') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const memoryPercent = metrics.memoryLimit > 0 
    ? ((metrics.memoryUsage / metrics.memoryLimit) * 100).toFixed(1) 
    : '0';

  return (
    <div className="bg-gray-900/95 rounded-lg border border-gray-700/50 overflow-hidden shadow-xl">
      <div className="bg-gray-800/80 px-4 py-3 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-white">Performance Monitor</h3>
          </div>
          <StatusBadge level={status.overall} label="Overall" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={<Activity className="w-4 h-4" />}
            label="FPS"
            value={metrics.fps.toString()}
            unit="fps"
            level={status.fps}
          />
          <MetricCard
            icon={<Cpu className="w-4 h-4" />}
            label="CPU"
            value={metrics.cpuUsage.toFixed(1)}
            unit="%"
            level={status.cpu}
          />
          <MetricCard
            icon={<HardDrive className="w-4 h-4" />}
            label="Memory"
            value={formatBytes(metrics.memoryUsage)}
            unit={`/${formatBytes(metrics.memoryLimit)}`}
            level={status.memory}
          />
          <MetricCard
            icon={<Clock className="w-4 h-4" />}
            label="Longest Task"
            value={metrics.longestTask.toString()}
            unit="ms"
            level={metrics.longestTask > 500 ? 'warning' : metrics.longestTask > 200 ? 'good' : 'excellent'}
          />
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Memory Usage</span>
            </div>
            <span className="text-xs text-gray-400">{memoryPercent}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                parseFloat(memoryPercent) > 90 ? 'bg-red-500' :
                parseFloat(memoryPercent) > 70 ? 'bg-yellow-500' :
                parseFloat(memoryPercent) > 50 ? 'bg-blue-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(parseFloat(memoryPercent), 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
          <button
            onClick={() => toggleSection('network')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Network Requests</span>
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-400">
                {metrics.networkRequests.length}
              </span>
            </div>
            {expandedSections.network ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.network && (
            <div className="px-4 pb-3 max-h-48 overflow-y-auto">
              {metrics.networkRequests.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">No network requests recorded</p>
              ) : (
                metrics.networkRequests.slice().reverse().map((request) => (
                  <NetworkRequestItem key={request.id} request={request} />
                ))
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
          <button
            onClick={() => toggleSection('components')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">Component Render Times</span>
              <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-400">
                {metrics.componentRenderTime.length}
              </span>
            </div>
            {expandedSections.components ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {expandedSections.components && (
            <div className="px-4 pb-3 max-h-48 overflow-y-auto">
              {metrics.componentRenderTime.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">No component render times recorded</p>
              ) : (
                <div className="space-y-2">
                  {metrics.componentRenderTime.slice().reverse().slice(0, 20).map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-300">{entry.componentName}</span>
                      <span className={`font-mono ${
                        entry.renderTime > 100 ? 'text-red-400' :
                        entry.renderTime > 50 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {entry.renderTime.toFixed(2)}ms
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center">
          Page Load Time: {metrics.pageLoadTime}ms
        </div>
      </div>
    </div>
  );
};
