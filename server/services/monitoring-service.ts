import fs from "fs";
import path from "path";

/**
 * Monitoring & Alerting Service
 * Comprehensive system for logging, monitoring, and alerting
 */

export interface MetricsSnapshot {
  timestamp: Date;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  requestsPerSecond: number;
  errorRate: number;
  activeConnections: number;
}

export interface AlertConfig {
  name: string;
  condition: (metrics: MetricsSnapshot) => boolean;
  severity: "info" | "warning" | "critical";
  action: (metrics: MetricsSnapshot) => Promise<void>;
}

export class MonitoringService {
  private logStream: fs.WriteStream;
  private errorLogStream: fs.WriteStream;
  private metricsHistory: MetricsSnapshot[] = [];
  private alerts: AlertConfig[] = [];
  private startTime: Date = new Date();
  private requestCount: number = 0;
  private errorCount: number = 0;
  private lastMetricsCheck: Date = new Date();

  constructor(logDir: string = "./logs") {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Initialize log streams
    this.logStream = fs.createWriteStream(
      path.join(logDir, `app-${new Date().toISOString().split("T")[0]}.log`),
      { flags: "a" }
    );

    this.errorLogStream = fs.createWriteStream(
      path.join(logDir, `errors-${new Date().toISOString().split("T")[0]}.log`),
      { flags: "a" }
    );

    this.setupDefaultAlerts();
    this.startMetricsCollection();

    console.log("✅ Monitoring service initialized");
  }

