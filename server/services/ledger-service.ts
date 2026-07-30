import Database from "../database/client";

export type LedgerEntryType = "payment" | "fee" | "refund" | "chargeback" | "payout" | "adjustment";

export interface LedgerEntryInput {
  businessId: string;
  transactionId?: string;
  type: LedgerEntryType;
  amountCents: number;
  currency: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/** Records append-only accounting entries used by settlement and reconciliation. */
export const ledgerService = {
  async record(input: LedgerEntryInput) {
    return Database.insert("ledger_entries", {
      id: `led_${crypto.randomUUID()}`,
      business_id: input.businessId,
      transaction_id: input.transactionId || null,
      entry_type: input.type,
      amount_cents: input.amountCents,
      currency: input.currency.toUpperCase(),
      description: input.description,
      metadata: input.metadata || {},
      created_at: new Date().toISOString(),
    });
  },

  async listForBusiness(businessId: string, limit = 100, offset = 0) {
    return Database.getMany(
      `SELECT * FROM ledger_entries
       WHERE business_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [businessId, Math.min(Math.max(limit, 1), 500), Math.max(offset, 0)]
    );
  },
};
