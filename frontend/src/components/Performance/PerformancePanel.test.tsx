import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformancePanel } from './PerformancePanel';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

// Mock the hook
vi.mock('../../hooks/usePerformanceMonitor');

const mockMetrics = {
  fps: 60,
  cpuUsage: 25,
  memoryUsage: 524288000, // 500MB
  memoryLimit: 1073741824, // 1GB
  networkRequests: [],
  longestTask: 50,
  pageLoadTime: 800,
  componentRenderTime: [],
};

const mockStatus = {
  fps: 'excellent',
  cpu: 'good',
  memory: 'good',
  overall: 'good',
};

describe('PerformancePanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePerformanceMonitor as vi.Mock).mockReturnValue({
      metrics: mockMetrics,
      status: mockStatus,
      getMetrics: vi.fn().mockReturnValue(mockMetrics),
      getStatus: vi.fn().mockReturnValue(mockStatus),
      stop: vi.fn(),
      start: vi.fn(),
    });
  });

  it('[P0] should render performance monitor panel', () => {
    render(<PerformancePanel />);
    
    const panel = screen.getByText('Performance Monitor');
    expect(panel).toBeInTheDocument();
  });

  it('[P0] should display FPS metric', () => {
    render(<PerformancePanel />);
    
    expect(screen.getByText('FPS')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('fps')).toBeInTheDocument();
  });

  it('[P0] should display CPU metric', () => {
    render(<PerformancePanel />);
    
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('25.0')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('[P0] should display Memory metric', () => {
    render(<PerformancePanel />);
    
    expect(screen.getByText('Memory')).toBeInTheDocument();
    // Memory value is split across multiple elements
    const memoryValue = screen.getByText(/MB/);
    expect(memoryValue).toBeInTheDocument();
  });

  it('[P0] should display Longest Task metric', () => {
    render(<PerformancePanel />);
    
    expect(screen.getByText('Longest Task')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('ms')).toBeInTheDocument();
  });

  it('[P0] should display Overall status badge', () => {
    render(<PerformancePanel />);
    
    const statusBadge = screen.getByText('Overall');
    expect(statusBadge).toBeInTheDocument();
  });

  it('[P1] should display Memory Usage bar', () => {
    render(<PerformancePanel />);
    
    expect(screen.getByText('Memory Usage')).toBeInTheDocument();
    expect(screen.getByText('48.8%')).toBeInTheDocument();
  });

  it('[P1] should toggle Network Requests section', () => {
    render(<PerformancePanel />);
    
    const networkBtn = screen.getByText('Network Requests');
    fireEvent.click(networkBtn);
    
    // Should show expanded content
    expect(screen.getByText('No network requests recorded')).toBeInTheDocument();
    
    // Click again to collapse
    fireEvent.click(networkBtn);
  });

  it('[P1] should toggle Component Render Times section', () => {
    render(<PerformancePanel />);
    
    const componentsBtn = screen.getByText('Component Render Times');
    fireEvent.click(componentsBtn);
    
    // Should show expanded content
    expect(screen.getByText('No component render times recorded')).toBeInTheDocument();
    
    // Click again to collapse
    fireEvent.click(componentsBtn);
  });

  it('[P2] should display page load time', () => {
    render(<PerformancePanel />);
    
    expect(screen.getByText('Page Load Time: 800ms')).toBeInTheDocument();
  });

  it('[P2] should display network requests when available', () => {
    const mockMetricsWithRequests = {
      ...mockMetrics,
      networkRequests: [
        {
          id: 'req-1',
          url: 'https://api.example.com/data',
          method: 'GET',
          status: 200,
          duration: 150,
          size: 1024,
          startTime: 1000,
        },
      ],
    };
    
    (usePerformanceMonitor as vi.Mock).mockReturnValue({
      metrics: mockMetricsWithRequests,
      status: mockStatus,
      getMetrics: vi.fn().mockReturnValue(mockMetricsWithRequests),
      getStatus: vi.fn().mockReturnValue(mockStatus),
      stop: vi.fn(),
      start: vi.fn(),
    });
    
    render(<PerformancePanel />);
    
    const networkBtn = screen.getByText('Network Requests');
    fireEvent.click(networkBtn);
    
    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('https://api.example.com/data')).toBeInTheDocument();
  });

  it('[P2] should display component render times when available', () => {
    const mockMetricsWithRenderTimes = {
      ...mockMetrics,
      componentRenderTime: [
        {
          componentName: 'CodeEditor',
          renderTime: 25.5,
          timestamp: Date.now(),
        },
      ],
    };
    
    (usePerformanceMonitor as vi.Mock).mockReturnValue({
      metrics: mockMetricsWithRenderTimes,
      status: mockStatus,
      getMetrics: vi.fn().mockReturnValue(mockMetricsWithRenderTimes),
      getStatus: vi.fn().mockReturnValue(mockStatus),
      stop: vi.fn(),
      start: vi.fn(),
    });
    
    render(<PerformancePanel />);
    
    const componentsBtn = screen.getByText('Component Render Times');
    fireEvent.click(componentsBtn);
    
    expect(screen.getByText('CodeEditor')).toBeInTheDocument();
    expect(screen.getByText('25.50ms')).toBeInTheDocument();
  });
});