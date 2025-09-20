import { useEffect, useState, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  batteryLevel: number | null;
  isCharging: boolean | null;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  isLowEndDevice: boolean;
  viewportSize: { width: number; height: number };
  devicePixelRatio: number;
}

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: (this: BatteryManager, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
  getBattery?(): Promise<BatteryManager>;
}

interface NetworkInformation extends EventTarget {
  downlink: number;
  effectiveType: string;
  rtt: number;
  saveData: boolean;
  type: string;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

export function useMobilePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    batteryLevel: null,
    isCharging: null,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    isLowEndDevice: false,
    viewportSize: { width: window.innerWidth, height: window.innerHeight },
    devicePixelRatio: window.devicePixelRatio || 1
  });

  const renderStartTime = useRef<number>(0);
  const performanceObserver = useRef<PerformanceObserver | null>(null);

  // Detect low-end device
  const detectLowEndDevice = useCallback(() => {
    const navigator = window.navigator as NavigatorWithMemory;
    const deviceMemory = navigator.deviceMemory || 0;
    const cores = navigator.hardwareConcurrency || 0;
    const isLowEnd = deviceMemory <= 2 || cores <= 2;

    return isLowEnd;
  }, []);

  // Get network information
  const getNetworkInfo = useCallback(() => {
    const navigator = window.navigator as NavigatorWithConnection;
    const connection = navigator.connection ||
                      navigator.mozConnection ||
                      navigator.webkitConnection;

    if (connection) {
      return {
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        saveData: connection.saveData || false
      };
    }

    return {
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      saveData: false
    };
  }, []);

  // Get battery information
  const getBatteryInfo = useCallback(async () => {
    try {
      const navigator = window.navigator as NavigatorWithMemory;
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        return {
          level: battery.level,
          charging: battery.charging
        };
      }
    } catch (error) {
      console.warn('Battery API not supported:', error);
    }
    return { level: null, charging: null };
  }, []);

  // Get memory usage
  const getMemoryUsage = useCallback(() => {
    const performance = window.performance as any;
    if (performance.memory) {
      return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }, []);

  // Measure render performance
  const measureRenderTime = useCallback(() => {
    renderStartTime.current = performance.now();

    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStartTime.current;
      setMetrics(prev => ({ ...prev, renderTime }));
    });
  }, []);

  // Update viewport size
  const updateViewportSize = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }));
  }, []);

  // Performance optimization suggestions
  const getOptimizationSuggestions = useCallback(() => {
    const suggestions: string[] = [];

    if (metrics.isLowEndDevice) {
      suggestions.push('Consider reducing image quality for low-end devices');
      suggestions.push('Enable image lazy loading');
      suggestions.push('Reduce animation complexity');
    }

    if (metrics.connectionType === 'cellular' || metrics.effectiveType === 'slow-2g' || metrics.effectiveType === '2g') {
      suggestions.push('Optimize for slow network connections');
      suggestions.push('Implement aggressive caching');
      suggestions.push('Consider offline functionality');
    }

    if (metrics.batteryLevel !== null && metrics.batteryLevel < 0.2 && !metrics.isCharging) {
      suggestions.push('Reduce battery usage - disable animations');
      suggestions.push('Reduce background processing');
      suggestions.push('Lower screen brightness if possible');
    }

    if (metrics.memoryUsage > 50) {
      suggestions.push('High memory usage detected - consider optimizing');
      suggestions.push('Implement virtual scrolling for large lists');
      suggestions.push('Clean up unused components');
    }

    if (metrics.renderTime > 16) {
      suggestions.push('Render time is high - optimize component renders');
      suggestions.push('Use React.memo for expensive components');
      suggestions.push('Implement code splitting');
    }

    return suggestions;
  }, [metrics]);

  // Performance monitoring
  useEffect(() => {
    const updateMetrics = async () => {
      const networkInfo = getNetworkInfo();
      const memoryUsage = getMemoryUsage();
      const batteryInfo = await getBatteryInfo();
      const isLowEndDevice = detectLowEndDevice();

      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        batteryLevel: batteryInfo.level,
        isCharging: batteryInfo.charging,
        connectionType: networkInfo.connectionType,
        effectiveType: networkInfo.effectiveType,
        downlink: networkInfo.downlink,
        isLowEndDevice
      }));
    };

    updateMetrics();

    // Set up performance observer
    if ('PerformanceObserver' in window) {
      performanceObserver.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            console.log('First Contentful Paint:', entry.startTime);
          }
        });
      });

      try {
        performanceObserver.current.observe({ entryTypes: ['paint', 'navigation'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }
    }

    // Monitor viewport changes
    window.addEventListener('resize', updateViewportSize);

    // Update metrics periodically
    const interval = setInterval(updateMetrics, 30000); // Every 30 seconds

    return () => {
      if (performanceObserver.current) {
        performanceObserver.current.disconnect();
      }
      window.removeEventListener('resize', updateViewportSize);
      clearInterval(interval);
    };
  }, [getNetworkInfo, getMemoryUsage, getBatteryInfo, detectLowEndDevice, updateViewportSize]);

  // Performance actions
  const enablePowerSaveMode = useCallback(() => {
    // Disable animations
    document.body.classList.add('reduce-motion');

    // Reduce image quality
    document.body.classList.add('low-quality-images');

    // Disable non-essential features
    document.body.classList.add('power-save-mode');
  }, []);

  const disablePowerSaveMode = useCallback(() => {
    document.body.classList.remove('reduce-motion', 'low-quality-images', 'power-save-mode');
  }, []);

  const enableDataSaveMode = useCallback(() => {
    // Reduce image loading
    document.body.classList.add('data-save-mode');

    // Disable auto-play features
    document.body.classList.add('no-autoplay');
  }, []);

  const disableDataSaveMode = useCallback(() => {
    document.body.classList.remove('data-save-mode', 'no-autoplay');
  }, []);

  return {
    metrics,
    measureRenderTime,
    getOptimizationSuggestions,
    enablePowerSaveMode,
    disablePowerSaveMode,
    enableDataSaveMode,
    disableDataSaveMode,
    isLowPerformanceDevice: metrics.isLowEndDevice,
    isSlowConnection: metrics.effectiveType === 'slow-2g' || metrics.effectiveType === '2g',
    isLowBattery: metrics.batteryLevel !== null && metrics.batteryLevel < 0.2 && !metrics.isCharging,
    shouldOptimizeForPerformance:
      metrics.isLowEndDevice ||
      metrics.effectiveType === 'slow-2g' ||
      metrics.effectiveType === '2g' ||
      (metrics.batteryLevel !== null && metrics.batteryLevel < 0.2 && !metrics.isCharging)
  };
}