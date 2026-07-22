import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceService, PerformanceService } from '../services/performanceService';
import type { PerformanceMetrics, PerformanceStatus } from '../types/performance';

export function usePerformanceMonitor(service: PerformanceService = performanceService) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(service.getMetrics());
  const [status, setStatus] = useState<PerformanceStatus>(service.getStatus());
  const unsubscribeRef = useRef<() => void>();

  useEffect(() => {
    service.start();

    unsubscribeRef.current = service.subscribe((newMetrics) => {
      setMetrics(newMetrics);
      setStatus(service.getStatus());
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [service]);

  const getMetrics = useCallback(() => service.getMetrics(), [service]);
  const getStatus = useCallback(() => service.getStatus(), [service]);
  const stop = useCallback(() => service.stop(), [service]);
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

export function usePerformanceTimer(componentName: string) {
  const startTimeRef = useRef<number>(0);

  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

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
