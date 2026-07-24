import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceService, PerformanceService } from '../services/performanceService';
import type { PerformanceMetrics, PerformanceStatus } from '../types/performance';

/**
 * React Hook: 性能监控
 * 
 * 在组件中订阅性能指标更新，自动管理监控服务的生命周期。
 * 
 * 使用示例：
 * ```tsx
 * const { metrics, status, stop, start } = usePerformanceMonitor();
 * 
 * useEffect(() => {
 *   // 组件挂载时自动启动监控
 *   return () => stop();
 * }, [stop]);
 * ```
 * 
 * @param service 性能监控服务实例（默认使用全局单例）
 * @returns 包含当前指标、状态和控制方法的对象
 */
export function usePerformanceMonitor(service: PerformanceService = performanceService) {
  /** 当前性能指标 */
  const [metrics, setMetrics] = useState<PerformanceMetrics>(service.getMetrics());
  /** 当前性能状态评估 */
  const [status, setStatus] = useState<PerformanceStatus>(service.getStatus());
  /** 取消订阅的引用 */
  const unsubscribeRef = useRef<() => void>();

  useEffect(() => {
    // 启动性能监控服务
    service.start();

    // 订阅性能指标更新
    unsubscribeRef.current = service.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setStatus(service.getStatus());
    });

    // 组件卸载时取消订阅
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [service]);

  /** 获取当前性能指标 */
  const getMetrics = useCallback(() => service.getMetrics(), [service]);
  
  /** 获取当前性能状态评估 */
  const getStatus = useCallback(() => service.getStatus(), [service]);
  
  /** 停止性能监控 */
  const stop = useCallback(() => service.stop(), [service]);
  
  /** 启动性能监控 */
  const start = useCallback(() => service.start(), [service]);

  return {
    metrics,
    status,
    getMetrics,
    getStatus,
    stop,
    start,
  };
}

/**
 * React Hook: 组件渲染计时器
 * 
 * 测量组件渲染耗时，并自动记录到性能监控服务。
 * 
 * 使用示例：
 * ```tsx
 * const { startTimer, endTimer } = usePerformanceTimer('MyComponent');
 * 
 * useEffect(() => {
 *   startTimer();
 *   // ... 组件渲染逻辑 ...
 *   endTimer();
 * }, []);
 * ```
 * 
 * @param componentName 组件名称（用于标识记录）
 * @returns 包含开始计时和结束计时方法的对象
 */
export function usePerformanceTimer(componentName: string) {
  /** 开始时间引用 */
  const startTimeRef = useRef<number>(0);

  /**
   * 开始计时
   * 
   * 记录当前时间戳，用于后续计算渲染耗时。
   */
  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  /**
   * 结束计时
   * 
   * 计算渲染耗时并记录到性能监控服务。
   * 
   * @returns 渲染耗时（毫秒）
   */
  const endTimer = useCallback(() => {
    const duration = performance.now() - startTimeRef.current;
    performanceService.recordComponentRender(componentName, duration);
    return duration;
  }, [componentName]);

  return {
    startTimer,
    endTimer,
  };
}