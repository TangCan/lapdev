import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePerformanceMonitor, usePerformanceTimer } from './usePerformanceMonitor';
import { PerformanceService } from '../services/performanceService';

describe('usePerformanceMonitor Hook', () => {
  let mockService: Partial<PerformanceService>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockService = {
      start: vi.fn(),
      stop: vi.fn(),
      getMetrics: vi.fn().mockReturnValue({
        fps: 60,
        cpuUsage: 25,
        memoryUsage: 524288000,
        memoryLimit: 1073741824,
        networkRequests: [],
        longestTask: 50,
        pageLoadTime: 800,
        componentRenderTime: [],
      }),
      getStatus: vi.fn().mockReturnValue({
        fps: 'excellent',
        cpu: 'good',
        memory: 'good',
        overall: 'good',
      }),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
    };
  });

  it('[P0] should return metrics and status', () => {
    const { result } = renderHook(() => usePerformanceMonitor(mockService as PerformanceService));
    
    expect(result.current.metrics).toEqual(mockService.getMetrics());
    expect(result.current.status).toEqual(mockService.getStatus());
  });

  it('[P0] should expose getMetrics function', () => {
    const { result } = renderHook(() => usePerformanceMonitor(mockService as PerformanceService));
    
    expect(typeof result.current.getMetrics).toBe('function');
    expect(result.current.getMetrics()).toEqual(mockService.getMetrics());
  });

  it('[P0] should expose getStatus function', () => {
    const { result } = renderHook(() => usePerformanceMonitor(mockService as PerformanceService));
    
    expect(typeof result.current.getStatus).toBe('function');
    expect(result.current.getStatus()).toEqual(mockService.getStatus());
  });

  it('[P0] should expose start and stop functions', () => {
    const { result } = renderHook(() => usePerformanceMonitor(mockService as PerformanceService));
    
    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.stop).toBe('function');
  });

  it('[P1] should call service.start on mount', () => {
    renderHook(() => usePerformanceMonitor(mockService as PerformanceService));
    
    expect(mockService.start).toHaveBeenCalledTimes(1);
  });

  it('[P1] should subscribe to service updates', () => {
    renderHook(() => usePerformanceMonitor(mockService as PerformanceService));
    
    expect(mockService.subscribe).toHaveBeenCalledTimes(1);
  });

  it('[P2] should call start function when invoked', () => {
    const { result } = renderHook(() => usePerformanceMonitor(mockService as PerformanceService));
    
    act(() => {
      result.current.start();
    });
    
    expect(mockService.start).toHaveBeenCalledTimes(2);
  });

  it('[P2] should call stop function when invoked', () => {
    const { result } = renderHook(() => usePerformanceMonitor(mockService as PerformanceService));
    
    act(() => {
      result.current.stop();
    });
    
    expect(mockService.stop).toHaveBeenCalledTimes(1);
  });
});

describe('usePerformanceTimer Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[P0] should return startTimer and endTimer functions', () => {
    const { result } = renderHook(() => usePerformanceTimer('TestComponent'));
    
    expect(typeof result.current.startTimer).toBe('function');
    expect(typeof result.current.endTimer).toBe('function');
  });

  it('[P0] should measure time between start and end', () => {
    const { result } = renderHook(() => usePerformanceTimer('TestComponent'));
    
    act(() => {
      result.current.startTimer();
    });
    
    // Small delay to simulate component render
    let duration: number;
    act(() => {
      duration = result.current.endTimer();
    });
    
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});