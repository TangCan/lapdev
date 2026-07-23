import type { PerformanceMetrics, NetworkRequest, ComponentRenderTime, PerformanceServiceConfig, PerformanceStatus, PerformanceLevel } from '../types/performance';

const DEFAULT_CONFIG: PerformanceServiceConfig = {
  fpsUpdateInterval: 1000,
  metricsUpdateInterval: 2000,
  networkMonitorEnabled: true,
  componentMonitorEnabled: true,
  maxNetworkHistory: 50,
  maxComponentHistory: 100,
};

export class PerformanceService {
  private config: PerformanceServiceConfig;
  private isRunning = false;
  private fpsFrameCount = 0;
  private fpsLastTime = 0;
  private currentFps = 0;
  private networkRequests: NetworkRequest[] = [];
  private componentRenderTimes: ComponentRenderTime[] = [];
  private longestTask = 0;
  private pageLoadTime = 0;
  private fpsIntervalId: ReturnType<typeof setInterval> | null = null;
  private metricsIntervalId: ReturnType<typeof setInterval> | null = null;
  private networkObserver: PerformanceObserver | null = null;
  private longTaskObserver: PerformanceObserver | null = null;
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();
  
  // CPU 使用率计算相关
  private cpuFrameTimes: number[] = [];
  private cpuLastFrameTime = 0;
  private maxFrameTime = 1000 / 60; // 60fps 的帧时间

  constructor(config: Partial<PerformanceServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.measurePageLoadTime();
    this.startFpsMonitoring();
    this.startMetricsMonitoring();
    
    if (this.config.networkMonitorEnabled) {
      this.startNetworkMonitoring();
    }
    
    this.startLongTaskMonitoring();
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.fpsIntervalId) {
      clearInterval(this.fpsIntervalId);
      this.fpsIntervalId = null;
    }

    if (this.metricsIntervalId) {
      clearInterval(this.metricsIntervalId);
      this.metricsIntervalId = null;
    }

