export interface PerformanceMetrics {
  fps: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryLimit: number;
  networkRequests: NetworkRequest[];
  longestTask: number;
  pageLoadTime: number;
  componentRenderTime: ComponentRenderTime[];
}

export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
  startTime: number;
}

export interface ComponentRenderTime {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetrics;
}

export interface PerformanceServiceConfig {
  fpsUpdateInterval: number;
  metricsUpdateInterval: number;
  networkMonitorEnabled: boolean;
  componentMonitorEnabled: boolean;
  maxNetworkHistory: number;
  maxComponentHistory: number;
}

export type PerformanceLevel = 'excellent' | 'good' | 'warning' | 'critical';

export interface PerformanceStatus {
  fps: PerformanceLevel;
  cpu: PerformanceLevel;
  memory: PerformanceLevel;
  overall: PerformanceLevel;
}
