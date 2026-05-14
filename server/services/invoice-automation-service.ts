import Database from "../database/client";

export interface InvoiceSequenceConfig {
  sequence_type?: string;
  prefix?: string;
  padding_digits?: number;
  format_template?: string;
}

export class InvoiceAutomationService {
  /**
   * Initialize invoice sequence for merchant
   */
  static async initializeSequence(
    merchantId: string,
    config: InvoiceSequenceConfig = {}
  ) {
    const existingSequence = await Database.getOne(
      `SELECT * FROM invoice_sequences 
       WHERE merchant_id = $1 AND sequence_type = $2`,
      [merchantId, config.sequence_type || "general"]
    );

    if (existingSequence) {
      return existingSequence;
    }

    return await Database.insert("invoice_sequences", {
      merchant_id: merchantId,
      sequence_type: config.sequence_type || "general",
      prefix: config.prefix || "INV",
      next_number: 1,
      padding_digits: config.padding_digits || 6,
      format_template: config.format_template || "{prefix}-{sequence}",
    });
  }

  /**
   * Generate next invoice number with allocation/sequence number
   */
  static async generateInvoiceNumber(
    merchantId: string,
    sequenceType: string = "general"
  ): Promise<{ invoice_number: string; next_sequence: number }> {
    // Use transaction to ensure atomicity
    return await Database.transaction(async (client) => {
      // Lock and get current sequence
      const sequence = await client.query(
        `SELECT * FROM invoice_sequences 
         WHERE merchant_id = $1 AND sequence_type = $2
         FOR UPDATE`,
        [merchantId, sequenceType]
      );

      if (!sequence.rows.length) {
        throw new Error("Invoice sequence not initialized");
      }

      const seq = sequence.rows[0];
      const nextNumber = seq.next_number + 1;

      // Update sequence
      await client.query(
        `UPDATE invoice_sequences 
         SET next_number = $1 
         WHERE merchant_id = $2 AND sequence_type = $3`,
        [nextNumber, merchantId, sequenceType]
      );

      // Generate invoice number with padding
      const paddedNumber = String(seq.next_number).padStart(seq.padding_digits, "0");
      const invoiceNumber = seq.format_template
        .replace("{prefix}", seq.prefix || "INV")
        .replace("{sequence}", paddedNumber);

      return {
        invoice_number: invoiceNumber,
        next_sequence: seq.next_number,
      };
    });
  }

  /**
   * Create invoice job for transaction
   */
  static async createInvoiceJob(
    merchantId: string,
    transactionId: string,
    sequenceType: string = "general"
  ) {
    // Generate invoice number
    const { invoice_number } = await this.generateInvoiceNumber(
      merchantId,
      sequenceType
    );

    // Create job
    const job = await Database.insert("invoice_jobs", {
      merchant_id: merchantId,
      transaction_id: transactionId,
      invoice_number,
      status: "pending",
    });

    return job;
  }

  /**
   * Update invoice job status
   */
  static async updateJobStatus(
    jobId: string,
    status: "pending" | "generating" | "generated" | "sending" | "sent" | "failed",
    metadata: Record<string, any> = {}
  ) {
    const updates: any = { status };

    if (status === "generated") {
      updates.invoice_url = metadata.invoice_url;
      updates.pdf_hash = metadata.pdf_hash;
      updates.signed_hash = metadata.signed_hash;
    }

    if (status === "sent") {
      updates.sent_at = new Date();
      updates.send_method = metadata.send_method;
      updates.recipient_email = metadata.recipient_email;
      updates.recipient_phone = metadata.recipient_phone;
    }

    const setClauses = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(", ");

    return await Database.update(
      `UPDATE invoice_jobs SET ${setClauses} WHERE id = $1 RETURNING *`,
      [jobId, ...Object.values(updates)]
    );
  }

  /**
   * Get invoice job by transaction ID
   */
  static async getInvoiceJobByTransaction(transactionId: string) {
    return await Database.getOne(
      `SELECT * FROM invoice_jobs WHERE transaction_id = $1`,
      [transactionId]
    );
  }

  /**
   * Get pending invoice jobs for processing
   */
  static async getPendingJobs(limit = 100) {
    return await Database.getMany(
      `SELECT ij.*, t.merchant_id, t.amount_cents, t.currency
       FROM invoice_jobs ij
       JOIN transactions t ON ij.transaction_id = t.id
       WHERE ij.status IN ('pending', 'generating')
       ORDER BY ij.created_at ASC
       LIMIT $1`,
      [limit]
    );
  }

  /**
   * Get invoice jobs for merchant
   */
  static async getMerchantInvoiceJobs(
    merchantId: string,
    status?: string,
    limit = 50,
    offset = 0
  ) {
    let query = `SELECT * FROM invoice_jobs WHERE merchant_id = $1`;
    const params: any[] = [merchantId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${
      params.length + 2
    }`;

    params.push(limit, offset);

    const jobs = await Database.getMany(query, params);

    const countQuery =
      status && params.length > 1
        ? `SELECT COUNT(*) as count FROM invoice_jobs 
           WHERE merchant_id = $1 AND status = $2`
        : `SELECT COUNT(*) as count FROM invoice_jobs WHERE merchant_id = $1`;

    const total = await Database.getOne(
      countQuery,
      status ? [merchantId, status] : [merchantId]
    );

    return { jobs, total: total?.count || 0 };
  }

  /**
   * Record invoice delivery
   */
  static async recordInvoiceDelivery(jobId: string, method: string, recipient: string) {
    return await this.updateJobStatus(jobId, "sent", {
      send_method: method,
      [method === "email" ? "recipient_email" : "recipient_phone"]: recipient,
    });
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStats(merchantId: string, daysBack = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const stats = await Database.getOne(
      `SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_invoices,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_invoices,
        COUNT(DISTINCT transaction_id) as unique_transactions
       FROM invoice_jobs
       WHERE merchant_id = $1 AND created_at >= $2`,
      [merchantId, startDate]
    );

    return {
      total_generated: stats?.total_invoices || 0,
      successfully_sent: stats?.sent_invoices || 0,
      failed: stats?.failed_invoices || 0,
      unique_transactions: stats?.unique_transactions || 0,
    };
  }

  /**
   * Get invoice details
   */
  static async getInvoiceDetails(jobId: string) {
    const job = await Database.getOne(
      `SELECT ij.*, t.amount_cents, t.currency, t.status as transaction_status,
              t.customer_email, t.created_at as transaction_date
       FROM invoice_jobs ij
       LEFT JOIN transactions t ON ij.transaction_id = t.id
       WHERE ij.id = $1`,
      [jobId]
    );

    return job;
  }
}
