import crypto from 'crypto';
import axios from 'axios';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: number;
  data: Record<string, any>;
  signature?: string;
}

export type WebhookEventType =
  | 'payment.created'
  | 'payment.pending'
  | 'payment.confirmed'
  | 'payment.failed'
  | 'settlement.created'
  | 'settlement.processing'
  | 'settlement.completed'
  | 'settlement.failed'
  | 'account.created'
  | 'wallet.verified';

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEventType[];
  active: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
  failureCount: number;
  successCount: number;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventId: string;
  status: 'pending' | 'delivered' | 'failed';
  attempt: number;
  maxAttempts: number;
  nextRetryAt?: number;
  responseStatus?: number;
  responseBody?: string;
  createdAt: number;
  updatedAt: number;
}

class WebhookService {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private eventQueue: WebhookEvent[] = [];

  // Retry configuration
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly INITIAL_BACKOFF_MS = 1000; // 1 second
  private readonly MAX_BACKOFF_MS = 3600000; // 1 hour

  /**
   * Register a webhook endpoint
   */
  registerEndpoint(
    url: string,
    events: WebhookEventType[],
    apiKey: string
  ): WebhookEndpoint {
    const id = `whk_${crypto.randomBytes(8).toString('hex')}`;
    
    const endpoint: WebhookEndpoint = {
      id,
      url,
      events,
      active: true,
      createdAt: Math.floor(Date.now() / 1000),
      failureCount: 0,
      successCount: 0,
    };

    this.endpoints.set(id, endpoint);
    return endpoint;
  }

  /**
   * Get webhook endpoint
   */
  getEndpoint(endpointId: string): WebhookEndpoint | undefined {
    return this.endpoints.get(endpointId);
  }

  /**
   * List all webhook endpoints for an API key (simplified - in production use database)
   */
  listEndpoints(apiKey: string): WebhookEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  /**
   * Update webhook endpoint
   */
  updateEndpoint(
    endpointId: string,
    updates: Partial<WebhookEndpoint>
  ): WebhookEndpoint | undefined {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return undefined;

    Object.assign(endpoint, updates);
    return endpoint;
  }

  /**
   * Delete webhook endpoint
   */
  deleteEndpoint(endpointId: string): boolean {
    return this.endpoints.delete(endpointId);
  }

  /**
   * Trigger a webhook event
   */
  async triggerEvent(event: Omit<WebhookEvent, 'id'>): Promise<void> {
    const eventWithId: WebhookEvent = {
      ...event,
      id: `evt_${crypto.randomBytes(8).toString('hex')}`,
    };

    // Add to queue for processing
    this.eventQueue.push(eventWithId);

    // Process event immediately
    await this.processEvent(eventWithId);
  }

  /**
   * Process a webhook event and send to registered endpoints
   */
  private async processEvent(event: WebhookEvent): Promise<void> {
    const matchingEndpoints = Array.from(this.endpoints.values()).filter(
      endpoint =>
        endpoint.active &&
        endpoint.events.includes(event.type)
    );

    for (const endpoint of matchingEndpoints) {
      await this.deliverEvent(event, endpoint);
    }
  }

  /**
   * Deliver event to a specific endpoint
   */
  private async deliverEvent(
    event: WebhookEvent,
    endpoint: WebhookEndpoint
  ): Promise<void> {
    const deliveryId = `del_${crypto.randomBytes(8).toString('hex')}`;

    const delivery: WebhookDelivery = {
      id: deliveryId,
      endpointId: endpoint.id,
      eventId: event.id,
      status: 'pending',
      attempt: 1,
      maxAttempts: this.MAX_RETRY_ATTEMPTS,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    };

    this.deliveries.set(deliveryId, delivery);

    // Attempt delivery
    await this.attemptDelivery(delivery, event, endpoint);
  }

  /**
   * Attempt to deliver webhook with retry logic
   */
  private async attemptDelivery(
    delivery: WebhookDelivery,
    event: WebhookEvent,
    endpoint: WebhookEndpoint
  ): Promise<void> {
    try {
      // Create signature for webhook security
      const signature = this.createSignature(event);
      const payload = {
        ...event,
        signature,
      };

      // Send webhook
      const response = await axios.post(endpoint.url, payload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': event.type,
          'X-Webhook-Event-ID': event.id,
          'X-Webhook-Signature': signature,
          'User-Agent': 'QPay-Webhook/1.0',
        },
      });

      // Success
      delivery.status = 'delivered';
      delivery.responseStatus = response.status;
      delivery.responseBody = JSON.stringify(response.data);
      delivery.updatedAt = Math.floor(Date.now() / 1000);

