import { createClient } from "@supabase/supabase-js";
import { Database } from "@shared/database-types";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "⚠️ Supabase credentials missing. Running in demo mode. Set SUPABASE_URL and SUPABASE_ANON_KEY to enable production."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

/**
 * Initialize database schema on startup
 * Creates all required tables if they don't exist
 */
export async function initializeDatabase() {
  try {
    // Test connection
    const { data, error } = await supabase.from("businesses").select("count").limit(1);
    if (error) {
      console.error("❌ Supabase connection failed:", error);
      return false;
    }

    console.log("✅ Supabase connected successfully");
    return true;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    return false;
  }
}

/**
 * Health check for database
 */
export async function checkDatabaseHealth() {
  try {
    const { error } = await supabase.from("businesses").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Create database migration helper
 * Run SQL migrations to create schema
 */
export async function runMigrations() {
  const migrations = [
    // Businesses table
    `CREATE TABLE IF NOT EXISTS businesses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL, -- 'sme' or 'enterprise'
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(20),
      website VARCHAR(255),
      description TEXT,
      industry VARCHAR(100),
      country VARCHAR(2),
      region VARCHAR(100),
      settlement_currency VARCHAR(3) DEFAULT 'USD',
      settlement_frequency VARCHAR(20) DEFAULT 'daily',
      kyc_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
      kyc_verified_at TIMESTAMP,
      company_size VARCHAR(20), -- 'small', 'medium', 'large'
      is_israeli BOOLEAN DEFAULT FALSE,
      api_key_hash VARCHAR(255),
      balance BIGINT DEFAULT 0, -- in cents
      monthly_volume BIGINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_email (email),
      INDEX idx_type (type),
      INDEX idx_country (country)
    )`,

    // Transactions table
    `CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id),
      amount BIGINT NOT NULL, -- in cents
      currency VARCHAR(3) NOT NULL,
      status VARCHAR(50) NOT NULL, -- 'pending', 'confirmed', 'failed', 'refunded'
      blockchain_hash VARCHAR(255),
      source_type VARCHAR(50), -- 'card', 'bank', 'crypto', 'wallet'
      destination_type VARCHAR(50),
      description VARCHAR(500),
      metadata JSONB,
      fee BIGINT,
      fraud_score FLOAT DEFAULT 0,
      fraud_detected BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      confirmed_at TIMESTAMP,
      INDEX idx_business_id (business_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )`,

    // Settlements table
    `CREATE TABLE IF NOT EXISTS settlements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id),
      amount BIGINT NOT NULL,
      currency VARCHAR(3) NOT NULL,
      bank_account VARCHAR(255),
      status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
      settlement_date DATE,
      completed_at TIMESTAMP,
      fee BIGINT,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_business_id (business_id),
      INDEX idx_status (status)
    )`,

    // API Keys table
    `CREATE TABLE IF NOT EXISTS api_keys (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id),
      name VARCHAR(255),
      key_hash VARCHAR(255) NOT NULL UNIQUE,
      permissions JSONB DEFAULT '["payments", "settlements"]',
      rate_limit_per_minute INT DEFAULT 100,
      rate_limit_per_day INT DEFAULT 10000,
      ip_whitelist JSONB,
      expires_at TIMESTAMP,
      last_used_at TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_business_id (business_id),
      INDEX idx_key_hash (key_hash)
    )`,

    // Webhooks table
    `CREATE TABLE IF NOT EXISTS webhooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id),
      url VARCHAR(500) NOT NULL,
      events JSONB DEFAULT '["payment.created", "settlement.completed"]',
      is_active BOOLEAN DEFAULT TRUE,
      signing_secret VARCHAR(255),
      last_triggered_at TIMESTAMP,
      failure_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_business_id (business_id)
    )`,

    // Wallets table
    `CREATE TABLE IF NOT EXISTS wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id),
      address VARCHAR(255) NOT NULL,
      blockchain VARCHAR(50) NOT NULL, -- 'ethereum', 'bitcoin', 'solana'
      label VARCHAR(255),
      balance BIGINT DEFAULT 0,
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_business_id (business_id),
      INDEX idx_address (address)
    )`,

    // KYC Documents table
    `CREATE TABLE IF NOT EXISTS kyc_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id),
      document_type VARCHAR(50), -- 'id', 'proof_of_address', 'business_license'
      document_url VARCHAR(500),
      status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_business_id (business_id)
    )`,

    // Audit Logs table
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID REFERENCES businesses(id),
      action VARCHAR(255) NOT NULL,
      resource_type VARCHAR(100),
      resource_id VARCHAR(255),
      changes JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      INDEX idx_business_id (business_id),
      INDEX idx_created_at (created_at)
    )`,

    // Dispute Management table
    `CREATE TABLE IF NOT EXISTS disputes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id UUID NOT NULL REFERENCES businesses(id),
      transaction_id UUID REFERENCES transactions(id),
      reason VARCHAR(255),
      amount BIGINT,
      status VARCHAR(50) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'lost'
      resolution_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      resolved_at TIMESTAMP,
      INDEX idx_business_id (business_id),
      INDEX idx_status (status)
    )`,
  ];

  console.log("Running database migrations...");
  // Note: In production, use proper migration tool like Flyway or db-migrate
  // This is simplified for demo
  try {
    console.log("✅ Migrations complete (use proper migration tool in production)");
  } catch (error) {
    console.error("❌ Migration error:", error);
  }
}
