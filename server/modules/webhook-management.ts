import crypto from "crypto";

/**
 * Enterprise-Grade Webhook Management System
 * Full webhook lifecycle management with delivery guarantees
 */

export interface WebhookEndpoint {
  id: string;
  businessId: string;
  url: string;
  events: string[];
  isActive: boolean;
  signingSecret: string;
  headers?: Record<string, string>;
  auth?: {
    type: "bearer" | "basic" | "api_key";
    credentials: string;
  };
  rateLimit?: {
    requestsPerSecond: number;
    burstSize: number;
  };
  timeout: number; // milliseconds
  retryPolicy: {
    maxRetries: number;
    initialDelayMs: number;
    backoffMultiplier: number;
    maxDelayMs: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt?: Date;
  testResult?: "success" | "failed";
}

export interface WebhookEvent {
  id: string;
  businessId: string;
  endpointId: string;
  eventType: string;
  data: Record<string, any>;
  status: "pending" | "delivered" | "failed" | "failed_permanent";
  attempts: number;
  nextRetryAt?: Date;
  lastAttemptAt?: Date;
  lastError?: string;
  httpStatusCode?: number;
  responseTime?: number;
  signature: string;
  createdAt: Date;
  deliveredAt?: Date;
}

export interface WebhookDeliveryLog {
  id: string;
  eventId: string;
  endpointId: string;
  attempt: number;
  httpStatusCode: number;
  responseBody: string;
  responseTime: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  error?: string;
  timestamp: Date;
}

export class WebhookManagementService {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private events: Map<string, WebhookEvent> = new Map();
  private deliveryLogs: WebhookDeliveryLog[] = [];
  private rateLimiters: Map<string, RateLimiter> = new Map();

  /**
   * Create webhook endpoint
   */
  async createEndpoint(
    businessId: string,
    config: {
      url: string;
      events: string[];
      headers?: Record<string, string>;
      timeout?: number;
      retryPolicy?: Partial<WebhookEndpoint["retryPolicy"]>;
    }
  ): Promise<WebhookEndpoint> {
    const id = `whk_${crypto.randomBytes(12).toString("hex")}`;
    const signingSecret = crypto.randomBytes(32).toString("hex");

    const endpoint: WebhookEndpoint = {
      id,
      businessId,
      url: config.url,
      events: config.events,
      isActive: true,
      signingSecret,
      headers: config.headers,
      timeout: config.timeout || 30000,
      retryPolicy: {
        maxRetries: 5,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
        maxDelayMs: 3600000, // 1 hour
        ...config.retryPolicy,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.endpoints.set(id, endpoint);

    // Initialize rate limiter
    this.rateLimiters.set(id, new RateLimiter(100, 1000)); // 100 req/sec

    console.log(`[Webhook] Created endpoint: ${id}`);
    return endpoint;
  }

  /**
   * Get endpoint details
   */
  getEndpoint(endpointId: string): WebhookEndpoint | null {
    return this.endpoints.get(endpointId) || null;
  }

  /**
   * List endpoints for business
   */
  listEndpoints(businessId: string): WebhookEndpoint[] {
    return Array.from(this.endpoints.values()).filter(
      (e) => e.businessId === businessId
    );
  }

  /**
   * Update endpoint
   */
  async updateEndpoint(
    endpointId: string,
    updates: Partial<WebhookEndpoint>
  ): Promise<WebhookEndpoint | null> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return null;

    const updated = { ...endpoint, ...updates, updatedAt: new Date() };
    this.endpoints.set(endpointId, updated);

    return updated;
  }

  /**
   * Delete endpoint
   */
  async deleteEndpoint(endpointId: string): Promise<boolean> {
    const deleted = this.endpoints.delete(endpointId);
    if (deleted) {
      this.rateLimiters.delete(endpointId);
      console.log(`[Webhook] Deleted endpoint: ${endpointId}`);
    }
    return deleted;
  }

  /**
   * Test webhook delivery
   */
  async testWebhook(endpointId: string): Promise<{
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  }> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      return { success: false, error: "Endpoint not found" };
    }

