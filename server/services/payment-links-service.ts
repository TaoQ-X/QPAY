import Database from "../database/client";

export interface PaymentLinkConfig {
  title: string;
  description?: string;
  amount_cents?: number;
  is_variable_amount?: boolean;
  min_amount_cents?: number;
  max_amount_cents?: number;
  currency?: string;
  theme_color?: string;
  custom_message?: string;
  redirect_url?: string;
  expires_at?: Date;
}

export class PaymentLinksService {
  /**
   * Create a new payment link
   */
  static async createPaymentLink(
    merchantId: string,
    config: PaymentLinkConfig,
    createdBy: string
  ) {
    const slug = this.generateSlug(config.title);
    
    const link = await Database.insert("payment_links", {
      merchant_id: merchantId,
      slug,
      title: config.title,
      description: config.description || null,
      amount_cents: config.amount_cents || null,
      is_variable_amount: config.is_variable_amount || false,
      min_amount_cents: config.min_amount_cents || null,
      max_amount_cents: config.max_amount_cents || null,
      currency: config.currency || "USD",
      theme_color: config.theme_color || null,
      custom_message: config.custom_message || null,
      redirect_url: config.redirect_url || null,
      expires_at: config.expires_at || null,
      created_by: createdBy,
    });

    return link;
  }

  /**
   * Get payment link by slug (public endpoint)
   */
  static async getPaymentLinkBySlug(slug: string) {
    return await Database.getOne(
      `SELECT * FROM payment_links WHERE slug = $1 AND status = 'active'`,
      [slug]
    );
  }

  /**
   * Get payment link by ID
   */
  static async getPaymentLink(linkId: string) {
    return await Database.getOne(
      `SELECT * FROM payment_links WHERE id = $1`,
      [linkId]
    );
  }

  /**
   * List merchant payment links
   */
  static async listMerchantLinks(merchantId: string, limit = 50, offset = 0) {
    const links = await Database.getMany(
      `SELECT * FROM payment_links 
       WHERE merchant_id = $1 AND status != 'deleted'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [merchantId, limit, offset]
    );

    const total = await Database.getOne(
      `SELECT COUNT(*) as count FROM payment_links 
       WHERE merchant_id = $1 AND status != 'deleted'`,
      [merchantId]
    );

    return { links, total: total?.count || 0 };
  }

  /**
   * Update payment link
   */
  static async updatePaymentLink(linkId: string, updates: Partial<PaymentLinkConfig>) {
    const setClause = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(", ");

    const values = Object.values(updates);

    return await Database.update(
      `UPDATE payment_links SET ${setClause} WHERE id = $1 RETURNING *`,
      [linkId, ...values]
    );
  }

  /**
   * Archive payment link
   */
  static async archivePaymentLink(linkId: string) {
    return await Database.update(
      `UPDATE payment_links SET status = 'archived' WHERE id = $1 RETURNING *`,
      [linkId]
    );
  }

  /**
   * Record a payment link transaction
   */
  static async recordLinkTransaction(
    linkId: string,
    transactionId: string,
    payerEmail?: string,
    payerName?: string
  ) {
    return await Database.insert("payment_link_transactions", {
      payment_link_id: linkId,
      transaction_id: transactionId,
      payer_email: payerEmail || null,
      payer_name: payerName || null,
    });
  }

  /**
   * Get payment link analytics
   */
  static async getPaymentLinkAnalytics(linkId: string) {
    const clicks = await Database.getOne(
      `SELECT COUNT(*) as total_clicks FROM payment_link_clicks WHERE payment_link_id = $1`,
      [linkId]
    );

    const transactions = await Database.getMany(
      `SELECT COUNT(*) as count, 
              COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed,
              SUM(CASE WHEN t.status = 'completed' THEN t.amount_cents ELSE 0 END) as total_amount
       FROM payment_link_transactions plt
       JOIN transactions t ON plt.transaction_id = t.id
       WHERE plt.payment_link_id = $1`,
      [linkId]
    );

    return {
      link_clicks: clicks?.total_clicks || 0,
      total_transactions: transactions?.[0]?.count || 0,
      completed_transactions: transactions?.[0]?.completed || 0,
      total_revenue_cents: transactions?.[0]?.total_amount || 0,
    };
  }

  /**
   * Record payment link click (for analytics)
   */
  static async recordLinkClick(linkId: string, ipAddress?: string, userAgent?: string) {
    return await Database.insert("payment_link_clicks", {
      payment_link_id: linkId,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    });
  }

  /**
   * Generate unique slug from title
   */
  private static generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Add random suffix to ensure uniqueness
    const suffix = Math.random().toString(36).substr(2, 6);
    return `${baseSlug}-${suffix}`;
  }

  /**
   * Check if slug is available
   */
  static async isSlugAvailable(slug: string): Promise<boolean> {
    const existing = await Database.getOne(
      `SELECT id FROM payment_links WHERE slug = $1`,
      [slug]
    );
    return !existing;
  }

  /**
   * Get public link URL
   */
  static getPublicLinkUrl(slug: string, baseUrl: string = ""): string {
    const baseHost = baseUrl || "https://pay.qpay.io";
    return `${baseHost}/p/${slug}`;
  }
}