    if (this.networkObserver) {
      this.networkObserver.disconnect();
      this.networkObserver = null;
    }

    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
      this.longTaskObserver = null;
    }

    this.listeners.clear();
  }

  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getMetrics(): PerformanceMetrics {
    const memoryInfo = this.getMemoryInfo();
    
    return {
      fps: this.currentFps,
      cpuUsage: this.getCpuUsage(),
      memoryUsage: memoryInfo.used,
      memoryLimit: memoryInfo.limit,
      networkRequests: [...this.networkRequests],
      longestTask: this.longestTask,
      pageLoadTime: this.pageLoadTime,
      componentRenderTime: [...this.componentRenderTimes],
    };
  }

  getStatus(): PerformanceStatus {
    const metrics = this.getMetrics();
    
    return {
      fps: this.getPerformanceLevel(metrics.fps, [55, 30, 15]),
      cpu: this.getPerformanceLevel(metrics.cpuUsage, [25, 50, 75]),
      memory: this.getPerformanceLevel(metrics.memoryUsage / metrics.memoryLimit * 100, [50, 70, 90]),
      overall: this.calculateOverallStatus(metrics),
    };
  }

  recordComponentRender(componentName: string, renderTime: number): void {
    if (!this.config.componentMonitorEnabled) return;

    this.componentRenderTimes.push({
      componentName,
      renderTime,
      timestamp: Date.now(),
    });

    if (this.componentRenderTimes.length > this.config.maxComponentHistory) {
      this.componentRenderTimes.shift();
    }
  }

  private startFpsMonitoring(): void {
    const updateFps = () => {
      if (!this.isRunning) return;
      
      const now = performance.now();
      if (this.cpuLastFrameTime > 0) {
        const frameTime = now - this.cpuLastFrameTime;
        this.cpuFrameTimes.push(frameTime);
        if (this.cpuFrameTimes.length > 60) {
          this.cpuFrameTimes.shift();
        }
      }
      this.cpuLastFrameTime = now;
      
      this.fpsFrameCount++;
      requestAnimationFrame(updateFps);
    };

    requestAnimationFrame(updateFps);

    this.fpsIntervalId = setInterval(() => {
      const now = performance.now();
      const elapsed = now - this.fpsLastTime;
      this.currentFps = Math.round((this.fpsFrameCount * 1000) / elapsed);
      this.fpsFrameCount = 0;
      this.fpsLastTime = now;
      this.notifyListeners();
    }, this.config.fpsUpdateInterval);
  }

  private startMetricsMonitoring(): void {
    this.metricsIntervalId = setInterval(() => {
      this.notifyListeners();
    }, this.config.metricsUpdateInterval);
  }

  private startNetworkMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.networkObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          if (entry.entryType !== 'resource') return;
          
          const resourceEntry = entry as PerformanceResourceTiming;
          const request: NetworkRequest = {
            id: `${resourceEntry.name}-${resourceEntry.startTime}`,
            url: resourceEntry.name,
            method: resourceEntry.initiatorType.toUpperCase(),
            status: resourceEntry.responseStatus,
            duration: Math.round(resourceEntry.duration),
            size: resourceEntry.transferSize || 0,
            startTime: resourceEntry.startTime,
          };

          this.networkRequests.push(request);
          
          if (this.networkRequests.length > this.config.maxNetworkHistory) {
            this.networkRequests.shift();
          }
        });
      });

      this.networkObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('[PerformanceService] Network monitoring failed:', e);
    }
  }

  private startLongTaskMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.longTaskObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
          if (entry.entryType === 'longtask') {
            const duration = entry.duration;
            if (duration > this.longestTask) {
              this.longestTask = Math.round(duration);
            }
          }
        });
      });

      this.longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('[PerformanceService] Long task monitoring failed:', e);
    }
  }

  private measurePageLoadTime(): void {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as unknown as { loadEventEnd: number; startTime: number };
    if (navigationEntry) {
      this.pageLoadTime = Math.round(navigationEntry.loadEventEnd - navigationEntry.startTime);
    }
  }

  private getMemoryInfo(): { used: number; limit: number } {
    const memory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    
    if (memory) {
      return {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };
    }

    return {
      used: 0,
      limit: 1024 * 1024 * 1024,
    };
  }

  private getCpuUsage(): number {
    if (this.cpuFrameTimes.length === 0) return 0;
    
    // 计算平均帧时间
    const sum = this.cpuFrameTimes.reduce((a, b) => a + b, 0);
    const avgFrameTime = sum / this.cpuFrameTimes.length;
    
    // 如果平均帧率太低（< 10fps），说明页面可能在后台或空闲状态
    // 空闲状态下浏览器会降低帧率以节省电量
    const avgFps = 1000 / avgFrameTime;
    if (avgFps < 10) {
      return 5; // 空闲状态，返回一个很低的 CPU 使用率
    }
    
    // 计算 CPU 使用率
    // 理想情况下，60fps 的帧时间是 16.67ms
    // 如果帧时间超过理想时间，说明 CPU 繁忙
    // 但如果帧时间远小于理想时间，说明 CPU 空闲
    const cpuUsage = (avgFrameTime / this.maxFrameTime) * 100;
    
    // 限制在 0-100 之间，并考虑空闲状态
    return Math.min(100, Math.max(5, cpuUsage));
  }

  private getPerformanceLevel(value: number, thresholds: number[]): PerformanceLevel {
    if (value >= thresholds[0]) return 'excellent';
    if (value >= thresholds[1]) return 'good';
    if (value >= thresholds[2]) return 'warning';
    return 'critical';
  }

  private calculateOverallStatus(metrics: PerformanceMetrics): PerformanceLevel {
    const fpsLevel = this.getPerformanceLevel(metrics.fps, [55, 30, 15]);
    const memoryPercent = (metrics.memoryUsage / metrics.memoryLimit) * 100;
    const memoryLevel = this.getPerformanceLevel(memoryPercent, [50, 70, 90]);

    if (fpsLevel === 'critical' || memoryLevel === 'critical') return 'critical';
    if (fpsLevel === 'warning' || memoryLevel === 'warning') return 'warning';
    if (fpsLevel === 'good' || memoryLevel === 'good') return 'good';
    return 'excellent';
  }

  private notifyListeners(): void {
    const metrics = this.getMetrics();
    this.listeners.forEach((listener) => listener(metrics));
  }
}

export const performanceService = new PerformanceService();
