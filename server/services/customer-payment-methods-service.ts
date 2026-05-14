import Database from "../database/client";

export interface PaymentMethodConfig {
  customer_identifier: string;
  card_token: string;
  card_brand: string;
  card_last_four: string;
  card_expiry_month: number;
  card_expiry_year: number;
  is_primary?: boolean;
  metadata?: Record<string, any>;
}

export class CustomerPaymentMethodsService {
  /**
   * Add or update payment method for customer
   */
  static async addPaymentMethod(
    merchantId: string,
    config: PaymentMethodConfig
  ) {
    // Check if method already exists
    const existing = await Database.getOne(
      `SELECT id FROM customer_payment_methods 
       WHERE merchant_id = $1 AND customer_identifier = $2 AND card_token = $3`,
      [merchantId, config.customer_identifier, config.card_token]
    );

    if (existing) {
      return await this.updatePaymentMethod(existing.id, config);
    }

    // If marking as primary, unmark others
    if (config.is_primary) {
      await Database.update(
        `UPDATE customer_payment_methods SET is_primary = false 
         WHERE merchant_id = $1 AND customer_identifier = $2`,
        [merchantId, config.customer_identifier]
      );
    }

    return await Database.insert("customer_payment_methods", {
      merchant_id: merchantId,
      customer_identifier: config.customer_identifier,
      card_token: config.card_token,
      card_brand: config.card_brand,
      card_last_four: config.card_last_four,
      card_expiry_month: config.card_expiry_month,
      card_expiry_year: config.card_expiry_year,
      is_primary: config.is_primary || false,
      metadata: config.metadata || null,
    });
  }

  /**
   * Update payment method
   */
  static async updatePaymentMethod(
    methodId: string,
    updates: Partial<PaymentMethodConfig>
  ) {
    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(", ");

    const values = Object.values(updates);

    return await Database.update(
      `UPDATE customer_payment_methods SET ${setClause} WHERE id = $1 RETURNING *`,
      [methodId, ...values]
    );
  }

  /**
   * Get customer's primary payment method
   */
  static async getPrimaryPaymentMethod(merchantId: string, customerIdentifier: string) {
    return await Database.getOne(
      `SELECT * FROM customer_payment_methods 
       WHERE merchant_id = $1 AND customer_identifier = $2 AND is_primary = true AND status = 'active'`,
      [merchantId, customerIdentifier]
    );
  }

  /**
   * Get all payment methods for customer
   */
  static async getCustomerPaymentMethods(merchantId: string, customerIdentifier: string) {
    return await Database.getMany(
      `SELECT * FROM customer_payment_methods 
       WHERE merchant_id = $1 AND customer_identifier = $2 AND status = 'active'
       ORDER BY is_primary DESC, created_at DESC`,
      [merchantId, customerIdentifier]
    );
  }

  /**
   * Mark payment method as expired
   */
  static async markAsExpired(methodId: string) {
    return await Database.update(
      `UPDATE customer_payment_methods SET status = 'expired' WHERE id = $1 RETURNING *`,
      [methodId]
    );
  }

  /**
   * Mark payment method as invalid
   */
  static async markAsInvalid(methodId: string) {
    return await Database.update(
      `UPDATE customer_payment_methods SET status = 'invalid' WHERE id = $1 RETURNING *`,
      [methodId]
    );
  }

  /**
   * Archive payment method
   */
  static async archivePaymentMethod(methodId: string) {
    return await Database.update(
      `UPDATE customer_payment_methods SET status = 'archived' WHERE id = $1 RETURNING *`,
      [methodId]
    );
  }

  /**
   * Record card updater event (automatic card update from network)
   */
  static async recordCardUpdaterEvent(
    merchantId: string,
    methodId: string,
    eventType: "card_updated" | "card_expired" | "card_closed" | "reconciliation",
    processorResponse: Record<string, any> = {},
    newCardData?: { expiry_month?: number; expiry_year?: number }
  ) {
    const method = await Database.getOne(
      `SELECT * FROM customer_payment_methods WHERE id = $1`,
      [methodId]
    );

    if (!method) {
      throw new Error("Payment method not found");
    }

    const event = await Database.insert("card_updater_events", {
      merchant_id: merchantId,
      payment_method_id: methodId,
      event_type: eventType,
      old_card_hash: this.hashCard(method.card_token),
      processor_response: processorResponse,
    });

    // Handle different event types
    if (eventType === "card_updated" && newCardData) {
      // Update payment method with new data from processor
      await Database.update(
        `UPDATE customer_payment_methods 
         SET card_expiry_month = $1, card_expiry_year = $2, status = 'active'
         WHERE id = $3`,
        [newCardData.expiry_month, newCardData.expiry_year, methodId]
      );
    } else if (eventType === "card_expired" || eventType === "card_closed") {
      // Mark as expired/invalid
      await Database.update(
        `UPDATE customer_payment_methods SET status = 'expired' WHERE id = $1`,
        [methodId]
      );
    }

    // Update event as processed
    await Database.update(
      `UPDATE card_updater_events SET status = 'processed' WHERE id = $1`,
      [event.id]
    );

    return event;
  }

  /**
   * Get pending card updater events
   */
  static async getPendingUpdaterEvents(merchantId?: string, limit = 100) {
    let query = `SELECT * FROM card_updater_events WHERE status = 'pending'`;
    const params: any[] = [];

    if (merchantId) {
      params.push(merchantId);
      query += ` AND merchant_id = $${params.length}`;
    }

    query += ` ORDER BY created_at ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    return await Database.getMany(query, params);
  }

  /**
   * Get card updater events for a payment method
   */
  static async getMethodUpdaterHistory(methodId: string) {
    return await Database.getMany(
      `SELECT * FROM card_updater_events 
       WHERE payment_method_id = $1
       ORDER BY created_at DESC`,
      [methodId]
    );
  }

  /**
   * Check if card is still valid
   */
  static isCardExpired(expiryMonth: number, expiryYear: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expiryYear < currentYear) return true;
    if (expiryYear === currentYear && expiryMonth < currentMonth) return true;

    return false;
  }

  /**
   * Hash card token for comparison (simple version - in production use proper hashing)
   */
  private static hashCard(token: string): string {
    return require("crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");
  }

  /**
   * Get customer payment method stats
   */
  static async getPaymentMethodStats(merchantId: string) {
    const stats = await Database.getOne(
      `SELECT 
        COUNT(*) as total_methods,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_methods,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_methods,
        COUNT(DISTINCT customer_identifier) as unique_customers
       FROM customer_payment_methods
       WHERE merchant_id = $1`,
      [merchantId]
    );

    return {
      total_methods: stats?.total_methods || 0,
      active_methods: stats?.active_methods || 0,
      expired_methods: stats?.expired_methods || 0,
      unique_customers: stats?.unique_customers || 0,
    };
  }
}
