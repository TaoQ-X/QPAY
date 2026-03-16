export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          name: string;
          type: "sme" | "enterprise";
          email: string;
          phone: string | null;
          website: string | null;
          description: string | null;
          industry: string | null;
          country: string | null;
          region: string | null;
          settlement_currency: string;
          settlement_frequency: "daily" | "weekly" | "monthly";
          kyc_status: "pending" | "verified" | "rejected";
          kyc_verified_at: string | null;
          company_size: "small" | "medium" | "large" | null;
          is_israeli: boolean;
          api_key_hash: string | null;
          balance: number;
          monthly_volume: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["businesses"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          business_id: string;
          amount: number;
          currency: string;
          status: "pending" | "confirmed" | "failed" | "refunded";
          blockchain_hash: string | null;
          source_type: string | null;
          destination_type: string | null;
          description: string | null;
          metadata: Record<string, any> | null;
          fee: number | null;
          fraud_score: number;
          fraud_detected: boolean;
          created_at: string;
          confirmed_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
      settlements: {
        Row: {
          id: string;
          business_id: string;
          amount: number;
          currency: string;
          bank_account: string | null;
          status: "pending" | "processing" | "completed" | "failed";
          settlement_date: string | null;
          completed_at: string | null;
          fee: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["settlements"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["settlements"]["Insert"]>;
      };
      api_keys: {
        Row: {
          id: string;
          business_id: string;
          name: string | null;
          key_hash: string;
          permissions: string[];
          rate_limit_per_minute: number;
          rate_limit_per_day: number;
          ip_whitelist: string[] | null;
          expires_at: string | null;
          last_used_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["api_keys"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
      };
      webhooks: {
        Row: {
          id: string;
          business_id: string;
          url: string;
          events: string[];
          is_active: boolean;
          signing_secret: string | null;
          last_triggered_at: string | null;
          failure_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["webhooks"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["webhooks"]["Insert"]>;
      };
      wallets: {
        Row: {
          id: string;
          business_id: string;
          address: string;
          blockchain: "ethereum" | "bitcoin" | "solana";
          label: string | null;
          balance: number;
          verified: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["wallets"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["wallets"]["Insert"]>;
      };
      kyc_documents: {
        Row: {
          id: string;
          business_id: string;
          document_type: "id" | "proof_of_address" | "business_license";
          document_url: string | null;
          status: "pending" | "approved" | "rejected";
          verified_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["kyc_documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["kyc_documents"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          business_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          changes: Record<string, any> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
      disputes: {
        Row: {
          id: string;
          business_id: string;
          transaction_id: string | null;
          reason: string | null;
          amount: number | null;
          status: "open" | "investigating" | "resolved" | "lost";
          resolution_notes: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["disputes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["disputes"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
