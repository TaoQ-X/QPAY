import * as Sentry from "@sentry/node";

/**
 * Monitoring & Observability Configuration
 * Handles metrics collection, error tracking, and performance monitoring
 */

export interface MetricsCollector {
  incrementCounter(name: string, value: number, tags?: Record<string, string>): void;
  recordGauge(name: string, value: number, tags?: Record<string, string>): void;
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
  startTimer(name: string): () => void;
}

class ObservabilityService {
  private metrics: Map<string, number> = new Map();
  private timers: Map<string, number[]> = new Map();

  /**
   * Initialize Sentry for error tracking
   */
  static initializeSentry() {
    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        maxBreadcrumbs: 50,
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.OnUncaughtException(),
          new Sentry.Integrations.OnUnhandledRejection(),
        ],
      });

      console.log("✅ Sentry error tracking initialized");
    } else {
      console.warn("⚠️  SENTRY_DSN not configured - error tracking disabled");
    }
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string
  ) {
    this.incrementCounter(`http.requests.total`, 1, {
      method,
      path: this.sanitizePath(path),
      status: statusCode.toString(),
    });

    this.recordHistogram(`http.request.duration_ms`, duration, {
      method,
      status: statusCode.toString(),
    });

    // Track error rate
    if (statusCode >= 400) {
      this.incrementCounter(`http.requests.errors`, 1, {
        status: statusCode.toString(),
      });
    }
  }

  /**
   * Record transaction metrics
   */
  recordTransaction(
    status: "approved" | "declined" | "pending",
    amount: number,
    paymentMethod: string
  ) {
    this.incrementCounter(`transactions.total`, 1, {
      status,
      method: paymentMethod,
    });

    this.recordGauge(`transactions.amount`, amount, {
      status,
    });

    if (status === "approved") {
      this.incrementCounter(`transactions.approved`, 1);
    } else if (status === "declined") {
      this.incrementCounter(`transactions.declined`, 1);
    }
  }

  /**
   * Record settlement metrics
   */
  recordSettlement(
    grossVolume: number,
    feeAmount: number,
    netVolume: number,
    transactionCount: number
  ) {
    this.recordGauge(`settlement.gross_volume`, grossVolume);
    this.recordGauge(`settlement.fee_amount`, feeAmount);
    this.recordGauge(`settlement.net_volume`, netVolume);
    this.recordGauge(`settlement.transaction_count`, transactionCount);
  }

  /**
   * Record database metrics
   */
  recordDatabaseQuery(query: string, duration: number, rowCount: number) {
    this.recordHistogram(`database.query.duration_ms`, duration, {
      query: this.sanitizeQuery(query),
    });

    this.recordGauge(`database.query.rows_returned`, rowCount);
  }

  /**
   * Record authentication metrics
   */
  recordAuthentication(method: "jwt" | "api_key" | "oauth", success: boolean) {
    const status = success ? "success" : "failure";
    this.incrementCounter(`auth.attempts`, 1, {
      method,
      status,
    });

    if (!success) {
      this.incrementCounter(`auth.failures`, 1, {
        method,
      });
    }
  }

  /**
   * Record fraud detection metrics
   */
  recordFraudDetection(
    score: number,
    flagged: boolean,
    reason?: string
  ) {
    this.recordHistogram(`fraud.risk_score`, score);

    if (flagged) {
      this.incrementCounter(`fraud.flagged_transactions`, 1, {
        reason: reason || "unknown",
      });
    }
  }

  /**
   * Record API metrics
   */
  recordApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ) {
    this.recordHistogram(`api.latency_ms`, duration, {
      endpoint: this.sanitizePath(endpoint),
      method,
      status: statusCode.toString(),
    });
  }

  /**
   * Record cache metrics
   */
  recordCacheHit(cacheKey: string, hit: boolean) {
    const type = hit ? "hit" : "miss";
    this.incrementCounter(`cache.${type}`, 1, {
      key: cacheKey.substring(0, 50),
    });
  }

  /**
   * Record rate limit metrics
   */
  recordRateLimit(endpoint: string, limited: boolean) {
    if (limited) {
      this.incrementCounter(`rate_limit.exceeded`, 1, {
        endpoint: this.sanitizePath(endpoint),
      });
    }
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    return {
      metrics: Object.fromEntries(this.metrics),
      timers: Object.fromEntries(this.timers),
      timestamp: new Date(),
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      status: "healthy",
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metrics: {
        totalRequests: this.metrics.get("http.requests.total") || 0,
        errorRate: this.calculateErrorRate(),
        avgResponseTime: this.calculateAvgResponseTime(),
        transactionsProcessed: this.metrics.get("transactions.total") || 0,
        approvalRate: this.calculateApprovalRate(),
      },
    };
  }

  /**
   * Record error
   */
  recordError(error: Error, context?: Record<string, any>) {
    this.incrementCounter(`errors.total`, 1);

    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: { custom: context },
      });
    }

    console.error("Error recorded:", error.message, context);
  }

  /**
   * Helper: Increment counter
   */
  private incrementCounter(
    name: string,
    value: number,
    tags?: Record<string, string>
  ) {
    const key = this.buildMetricKey(name, tags);
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + value);
  }

  /**
   * Helper: Record gauge
   */
  private recordGauge(
    name: string,
    value: number,
    tags?: Record<string, string>
  ) {
    const key = this.buildMetricKey(name, tags);
    this.metrics.set(key, value);
  }

  /**
   * Helper: Record histogram
   */
  private recordHistogram(
    name: string,
    value: number,
    tags?: Record<string, string>
  ) {
    const key = this.buildMetricKey(name, tags);
    if (!this.timers.has(key)) {
      this.timers.set(key, []);
    }
    this.timers.get(key)!.push(value);
  }

  /**
   * Helper: Build metric key
   */
  private buildMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    const tagString = Object.entries(tags)
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    return `${name}{${tagString}}`;
  }

  /**
   * Helper: Sanitize path
   */
  private sanitizePath(path: string): string {
    return path.replace(/\/[0-9a-f-]{36}/g, "/{id}");
  }

  /**
   * Helper: Sanitize query
   */
  private sanitizeQuery(query: string): string {
    return query.substring(0, 100).split(" ")[0];
  }

  /**
   * Helper: Calculate error rate
   */
  private calculateErrorRate(): number {
    const total = this.metrics.get("http.requests.total") || 1;
    const errors = this.metrics.get("http.requests.errors") || 0;
    return (errors / total) * 100;
  }

  /**
   * Helper: Calculate average response time
   */
  private calculateAvgResponseTime(): number {
    const durations = Array.from(this.timers.values())
      .flat()
      .filter((v) => typeof v === "number");

    if (durations.length === 0) return 0;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  /**
   * Helper: Calculate approval rate
   */
  private calculateApprovalRate(): number {
    const total = this.metrics.get("transactions.total") || 1;
    const approved = this.metrics.get("transactions.approved") || 0;
    return (approved / total) * 100;
  }
}

export const observabilityService = new ObservabilityService();
