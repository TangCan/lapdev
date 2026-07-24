/**
 * 性能监控服务
 * 
 * 提供前端性能指标的实时监控功能，包括：
 * - FPS（帧率）监控
 * - CPU 使用率估算
 * - 内存使用监控
 * - 网络请求监控
 * - 长任务监控
 * - 组件渲染时间记录
 * 
 * 使用 Performance API 和 requestAnimationFrame 实现精确的性能测量。
 */
import type { PerformanceMetrics, NetworkRequest, ComponentRenderTime, PerformanceServiceConfig, PerformanceStatus, PerformanceLevel } from '../types/performance';

/** 默认配置选项 */
const DEFAULT_CONFIG: PerformanceServiceConfig = {
  fpsUpdateInterval: 1000,      // FPS 更新间隔（毫秒）
  metricsUpdateInterval: 2000,  // 指标更新间隔（毫秒）
  networkMonitorEnabled: true,  // 是否启用网络监控
  componentMonitorEnabled: true, // 是否启用组件渲染监控
  maxNetworkHistory: 50,        // 最大网络请求历史记录数
  maxComponentHistory: 100,     // 最大组件渲染记录数
};

/**
 * 性能监控服务类
 * 
 * 提供完整的前端性能监控解决方案，支持订阅模式获取实时指标。
 */
export class PerformanceService {
  /** 服务配置 */
  private config: PerformanceServiceConfig;
  
  /** 服务运行状态 */
  private isRunning = false;
  
  /** FPS 计算相关 */
  private fpsFrameCount = 0;
  private fpsLastTime = 0;
  private currentFps = 0;
  
  /** 网络请求历史 */
  private networkRequests: NetworkRequest[] = [];
  
  /** 组件渲染时间记录 */
  private componentRenderTimes: ComponentRenderTime[] = [];
  
  /** 最长任务时长（毫秒） */
  private longestTask = 0;
  
  /** 页面加载时间（毫秒） */
  private pageLoadTime = 0;
  
  /** 定时器 ID */
  private fpsIntervalId: ReturnType<typeof setInterval> | null = null;
  private metricsIntervalId: ReturnType<typeof setInterval> | null = null;
  
  /** PerformanceObserver 实例 */
  private networkObserver: PerformanceObserver | null = null;
  private longTaskObserver: PerformanceObserver | null = null;
  
  /** 事件监听器集合 */
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();
  
  /** CPU 使用率计算相关 */
  private cpuFrameTimes: number[] = [];
  private cpuLastFrameTime = 0;
  private maxFrameTime = 1000 / 60; // 60fps 的理想帧时间（约16.67ms）

