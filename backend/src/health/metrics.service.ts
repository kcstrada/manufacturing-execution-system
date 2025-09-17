import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as process from 'process';

/**
 * Service for collecting and managing application metrics
 */
@Injectable()
export class MetricsService {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.initializeMetrics();
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics() {
    // Initialize counters
    this.counters.set('http_requests_total', 0);
    this.counters.set('http_requests_success', 0);
    this.counters.set('http_requests_error', 0);
    this.counters.set('database_queries_total', 0);
    this.counters.set('cache_hits', 0);
    this.counters.set('cache_misses', 0);

    // Initialize gauges
    this.gauges.set('active_connections', 0);
    this.gauges.set('queue_size', 0);

    // Initialize histograms
    this.histograms.set('http_request_duration', []);
    this.histograms.set('database_query_duration', []);
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, value = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Add a value to a histogram
   */
  recordHistogram(name: string, value: number): void {
    const histogram = this.histograms.get(name) || [];
    histogram.push(value);

    // Keep only last 1000 values to prevent memory issues
    if (histogram.length > 1000) {
      histogram.shift();
    }

    this.histograms.set(name, histogram);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime.getTime(),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: this.getHistogramStats(),
      system: this.getSystemMetrics(),
      process: this.getProcessMetrics(),
      application: this.getApplicationMetrics(),
    };
  }

  /**
   * Get histogram statistics
   */
  private getHistogramStats() {
    const stats: Record<string, any> = {};

    for (const [name, values] of this.histograms) {
      if (values.length === 0) {
        stats[name] = { count: 0 };
        continue;
      }

      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);

      stats[name] = {
        count: values.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: sum / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      };
    }

    return stats;
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    return {
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model,
        loadAverage: {
          '1m': loadAvg[0],
          '5m': loadAvg[1],
          '15m': loadAvg[2],
        },
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: (
          ((os.totalmem() - os.freemem()) / os.totalmem()) *
          100
        ).toFixed(2),
      },
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
    };
  }

  /**
   * Get process metrics
   */
  private getProcessMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      pid: process.pid,
      ppid: process.ppid,
      version: process.version,
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
    };
  }

  /**
   * Get application-specific metrics
   */
  private getApplicationMetrics() {
    return {
      httpRequests: {
        total: this.counters.get('http_requests_total') || 0,
        success: this.counters.get('http_requests_success') || 0,
        error: this.counters.get('http_requests_error') || 0,
        errorRate: this.calculateErrorRate(),
      },
      database: {
        queries: this.counters.get('database_queries_total') || 0,
        connections: this.gauges.get('active_connections') || 0,
      },
      cache: {
        hits: this.counters.get('cache_hits') || 0,
        misses: this.counters.get('cache_misses') || 0,
        hitRate: this.calculateCacheHitRate(),
      },
      queues: {
        size: this.gauges.get('queue_size') || 0,
      },
    };
  }

  /**
   * Calculate HTTP error rate
   */
  private calculateErrorRate(): string {
    const total = this.counters.get('http_requests_total') || 0;
    const errors = this.counters.get('http_requests_error') || 0;

    if (total === 0) return '0.00%';
    return ((errors / total) * 100).toFixed(2) + '%';
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): string {
    const hits = this.counters.get('cache_hits') || 0;
    const misses = this.counters.get('cache_misses') || 0;
    const total = hits + misses;

    if (total === 0) return '0.00%';
    return ((hits / total) * 100).toFixed(2) + '%';
  }

  /**
   * Export metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Add counters
    for (const [name, value] of this.counters) {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${value}`);
    }

    // Add gauges
    for (const [name, value] of this.gauges) {
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${value}`);
    }

    // Add system metrics
    const systemMetrics = this.getSystemMetrics();
    lines.push('# TYPE system_memory_usage_bytes gauge');
    lines.push(`system_memory_usage_bytes ${systemMetrics.memory.used}`);
    lines.push('# TYPE system_cpu_load_average gauge');
    lines.push(
      `system_cpu_load_average{period="1m"} ${systemMetrics.cpu.loadAverage['1m']}`,
    );

    // Add process metrics
    const processMetrics = this.getProcessMetrics();
    lines.push('# TYPE process_memory_rss_bytes gauge');
    lines.push(`process_memory_rss_bytes ${processMetrics.memory.rss}`);
    lines.push('# TYPE process_memory_heap_bytes gauge');
    lines.push(`process_memory_heap_bytes ${processMetrics.memory.heapUsed}`);

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.initializeMetrics();
  }
}
