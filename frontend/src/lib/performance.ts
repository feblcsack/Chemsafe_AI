/**
 * Performance optimization utilities
 */

// Debounce function for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Detect device capabilities
export function getDeviceCapabilities() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isLowEnd: false,
      connection: 'unknown',
      cores: 4,
    };
  }

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const isLowEnd = cores <= 4;
  
  let connection = 'unknown';
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    connection = conn?.effectiveType || 'unknown';
  }

  return {
    isMobile,
    isLowEnd,
    connection,
    cores,
  };
}

// Adaptive quality based on network speed
export function getAdaptiveQuality(): number {
  const { connection } = getDeviceCapabilities();
  
  switch (connection) {
    case '4g':
      return 85;
    case '3g':
      return 70;
    case '2g':
    case 'slow-2g':
      return 50;
    default:
      return 75;
  }
}

// Check if element is in viewport (for lazy loading)
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Preload critical resources
export function preloadResource(href: string, as: string) {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  document.head.appendChild(link);
}

// Request idle callback wrapper
export function requestIdleCallback(callback: () => void, options?: { timeout?: number }) {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, 1);
  }
}

// Measure performance
export function measurePerformance(name: string, callback: () => void) {
  if (typeof window === 'undefined' || !window.performance) {
    callback();
    return;
  }

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  
  performance.mark(startMark);
  callback();
  performance.mark(endMark);
  
  try {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    console.log(`⚡ ${name}: ${measure.duration.toFixed(2)}ms`);
    
    // Clean up
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
  } catch (e) {
    // Measurement failed, ignore
  }
}

// Cache manager for API responses
class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private ttl: number = 5 * 60 * 1000; // 5 minutes default

  set(key: string, data: any, ttl?: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    
    // Auto cleanup after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl || this.ttl);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear() {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }
}

export const apiCache = new CacheManager();

// Batch API requests
export class RequestBatcher {
  private queue: Array<{
    url: string;
    resolve: (data: any) => void;
    reject: (error: any) => void;
  }> = [];
  private timeout: NodeJS.Timeout | null = null;
  private batchDelay: number = 50; // ms

  request(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, resolve, reject });
      
      if (this.timeout) clearTimeout(this.timeout);
      
      this.timeout = setTimeout(() => {
        this.flush();
      }, this.batchDelay);
    });
  }

  private async flush() {
    if (this.queue.length === 0) return;
    
    const batch = [...this.queue];
    this.queue = [];
    
    // Group by base URL
    const groups = new Map<string, typeof batch>();
    batch.forEach(item => {
      const base = item.url.split('?')[0];
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(item);
    });
    
    // Execute requests
    for (const [base, items] of groups) {
      try {
        // Check cache first
        const cached = apiCache.get(base);
        if (cached) {
          items.forEach(item => item.resolve(cached));
          continue;
        }
        
        // Make request
        const response = await fetch(items[0].url);
        const data = await response.json();
        
        // Cache response
        apiCache.set(base, data);
        
        // Resolve all
        items.forEach(item => item.resolve(data));
      } catch (error) {
        items.forEach(item => item.reject(error));
      }
    }
  }
}

export const requestBatcher = new RequestBatcher();

// Optimize animations based on device
export function getOptimizedAnimationConfig() {
  const { isMobile, isLowEnd } = getDeviceCapabilities();
  const reducedMotion = prefersReducedMotion();
  
  if (reducedMotion) {
    return {
      duration: 0,
      enabled: false,
    };
  }
  
  if (isLowEnd || isMobile) {
    return {
      duration: 0.2,
      enabled: true,
      reduce: true,
    };
  }
  
  return {
    duration: 0.4,
    enabled: true,
    reduce: false,
  };
}

// Monitor performance metrics
export function monitorWebVitals() {
  if (typeof window === 'undefined' || !window.performance) return;

  // Monitor First Contentful Paint
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`📊 ${entry.name}:`, entry);
    }
  });

  try {
    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
  } catch (e) {
    // Not supported
  }
}
