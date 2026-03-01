import React from 'react';

/**
 * Performance monitoring utilities for frontend optimization
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  type: 'render' | 'api' | 'processing' | 'error';
}

export interface PerformanceSummary {
  totalMetrics: number;
  renderMetrics: PerformanceMetric[];
  apiMetrics: PerformanceMetric[];
  processingMetrics: PerformanceMetric[];
  errorMetrics: PerformanceMetric[];
  averageRenderTime: number;
  averageApiTime: number;
  memoryUsage: any | null;
  sessionDuration: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observers: MutationObserver[] = [];
  private startTime: number = 0;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    this.startTime = performance.now();
    this.setupObservers();
    this.setupMemoryMonitoring();
  }

  /**
   * Measure component render time
   */
  measureRenderTime(componentName: string, callback: () => void): void {
    const startTime = performance.now();
    
    try {
      callback();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name: `${componentName}_render_time`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        type: 'render'
      });
      
      // Log slow renders
      if (duration > 100) {
        // Slow render detected - log silently
      }
    } catch (error) {
      // Error measuring render time - silently handle
    }
  }

  /**
   * Measure API call performance
   */
  async measureApiCall<T>(
    endpoint: string, 
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name: `api_${endpoint}_response_time`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        type: 'api'
      });
      
      // Log slow API calls
      if (duration > 2000) {
        // Slow API call detected - log silently
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name: `api_${endpoint}_error`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        type: 'error'
      });
      
      throw error;
    }
  }

  /**
   * Measure data processing performance
   */
  measureDataProcessing(operationName: string, data: any, processor: (data: any) => any): any {
    const startTime = performance.now();
    
    try {
      const result = processor(data);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name: `${operationName}_processing_time`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        type: 'processing'
      });
      
      // Log slow processing
      if (duration > 500) {
        // Slow data processing detected - log silently
      }

      return result;
    } catch (error) {
      // Error in data processing - silently handle
      throw error;
    }
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage(): any | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  /**
   * Check for memory leaks
   */
  checkMemoryLeaks(): void {
    const memory = this.getMemoryUsage();
    if (memory) {
      const usageMB = memory.usedJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
      const percentage = (usageMB / limitMB) * 100;

      if (percentage > 80) {
        // High memory usage detected - log silently
      }
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): PerformanceSummary {
    const metrics = Array.from(this.metrics.values());
    
    return {
      totalMetrics: metrics.length,
      renderMetrics: metrics.filter(m => m.type === 'render'),
      apiMetrics: metrics.filter(m => m.type === 'api'),
      processingMetrics: metrics.filter(m => m.type === 'processing'),
      errorMetrics: metrics.filter(m => m.type === 'error'),
      averageRenderTime: this.calculateAverage(metrics.filter(m => m.type === 'render')),
      averageApiTime: this.calculateAverage(metrics.filter(m => m.type === 'api')),
      memoryUsage: this.getMemoryUsage(),
      sessionDuration: performance.now() - this.startTime
    };
  }

  /**
   * Export performance data
   */
  exportPerformanceData(): string {
    const summary = this.getPerformanceSummary();
    return JSON.stringify(summary, null, 2);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Setup DOM mutation observers for performance tracking
   */
  private setupObservers(): void {
    // Observe DOM changes that might indicate performance issues
    const observer = new MutationObserver((mutations) => {
      let totalNodes = 0;
      mutations.forEach((mutation) => {
        totalNodes += mutation.addedNodes.length;
      });

      if (totalNodes > 100) {
        // Large DOM mutation detected - log silently
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.push(observer);
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    // Check memory usage every 30 seconds
    setInterval(() => {
      this.checkMemoryLeaks();
    }, 30000);
  }

  /**
   * Record a performance metric
   */
  public recordMetric(metric: PerformanceMetric): void {
    this.metrics.set(`${metric.name}_${Date.now()}`, metric);
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.size > 1000) {
      const oldestKey = Array.from(this.metrics.keys())[0];
      this.metrics.delete(oldestKey);
    }
  }

  /**
   * Calculate average value from metrics
   */
  private calculateAverage(metrics: PerformanceMetric[]): number {
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }
}

// Global performance monitor instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();

  return {
    measureRender: () => {
      const endTime = performance.now();
      performanceMonitor.recordMetric({
        name: `${componentName}_render_time`,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now(),
        type: 'render'
      });
    }
  };
}

/**
 * HOC for automatic performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: any,
  componentName: string
) {
  return function MonitoredComponent(props: P) {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      performanceMonitor.recordMetric({
        name: `${componentName}_render_time`,
        value: endTime - startTime,
        unit: 'ms',
        timestamp: Date.now(),
        type: 'render'
      });
    });

    return <Component {...props} />;
  };
}

/**
 * Performance monitoring middleware for API calls
 */
export function createPerformanceMiddleware() {
  return {
    before: (config: any) => {
      config.metadata = { startTime: performance.now() };
      return config;
    },
    after: (response: any) => {
      const duration = performance.now() - response.config.metadata.startTime;
      
      performanceMonitor.recordMetric({
        name: `api_${response.config.url}_response_time`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        type: 'api'
      });
      
      return response;
    },
    error: (error: any) => {
      if (error.config?.metadata?.startTime) {
        const duration = performance.now() - error.config.metadata.startTime;
        
        performanceMonitor.recordMetric({
          name: `api_${error.config.url}_error`,
          value: duration,
          unit: 'ms',
          timestamp: Date.now(),
          type: 'error'
        });
      }
      
      throw error;
    }
  };
}