  /**
   * Log application events
   */
  log(
    level: "info" | "debug" | "warn" | "error",
    message: string,
    context?: Record<string, any>
  ) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      context,
    };

    const logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    // Write to appropriate stream
    if (level === "error") {
      this.errorLogStream.write(logLine + "\n");
      this.errorCount++;
    } else {
      this.logStream.write(logLine + "\n");
    }

    // Also log to console in development
    if (process.env.NODE_ENV !== "production") {
      console[level as keyof Console](logEntry);
    }
  }

  /**
   * Track API request
   */
  trackRequest(method: string, path: string, statusCode: number, duration: number) {
    this.requestCount++;

    if (statusCode >= 400) {
      this.errorCount++;
    }

    this.log("info", `${method} ${path}`, {
      statusCode,
      duration: `${duration}ms`,
    });
  }

  /**
   * Collect system metrics
   */
  private collectMetrics(): MetricsSnapshot {
    const now = new Date();
    const uptime = Math.floor((now.getTime() - this.startTime.getTime()) / 1000);
    const timeSinceLastCheck = (now.getTime() - this.lastMetricsCheck.getTime()) / 1000;

    const snapshot: MetricsSnapshot = {
      timestamp: now,
      uptime,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      requestsPerSecond: this.requestCount / Math.max(timeSinceLastCheck, 1),
      errorRate:
        this.requestCount > 0
          ? (this.errorCount / this.requestCount) * 100
          : 0,
      activeConnections: 0, // Would be populated from actual connections
    };

    this.metricsHistory.push(snapshot);

    // Keep only last 1000 snapshots (approximately 16 minutes with 1 snapshot/second)
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }

    // Reset counters
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastMetricsCheck = now;

    return snapshot;
  }

  /**
   * Start automatic metrics collection
   */
  private startMetricsCollection() {
    // Collect metrics every 5 seconds
    setInterval(() => {
      const metrics = this.collectMetrics();
      this.checkAlerts(metrics);
    }, 5000);
  }

  /**
   * Setup default alerts
   */
  private setupDefaultAlerts() {
    // Memory usage alert
    this.addAlert({
      name: "High Memory Usage",
      condition: (metrics) => {
        const heapUsedPercent =
          (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
        return heapUsedPercent > 85;
      },
      severity: "warning",
      action: async (metrics) => {
        this.log("warn", "High memory usage detected", {
          heapUsed: `${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(metrics.memoryUsage.heapTotal / 1024 / 1024)}MB`,
        });
      },
    });

    // Error rate alert
    this.addAlert({
      name: "High Error Rate",
      condition: (metrics) => metrics.errorRate > 10,
      severity: "critical",
      action: async (metrics) => {
        this.log("error", `High error rate detected: ${metrics.errorRate.toFixed(2)}%`, {
          requestsPerSecond: metrics.requestsPerSecond.toFixed(2),
        });
      },
    });

    // Performance alert
    this.addAlert({
      name: "High CPU Usage",
      condition: (metrics) => metrics.cpuUsage.user > 500000,
      severity: "warning",
      action: async (metrics) => {
        this.log("warn", "High CPU usage detected", {
          userCPU: `${metrics.cpuUsage.user}μs`,
          systemCPU: `${metrics.cpuUsage.system}μs`,
        });
      },
    });
  }

  /**
   * Add custom alert
   */
  addAlert(alert: AlertConfig) {
    this.alerts.push(alert);
  }

  /**
   * Check alerts against current metrics
   */
  private async checkAlerts(metrics: MetricsSnapshot) {
    for (const alert of this.alerts) {
      try {
        if (alert.condition(metrics)) {
          await alert.action(metrics);

          // Log alert
          this.log(alert.severity, `Alert: ${alert.name}`);

          // In production, send to external monitoring service
          if (process.env.NODE_ENV === "production") {
            // Send to Datadog, New Relic, Sentry, etc.
          }
        }
      } catch (error) {
        this.log("error", `Alert execution failed: ${alert.name}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];

    if (!latestMetrics) {
      return {
        status: "unknown",
        timestamp: new Date().toISOString(),
        uptime: 0,
        details: {},
      };
    }

    const heapUsedPercent =
      (latestMetrics.memoryUsage.heapUsed / latestMetrics.memoryUsage.heapTotal) *
      100;

    const isHealthy =
      heapUsedPercent < 80 &&
      latestMetrics.errorRate < 5 &&
      latestMetrics.requestsPerSecond > 0;

    return {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: latestMetrics.timestamp.toISOString(),
      uptime: latestMetrics.uptime,
      details: {
        memoryUsage: {
          heapUsed: `${Math.round(latestMetrics.memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(latestMetrics.memoryUsage.heapTotal / 1024 / 1024)}MB`,
          percentage: heapUsedPercent.toFixed(2) + "%",
        },
        errorRate: latestMetrics.errorRate.toFixed(2) + "%",
        requestsPerSecond: latestMetrics.requestsPerSecond.toFixed(2),
        cpu: {
          user: latestMetrics.cpuUsage.user,
          system: latestMetrics.cpuUsage.system,
        },
      },
    };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(minutes: number = 5) {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.metricsHistory.filter((m) => m.timestamp > cutoffTime);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.metricsHistory.length === 0) {
      return {
        avgRequestsPerSecond: 0,
        avgErrorRate: 0,
        avgMemoryUsage: 0,
        maxMemoryUsage: 0,
      };
    }

    const avgRPS =
      this.metricsHistory.reduce((sum, m) => sum + m.requestsPerSecond, 0) /
      this.metricsHistory.length;

    const avgErrorRate =
      this.metricsHistory.reduce((sum, m) => sum + m.errorRate, 0) /
      this.metricsHistory.length;

    const heapUsages = this.metricsHistory.map(
      (m) => (m.memoryUsage.heapUsed / m.memoryUsage.heapTotal) * 100
    );

    return {
      avgRequestsPerSecond: avgRPS.toFixed(2),
      avgErrorRate: avgErrorRate.toFixed(2) + "%",
      avgMemoryUsage: (
        heapUsages.reduce((a, b) => a + b, 0) / heapUsages.length
      ).toFixed(2) + "%",
      maxMemoryUsage: Math.max(...heapUsages).toFixed(2) + "%",
    };
  }

  /**
   * Cleanup on shutdown
   */
  shutdown() {
    this.logStream.end();
    this.errorLogStream.end();
    this.log("info", "Monitoring service shutdown");
  }
}

export default MonitoringService;