      endpoint.successCount++;
      endpoint.lastTriggeredAt = Math.floor(Date.now() / 1000);
    } catch (error: any) {
      // Failure - schedule retry
      delivery.attempt++;
      delivery.updatedAt = Math.floor(Date.now() / 1000);
      delivery.responseStatus = error.response?.status;
      delivery.responseBody = error.message;

      if (delivery.attempt <= delivery.maxAttempts) {
        // Calculate exponential backoff
        const backoffMs = Math.min(
          this.INITIAL_BACKOFF_MS * Math.pow(2, delivery.attempt - 1),
          this.MAX_BACKOFF_MS
        );
        
        delivery.status = 'pending';
        delivery.nextRetryAt = Math.floor((Date.now() + backoffMs) / 1000);

        // Schedule retry (in production, use job queue)
        setTimeout(() => {
          this.attemptDelivery(delivery, event, endpoint);
        }, backoffMs);
      } else {
        // Max retries exceeded
        delivery.status = 'failed';
        endpoint.failureCount++;
      }
    }
  }

  /**
   * Create HMAC signature for webhook security
   */
  private createSignature(event: WebhookEvent): string {
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const secret = process.env.WEBHOOK_SECRET || 'webhook-secret-key';
    
    const signatureData = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signatureData)
      .digest('hex');

    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Verify webhook signature (for client validation)
   */
  verifySignature(payload: string, signature: string): boolean {
    try {
      const [timestampPart, signaturePart] = signature.split(',');
      const timestamp = parseInt(timestampPart.split('=')[1]);
      const receivedSig = signaturePart.split('=')[1];

      // Check timestamp is recent (within 5 minutes)
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTimestamp - timestamp) > 300) {
        return false;
      }

      // Verify signature
      const secret = process.env.WEBHOOK_SECRET || 'webhook-secret-key';
      const signatureData = `${timestamp}.${payload}`;
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(signatureData)
        .digest('hex');

      return receivedSig === expectedSig;
    } catch {
      return false;
    }
  }

  /**
   * Get webhook delivery status
   */
  getDelivery(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveries.get(deliveryId);
  }

  /**
   * List deliveries for an endpoint
   */
  listDeliveries(endpointId: string, limit = 50): WebhookDelivery[] {
    return Array.from(this.deliveries.values())
      .filter(d => d.endpointId === endpointId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Get webhook statistics
   */
  getStatistics(endpointId: string) {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return null;

    const deliveries = Array.from(this.deliveries.values()).filter(
      d => d.endpointId === endpointId
    );

    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    const pending = deliveries.filter(d => d.status === 'pending').length;

    return {
      successCount: endpoint.successCount,
      failureCount: endpoint.failureCount,
      successRate: endpoint.successCount + endpoint.failureCount > 0
        ? (endpoint.successCount / (endpoint.successCount + endpoint.failureCount)) * 100
        : 0,
      delivered,
      failed,
      pending,
      total: deliveries.length,
    };
  }
}

// Export singleton instance
export const webhookService = new WebhookService();

/**
 * Trigger common payment events
 */
export const triggerPaymentEvents = {
  created: (paymentId: string, data: any) =>
    webhookService.triggerEvent({
      type: 'payment.created',
      timestamp: Math.floor(Date.now() / 1000),
      data: { paymentId, ...data },
    }),

  pending: (paymentId: string, data: any) =>
    webhookService.triggerEvent({
      type: 'payment.pending',
      timestamp: Math.floor(Date.now() / 1000),
      data: { paymentId, ...data },
    }),

  confirmed: (paymentId: string, txHash: string, data: any) =>
    webhookService.triggerEvent({
      type: 'payment.confirmed',
      timestamp: Math.floor(Date.now() / 1000),
      data: { paymentId, txHash, ...data },
    }),

  failed: (paymentId: string, reason: string) =>
    webhookService.triggerEvent({
      type: 'payment.failed',
      timestamp: Math.floor(Date.now() / 1000),
      data: { paymentId, reason },
    }),
};

/**
 * Trigger common settlement events
 */
export const triggerSettlementEvents = {
  created: (settlementId: string, data: any) =>
    webhookService.triggerEvent({
      type: 'settlement.created',
      timestamp: Math.floor(Date.now() / 1000),
      data: { settlementId, ...data },
    }),

  processing: (settlementId: string) =>
    webhookService.triggerEvent({
      type: 'settlement.processing',
      timestamp: Math.floor(Date.now() / 1000),
      data: { settlementId },
    }),

  completed: (settlementId: string, bankTxId: string) =>
    webhookService.triggerEvent({
      type: 'settlement.completed',
      timestamp: Math.floor(Date.now() / 1000),
      data: { settlementId, bankTxId },
    }),

  failed: (settlementId: string, reason: string) =>
    webhookService.triggerEvent({
      type: 'settlement.failed',
      timestamp: Math.floor(Date.now() / 1000),
      data: { settlementId, reason },
    }),
};
