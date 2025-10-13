/**
 * Performance monitoring utility for measuring component render times and interactions
 */

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  interactionTime?: number;
  memoryUsed?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start measuring component render performance
   */
  startMeasure(componentName: string): () => void {
    if (!this.enabled) return () => {};

    const startMark = `${componentName}-start-${Date.now()}`;
    performance.mark(startMark);

    return () => {
      const endMark = `${componentName}-end-${Date.now()}`;
      performance.mark(endMark);

      const measureName = `${componentName}-render`;
      performance.measure(measureName, startMark, endMark);

      const measure = performance.getEntriesByName(measureName)[0];
      if (measure) {
        this.recordMetric({
          componentName,
          renderTime: measure.duration,
          memoryUsed: this.getMemoryUsage(),
          timestamp: Date.now(),
        });
      }

      // Clean up marks and measures
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(measureName);
    };
  }

  /**
   * Measure interaction performance (e.g., click handlers)
   */
  measureInteraction(interactionName: string, callback: () => void): void {
    if (!this.enabled) {
      callback();
      return;
    }

    const start = performance.now();
    callback();
    const duration = performance.now() - start;

    this.recordMetric({
      componentName: interactionName,
      renderTime: 0,
      interactionTime: duration,
      memoryUsed: this.getMemoryUsage(),
      timestamp: Date.now(),
    });
  }

  /**
   * Set up observer for long tasks (> 50ms)
   */
  observeLongTasks(): void {
    if (!this.enabled || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
          }
        }
      });

      observer.observe({ type: 'longtask', buffered: true });
      this.observers.set('longtask', observer);
    } catch (error) {}
  }

  /**
   * Set up observer for Largest Contentful Paint
   */
  observeLCP(): void {
    if (!this.enabled || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        if (lastEntry) {
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', observer);
    } catch (error) {}
  }

  /**
   * Set up observer for First Input Delay
   */
  observeFID(): void {
    if (!this.enabled || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const fidValue = (entry as any).processingStart - entry.startTime;
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.set('fid', observer);
    } catch (error) {}
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Log in development
    if (this.enabled) {
      const renderInfo = metric.renderTime > 0 ? `Render: ${metric.renderTime.toFixed(2)}ms` : '';
      const interactionInfo = metric.interactionTime
        ? `Interaction: ${metric.interactionTime.toFixed(2)}ms`
        : '';
      const memoryInfo = metric.memoryUsed
        ? `Memory: ${(metric.memoryUsed / 1024 / 1024).toFixed(2)}MB`
        : '';

      const info = [renderInfo, interactionInfo, memoryInfo].filter(Boolean).join(', ');

      if (info) {
      }
    }

    // Limit metrics array size
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  /**
   * Get performance summary
   */
  getSummary(componentName?: string): {
    avgRenderTime: number;
    maxRenderTime: number;
    minRenderTime: number;
    totalRenders: number;
    avgInteractionTime?: number;
  } {
    const relevantMetrics = componentName
      ? this.metrics.filter(m => m.componentName === componentName)
      : this.metrics;

    const renderMetrics = relevantMetrics.filter(m => m.renderTime > 0);
    const interactionMetrics = relevantMetrics.filter(m => m.interactionTime);

    if (renderMetrics.length === 0) {
      return {
        avgRenderTime: 0,
        maxRenderTime: 0,
        minRenderTime: 0,
        totalRenders: 0,
      };
    }

    const renderTimes = renderMetrics.map(m => m.renderTime);
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);

    const result: any = {
      avgRenderTime,
      maxRenderTime,
      minRenderTime,
      totalRenders: renderMetrics.length,
    };

    if (interactionMetrics.length > 0) {
      const interactionTimes = interactionMetrics.map(m => m.interactionTime!);
      result.avgInteractionTime =
        interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;
    }

    return result;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  return {
    startMeasure: () => performanceMonitor.startMeasure(componentName),
    measureInteraction: (name: string, callback: () => void) =>
      performanceMonitor.measureInteraction(`${componentName}-${name}`, callback),
    getSummary: () => performanceMonitor.getSummary(componentName),
  };
}

// Initialize observers on page load
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('load', () => {
    performanceMonitor.observeLongTasks();
    performanceMonitor.observeLCP();
    performanceMonitor.observeFID();
  });

  // Export to window for debugging
  (window as any).__performanceMonitor = performanceMonitor;
}
