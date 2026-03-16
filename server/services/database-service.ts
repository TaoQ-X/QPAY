import { supabase } from "@server/modules/supabase-client";
import {
  Database,
} from "@shared/database-types";
import AdvancedEncryptionService from "@server/modules/advanced-encryption";

type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"];
type ApiKeyRow = Database["public"]["Tables"]["api_keys"]["Row"];
type WebhookRow = Database["public"]["Tables"]["webhooks"]["Row"];
type WalletRow = Database["public"]["Tables"]["wallets"]["Row"];

export class DatabaseService {
  private encryption: AdvancedEncryptionService;

  constructor() {
    this.encryption = new AdvancedEncryptionService();
  }

  // ============================================================================
  // BUSINESS OPERATIONS
  // ============================================================================

  /**
   * Create a new business
   */
  async createBusiness(data: {
    name: string;
    type: "sme" | "enterprise";
    email: string;
    country?: string;
    settlement_currency?: string;
    company_size?: string;
    is_israeli?: boolean;
  }) {
    try {
      const { data: business, error } = await supabase
        .from("businesses")
        .insert([
          {
            name: data.name,
            type: data.type,
            email: data.email,
            country: data.country,
            settlement_currency: data.settlement_currency || "USD",
            company_size: data.company_size,
            is_israeli: data.is_israeli || false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: business };
    } catch (error) {
      console.error("Error creating business:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get business by ID
   */
  async getBusinessById(businessId: string) {
    try {
      const { data: business, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

      if (error) throw error;

      // Mask sensitive data for API responses
      return {
        success: true,
        data: {
          ...business,
          api_key_hash: business.api_key_hash
            ? this.encryption.maskSensitiveData(business.api_key_hash, "pan")
            : null,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update business
   */
  async updateBusiness(businessId: string, updates: Partial<BusinessRow>) {
    try {
      const { data: business, error } = await supabase
        .from("businesses")
        .update(updates)
        .eq("id", businessId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: business };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify KYC status
   */
  async updateKYCStatus(
    businessId: string,
    status: "pending" | "verified" | "rejected"
  ) {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .update({
          kyc_status: status,
          kyc_verified_at: status === "verified" ? new Date().toISOString() : null,
        })
        .eq("id", businessId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // TRANSACTION OPERATIONS
  // ============================================================================

  /**
   * Create transaction
   */
  async createTransaction(data: {
    business_id: string;
    amount: number;
    currency: string;
    status: string;
    source_type?: string;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert([
          {
            business_id: data.business_id,
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            source_type: data.source_type,
            description: data.description,
            metadata: data.metadata,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: transaction };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string) {
    try {
      const { data: transaction, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .single();

      if (error) throw error;

      return { success: true, data: transaction };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List transactions for business
   */
  async listTransactions(businessId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data: transactions, error, count } = await supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: transactions,
        total: count,
        limit,
        offset,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: "pending" | "confirmed" | "failed" | "refunded"
  ) {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .update({
          status,
          confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
        })
        .eq("id", transactionId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // SETTLEMENT OPERATIONS
  // ============================================================================

  /**
   * Create settlement
   */
  async createSettlement(data: {
    business_id: string;
    amount: number;
    currency: string;
    bank_account?: string;
    fee?: number;
  }) {
    try {
      const { data: settlement, error } = await supabase
        .from("settlements")
        .insert([
          {
            business_id: data.business_id,
            amount: data.amount,
            currency: data.currency,
            bank_account: data.bank_account,
            fee: data.fee,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: settlement };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get settlement by ID
   */
  async getSettlementById(settlementId: string) {
    try {
      const { data: settlement, error } = await supabase
        .from("settlements")
        .select("*")
        .eq("id", settlementId)
        .single();

      if (error) throw error;

      return { success: true, data: settlement };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List settlements for business
   */
  async listSettlements(businessId: string, limit: number = 50, offset: number = 0) {
    try {
      const { data: settlements, error, count } = await supabase
        .from("settlements")
        .select("*", { count: "exact" })
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: settlements,
        total: count,
        limit,
        offset,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // API KEY OPERATIONS
  // ============================================================================

  /**
   * Create API key
   */
  async createApiKey(data: {
    business_id: string;
    name: string;
    permissions?: string[];
    rate_limit_per_minute?: number;
    rate_limit_per_day?: number;
  }) {
    try {
      const { data: apiKey, error } = await supabase
        .from("api_keys")
        .insert([
          {
            business_id: data.business_id,
            name: data.name,
            key_hash: this.encryption.generateSecureToken(32),
            permissions: data.permissions || ["payments", "settlements"],
            rate_limit_per_minute: data.rate_limit_per_minute || 100,
            rate_limit_per_day: data.rate_limit_per_day || 10000,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: apiKey };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List API keys for business
   */
  async listApiKeys(businessId: string) {
    try {
      const { data: apiKeys, error } = await supabase
        .from("api_keys")
        .select("id, name, permissions, is_active, created_at, last_used_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { success: true, data: apiKeys };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // WALLET OPERATIONS
  // ============================================================================

  /**
   * Create wallet
   */
  async createWallet(data: {
    business_id: string;
    address: string;
    blockchain: "ethereum" | "bitcoin" | "solana";
    label?: string;
  }) {
    try {
      const { data: wallet, error } = await supabase
        .from("wallets")
        .insert([
          {
            business_id: data.business_id,
            address: data.address,
            blockchain: data.blockchain,
            label: data.label,
            verified: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: wallet };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get wallet by address
   */
  async getWalletByAddress(address: string) {
    try {
      const { data: wallet, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("address", address)
        .single();

      if (error) throw error;

      return { success: true, data: wallet };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  /**
   * Log audit event
   */
  async logAuditEvent(data: {
    business_id?: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    changes?: Record<string, any>;
    ip_address?: string;
  }) {
    try {
      await supabase.from("audit_logs").insert([
        {
          business_id: data.business_id,
          action: data.action,
          resource_type: data.resource_type,
          resource_id: data.resource_id,
          changes: data.changes,
          ip_address: data.ip_address,
        },
      ]);

      return { success: true };
    } catch (error) {
      console.error("Error logging audit event:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get audit logs for business
   */
  async getAuditLogs(businessId: string, limit: number = 100) {
    try {
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: logs };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  /**
   * Get business analytics
   */
  async getBusinessAnalytics(businessId: string) {
    try {
      // Get total revenue
      const { data: revenueTxns } = await supabase
        .from("transactions")
        .select("amount")
        .eq("business_id", businessId)
        .eq("status", "confirmed");

      const totalRevenue = revenueTxns?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Get transaction count
      const { count: txnCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("business_id", businessId);

      // Get next settlement date
      const { data: nextSettlement } = await supabase
        .from("settlements")
        .select("settlement_date")
        .eq("business_id", businessId)
        .eq("status", "pending")
        .order("settlement_date", { ascending: true })
        .limit(1)
        .single();

      return {
        success: true,
        data: {
          total_revenue: totalRevenue,
          total_transactions: txnCount || 0,
          active_customers: Math.floor((txnCount || 0) * 0.7), // Estimate
          kyc_status: "verified",
          next_settlement: nextSettlement?.settlement_date
            ? new Date(nextSettlement.settlement_date).toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          monthly_volume_remaining: 5000000, // $50,000
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default DatabaseService;