    try {
      const startTime = Date.now();
      const testPayload = {
        event: "webhook.test",
        timestamp: new Date().toISOString(),
        data: { message: "This is a test webhook" },
      };

      const signature = this.generateSignature(endpoint.signingSecret, testPayload);

      // Simulate webhook delivery
      const response = await this.sendWebhookRequest(endpoint, testPayload, signature);

      const responseTime = Date.now() - startTime;

      // Update endpoint test result
      endpoint.lastTestedAt = new Date();
      endpoint.testResult = response.ok ? "success" : "failed";

      return {
        success: response.ok,
        statusCode: response.status,
        responseTime,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      endpoint.testResult = "failed";
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(
    businessId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<string[]> {
    const endpoints = this.listEndpoints(businessId).filter(
      (e) => e.isActive && e.events.includes(eventType)
    );

    const eventIds: string[] = [];

    for (const endpoint of endpoints) {
      const eventId = await this.createWebhookEvent(endpoint.id, eventType, data);
      eventIds.push(eventId);

      // Queue delivery
      this.queueDelivery(eventId);
    }

    return eventIds;
  }

  /**
   * Create webhook event
   */
  private async createWebhookEvent(
    endpointId: string,
    eventType: string,
    data: Record<string, any>
  ): Promise<string> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) throw new Error("Endpoint not found");

    const id = `evt_${crypto.randomBytes(12).toString("hex")}`;
    const payload = { event: eventType, timestamp: new Date().toISOString(), data };
    const signature = this.generateSignature(endpoint.signingSecret, payload);

    const event: WebhookEvent = {
      id,
      businessId: endpoint.businessId,
      endpointId,
      eventType,
      data,
      status: "pending",
      attempts: 0,
      signature,
      createdAt: new Date(),
    };

    this.events.set(id, event);
    return id;
  }

  /**
   * Queue delivery with retry logic
   */
  private queueDelivery(eventId: string) {
    // In production: Use job queue (Bull/RabbitMQ)
    // For now: Schedule delivery
    setImmediate(() => this.deliverWebhook(eventId));
  }

  /**
   * Deliver webhook with exponential backoff
   */
  private async deliverWebhook(eventId: string) {
    const event = this.events.get(eventId);
    if (!event) return;

    const endpoint = this.endpoints.get(event.endpointId);
    if (!endpoint) return;

    // Check rate limit
    const limiter = this.rateLimiters.get(event.endpointId);
    if (limiter && !limiter.allowRequest()) {
      // Reschedule
      setTimeout(() => this.deliverWebhook(eventId), 1000);
      return;
    }

    event.attempts++;
    event.lastAttemptAt = new Date();

    try {
      const payload = { event: event.eventType, timestamp: new Date().toISOString(), data: event.data };
      const response = await this.sendWebhookRequest(endpoint, payload, event.signature);

      // Log delivery
      this.logDelivery(eventId, response);

      if (response.ok) {
        event.status = "delivered";
        event.deliveredAt = new Date();
        event.httpStatusCode = response.status;
        console.log(`[Webhook] Delivered: ${eventId}`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      event.lastError = error instanceof Error ? error.message : String(error);

      if (event.attempts < endpoint.retryPolicy.maxRetries) {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          endpoint.retryPolicy.initialDelayMs * Math.pow(endpoint.retryPolicy.backoffMultiplier, event.attempts - 1),
          endpoint.retryPolicy.maxDelayMs
        );

        event.nextRetryAt = new Date(Date.now() + delay);
        event.status = "pending";

        console.log(`[Webhook] Retry scheduled for ${eventId} in ${delay}ms`);

        // Reschedule
        setTimeout(() => this.deliverWebhook(eventId), delay);
      } else {
        event.status = "failed_permanent";
        console.error(`[Webhook] Permanent failure: ${eventId} after ${event.attempts} attempts`);
      }
    }
  }

  /**
   * Send webhook HTTP request
   */
  private async sendWebhookRequest(
    endpoint: WebhookEndpoint,
    payload: Record<string, any>,
    signature: string
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Signature": signature,
      "X-Webhook-ID": crypto.randomBytes(8).toString("hex"),
      ...endpoint.headers,
    };

    // Add auth if configured
    if (endpoint.auth) {
      if (endpoint.auth.type === "bearer") {
        headers["Authorization"] = `Bearer ${endpoint.auth.credentials}`;
      } else if (endpoint.auth.type === "basic") {
        headers["Authorization"] = `Basic ${endpoint.auth.credentials}`;
      } else if (endpoint.auth.type === "api_key") {
        headers["X-API-Key"] = endpoint.auth.credentials;
      }
    }

    // In production: use actual fetch
    // For now: return mock response
    return {
      ok: Math.random() > 0.1, // 90% success rate
      status: Math.random() > 0.1 ? 200 : 500,
      headers: new Headers(),
      json: async () => ({}),
    } as any as Response;
  }

  /**
   * Generate HMAC signature
   */
  private generateSignature(secret: string, payload: Record<string, any>): string {
    const data = JSON.stringify(payload);
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  }

  /**
   * Verify webhook signature
   */
  verifySignature(secret: string, payload: Record<string, any>, signature: string): boolean {
    const expectedSignature = this.generateSignature(secret, payload);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Log delivery attempt
   */
  private logDelivery(eventId: string, response: any) {
    const event = this.events.get(eventId);
    if (!event) return;

    const log: WebhookDeliveryLog = {
      id: `log_${crypto.randomBytes(8).toString("hex")}`,
      eventId,
      endpointId: event.endpointId,
      attempt: event.attempts,
      httpStatusCode: response.status,
      responseBody: response.body || "",
      responseTime: response.responseTime || 0,
      requestHeaders: { "Content-Type": "application/json" },
      responseHeaders: Object.fromEntries(response.headers || []),
      timestamp: new Date(),
    };

    this.deliveryLogs.push(log);
    if (this.deliveryLogs.length > 10000) {
      this.deliveryLogs = this.deliveryLogs.slice(-10000);
    }
  }

  /**
   * Get delivery logs
   */
  getDeliveryLogs(eventId?: string, limit: number = 100): WebhookDeliveryLog[] {
    return this.deliveryLogs
      .filter((log) => !eventId || log.eventId === eventId)
      .slice(-limit);
  }

  /**
   * Get webhook statistics
   */
  getStats(businessId: string) {
    const businessEndpoints = this.listEndpoints(businessId);
    const businessEvents = Array.from(this.events.values()).filter(
      (e) => e.businessId === businessId
    );

    return {
      totalEndpoints: businessEndpoints.length,
      activeEndpoints: businessEndpoints.filter((e) => e.isActive).length,
      totalEvents: businessEvents.length,
      deliveredEvents: businessEvents.filter((e) => e.status === "delivered").length,
      failedEvents: businessEvents.filter((e) => e.status === "failed_permanent").length,
      successRate:
        businessEvents.length > 0
          ? (businessEvents.filter((e) => e.status === "delivered").length /
              businessEvents.length) *
            100
          : 0,
      avgResponseTime: this.calculateAvgResponseTime(businessEvents),
    };
  }

  /**
   * Calculate average response time
   */
  private calculateAvgResponseTime(events: WebhookEvent[]): number {
    const withResponseTime = events.filter((e) => e.data && typeof e.data === "object");
    if (withResponseTime.length === 0) return 0;
    const sum = withResponseTime.reduce((acc, e) => acc + (e.data?.responseTime || 0), 0);
    return Math.round(sum / withResponseTime.length);
  }
}

/**
 * Simple rate limiter for webhook delivery
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly window: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  allowRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.window);

    if (this.requests.length < this.limit) {
      this.requests.push(now);
      return true;
    }

    return false;
  }
}

export default WebhookManagementService;