  /**
   * 构造函数
   * @param config 可选配置参数，覆盖默认配置
   */
  constructor(config: Partial<PerformanceServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 启动性能监控服务
   * 
   * 初始化所有监控模块：
   * - FPS 监控
   * - 内存监控
   * - 网络请求监控（如果启用）
   * - 长任务监控
   */
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

  /**
   * 停止性能监控服务
   * 
   * 清理所有定时器和观察者，释放资源。
   */
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

  /**
   * 订阅性能指标更新
   * 
   * @param listener 回调函数，接收最新的性能指标
   * @returns 取消订阅的函数
   */
  subscribe(listener: (metrics: PerformanceMetrics) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 获取当前性能指标
   * 
   * @returns 包含所有性能指标的对象
   */
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

  /**
   * 获取性能状态评估
   * 
   * 根据当前指标评估性能等级（excellent/good/warning/critical）
   * 
   * @returns 包含各项指标状态的评估对象
   */
  getStatus(): PerformanceStatus {
    const metrics = this.getMetrics();
    
    return {
      fps: this.getPerformanceLevel(metrics.fps, [55, 30, 15]),
      cpu: this.getPerformanceLevel(metrics.cpuUsage, [25, 50, 75]),
      memory: this.getPerformanceLevel(metrics.memoryUsage / metrics.memoryLimit * 100, [50, 70, 90]),
      overall: this.calculateOverallStatus(metrics),
    };
  }

  /**
   * 记录组件渲染时间
   * 
   * @param componentName 组件名称
   * @param renderTime 渲染耗时（毫秒）
   */
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

  /**
   * 启动 FPS 监控
   * 
   * 使用 requestAnimationFrame 计算帧率，并定期更新 currentFps 值。
   */
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

  /**
   * 启动指标更新定时器
   * 
   * 定期通知所有监听器最新的性能指标。
   */
  private startMetricsMonitoring(): void {
    this.metricsIntervalId = setInterval(() => {
      this.notifyListeners();
    }, this.config.metricsUpdateInterval);
  }

  /**
   * 启动网络请求监控
   * 
   * 使用 PerformanceObserver 监听 resource 类型的性能条目，
   * 记录所有网络请求的详细信息。
   */
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

  /**
   * 启动长任务监控
   * 
   * 使用 PerformanceObserver 监听 longtask 类型的性能条目，
   * 记录超过 50ms 的长任务。
   */
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

  /**
   * 测量页面加载时间
   * 
   * 使用 performance.getEntriesByType 获取 navigation 条目，
   * 计算从页面开始加载到 load 事件完成的时间。
   */
  private measurePageLoadTime(): void {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as unknown as { loadEventEnd: number; startTime: number };
    if (navigationEntry) {
      this.pageLoadTime = Math.round(navigationEntry.loadEventEnd - navigationEntry.startTime);
    }
  }

  /**
   * 获取内存使用信息
   * 
   * 使用 performance.memory API（Chrome 专有）获取内存使用情况。
   * 如果不可用，返回默认值。
   * 
   * @returns 包含 used（已用内存）和 limit（内存限制）的对象
   */
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
      limit: 1024 * 1024 * 1024, // 默认 1GB
    };
  }

  /**
   * 计算 CPU 使用率
   * 
   * 通过分析帧时间间隔估算 CPU 使用率：
   * - 收集最近 60 帧的帧时间
   * - 计算平均帧时间
   * - 根据平均帧时间与理想帧时间（60fps）的比例估算 CPU 使用率
   * 
   * @returns CPU 使用率百分比（0-100）
   */
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

  /**
   * 根据数值获取性能等级
   * 
   * @param value 待评估的数值
   * @param thresholds 阈值数组，按从高到低排列
   * @returns 性能等级（excellent/good/warning/critical）
   */
  private getPerformanceLevel(value: number, thresholds: number[]): PerformanceLevel {
    if (value >= thresholds[0]) return 'excellent';
    if (value >= thresholds[1]) return 'good';
    if (value >= thresholds[2]) return 'warning';
    return 'critical';
  }

  /**
   * 计算综合性能状态
   * 
   * 根据 FPS 和内存使用率计算整体性能状态。
   * 
   * @param metrics 性能指标对象
   * @returns 综合性能等级
   */
  private calculateOverallStatus(metrics: PerformanceMetrics): PerformanceLevel {
    const fpsLevel = this.getPerformanceLevel(metrics.fps, [55, 30, 15]);
    const memoryPercent = (metrics.memoryUsage / metrics.memoryLimit) * 100;
    const memoryLevel = this.getPerformanceLevel(memoryPercent, [50, 70, 90]);

    if (fpsLevel === 'critical' || memoryLevel === 'critical') return 'critical';
    if (fpsLevel === 'warning' || memoryLevel === 'warning') return 'warning';
    if (fpsLevel === 'good' || memoryLevel === 'good') return 'good';
    return 'excellent';
  }

  /**
   * 通知所有监听器性能指标更新
   */
  private notifyListeners(): void {
    const metrics = this.getMetrics();
    this.listeners.forEach((listener) => listener(metrics));
  }
}

/** PerformanceService 单例实例 */
export const performanceService = new PerformanceService();