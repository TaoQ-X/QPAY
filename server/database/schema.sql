-- QPay Production Database Schema
-- PostgreSQL 14+

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'deleted')),
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_token (token)
);

-- ============================================================================
-- MERCHANTS & BUSINESS
-- ============================================================================

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  industry VARCHAR(100),
  website VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'rejected', 'deleted')),
  tier VARCHAR(50) DEFAULT 'sme' CHECK (tier IN ('sme', 'mid-market', 'enterprise')),
  monthly_processing_limit DECIMAL(15,2),
  kyc_status VARCHAR(50) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  kyc_verified_at TIMESTAMP,
  pci_dss_certified BOOLEAN DEFAULT false,
  emv_compliant BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_owner_id (owner_id),
  INDEX idx_status (status),
  INDEX idx_kyc_status (kyc_status)
);

CREATE TABLE merchant_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  address_type VARCHAR(50) DEFAULT 'business',
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country_code VARCHAR(2),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_id (merchant_id)
);

CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  account_holder_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) CHECK (account_type IN ('checking', 'savings')),
  routing_number VARCHAR(20),
  account_number_encrypted VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255),
  swift_code VARCHAR(20),
  iban VARCHAR(50),
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_verified (verified)
);

-- ============================================================================
-- API KEYS & SECURITY
-- ============================================================================

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  permissions TEXT[],
  environment VARCHAR(50) DEFAULT 'test' CHECK (environment IN ('test', 'live')),
  ip_whitelist TEXT[],
  rate_limit INT DEFAULT 1000,
  last_used TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status)
);

-- ============================================================================
-- TERMINALS & DEVICES
-- ============================================================================

CREATE TABLE terminals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  terminal_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'offline')),
  model VARCHAR(100),
  serial_number VARCHAR(100) UNIQUE,
  firmware_version VARCHAR(50),
  emv_level VARCHAR(5) CHECK (emv_level IN ('L1', 'L2', 'L3')),
  emv_certified BOOLEAN DEFAULT true,
  battery_level INT,
  location_address VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  last_heartbeat TIMESTAMP,
  transaction_count INT DEFAULT 0,
  total_volume DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status),
  INDEX idx_terminal_id (terminal_id)
);

-- ============================================================================
-- TRANSACTIONS
-- ============================================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  terminal_id UUID REFERENCES terminals(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50) CHECK (payment_method IN ('emv_chip', 'contactless', 'online_3ds', 'manual')),
  card_brand VARCHAR(50),
  card_last_four VARCHAR(4),
  card_token_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'declined', 'refunded', 'disputed')),
  authorization_code VARCHAR(50),
  transaction_ref VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  risk_score INT DEFAULT 0,
  fraud_flags TEXT[],
  three_ds_verified BOOLEAN DEFAULT false,
  pin_verified BOOLEAN DEFAULT false,
  emv_verified BOOLEAN DEFAULT false,
  receipt_number VARCHAR(100),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  settlement_date TIMESTAMP,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_terminal_id (terminal_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_stripe_charge_id (stripe_charge_id),
  INDEX idx_transaction_ref (transaction_ref)
);

-- ============================================================================
-- SETTLEMENTS & PAYOUTS
-- ============================================================================

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  settlement_date DATE NOT NULL,
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  gross_volume DECIMAL(15,2) NOT NULL,
  fee_amount DECIMAL(15,2) NOT NULL,
  net_volume DECIMAL(15,2) NOT NULL,
  transaction_count INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  bank_account_id UUID REFERENCES bank_accounts(id),
  payout_reference VARCHAR(255),
  stripe_payout_id VARCHAR(255),
  ach_trace_id VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status),
  INDEX idx_settlement_date (settlement_date)
);

CREATE TABLE settlement_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_id UUID NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  amount DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_settlement_id (settlement_id),
  INDEX idx_transaction_id (transaction_id)
);

-- ============================================================================
-- FEES & PRICING
-- ============================================================================

CREATE TABLE fee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL,
  transaction_fee_percent DECIMAL(5,2),
  transaction_fee_fixed DECIMAL(10,2),
  monthly_flat_fee DECIMAL(15,2),
  chargeback_fee DECIMAL(15,2),
  refund_fee_percent DECIMAL(5,2),
  international_card_fee DECIMAL(5,2),
  effective_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_tier (tier)
);

-- ============================================================================
-- REFUNDS & DISPUTES
-- ============================================================================

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  stripe_refund_id VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status)
);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  amount DECIMAL(15,2) NOT NULL,
  reason VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'won', 'lost', 'resolved')),
  stripe_dispute_id VARCHAR(255),
  evidence_file_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status)
);

-- ============================================================================
-- ALERTS & NOTIFICATIONS
-- ============================================================================

CREATE TABLE alert_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  name VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  triggers JSONB,
  notification_channels JSONB,
  recipients JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_id (merchant_id)
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  type VARCHAR(50),
  severity VARCHAR(50) CHECK (severity IN ('info', 'warning', 'critical')),
  title VARCHAR(255),
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  sms_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_read (read),
  INDEX idx_created_at (created_at)
);

-- ============================================================================
-- INVOICES
-- ============================================================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'sent', 'viewed', 'paid')),
  digital_signature VARCHAR(500),
  pdf_url VARCHAR(500),
  items JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  paid_at TIMESTAMP,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status),
  INDEX idx_invoice_number (invoice_number)
);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  merchant_id UUID REFERENCES merchants(id),
  action VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_created_at (created_at),
  INDEX idx_action (action)
);

-- ============================================================================
-- WEBHOOKS
-- ============================================================================

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  events TEXT[] NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'failed')),
  secret_key VARCHAR(255),
  last_triggered TIMESTAMP,
  failed_attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_id (merchant_id),
  INDEX idx_status (status)
);

CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100),
  payload JSONB,
  response_status INT,
  response_body TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_webhook_id (webhook_id),
  INDEX idx_created_at (created_at)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_transactions_merchant_date ON transactions(merchant_id, created_at DESC);
CREATE INDEX idx_transactions_status_date ON transactions(status, created_at DESC);
CREATE INDEX idx_settlements_merchant_date ON settlements(merchant_id, settlement_date DESC);
CREATE INDEX idx_notifications_merchant_unread ON notifications(merchant_id, read, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update user.updated_at on change
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_user_timestamp();

-- Update merchant.updated_at on change
CREATE OR REPLACE FUNCTION update_merchant_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER merchant_updated_at BEFORE UPDATE ON merchants
FOR EACH ROW EXECUTE FUNCTION update_merchant_timestamp();

-- Update alert_configurations.updated_at on change
CREATE OR REPLACE FUNCTION update_alert_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_config_updated_at BEFORE UPDATE ON alert_configurations
FOR EACH ROW EXECUTE FUNCTION update_alert_config_timestamp();

-- ============================================================================
-- PAYMENT LINKS & DYNAMIC CHECKOUT
-- ============================================================================

CREATE TABLE payment_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',
  is_variable_amount BOOLEAN DEFAULT false,
  min_amount_cents INTEGER,
  max_amount_cents INTEGER,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  theme_color VARCHAR(7),
  custom_message TEXT,
  redirect_url VARCHAR(500),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  INDEX idx_merchant_status (merchant_id, status),
  INDEX idx_slug (slug),
  INDEX idx_expires_at (expires_at)
);

CREATE TABLE payment_link_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_link_id UUID NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  payer_email VARCHAR(255),
  payer_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_link_id (payment_link_id),
  INDEX idx_transaction_id (transaction_id)
);

-- ============================================================================
-- INVOICE AUTOMATION & SEQUENCES
-- ============================================================================

CREATE TABLE invoice_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  sequence_type VARCHAR(50) NOT NULL DEFAULT 'general',
  prefix VARCHAR(20),
  next_number BIGINT DEFAULT 1,
  padding_digits INTEGER DEFAULT 6,
  format_template VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_sequence (merchant_id, sequence_type),
  UNIQUE (merchant_id, sequence_type)
);

CREATE TABLE invoice_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'sending', 'sent', 'failed')),
  invoice_url VARCHAR(500),
  send_method VARCHAR(50),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  pdf_hash VARCHAR(64),
  signed_hash VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  INDEX idx_merchant_status (merchant_id, status),
  INDEX idx_transaction_id (transaction_id)
);

-- ============================================================================
-- CUSTOMER PAYMENT METHODS
-- ============================================================================

CREATE TABLE customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_identifier VARCHAR(255) NOT NULL,
  card_token VARCHAR(255),
  card_brand VARCHAR(20),
  card_last_four VARCHAR(4),
  card_expiry_month INTEGER,
  card_expiry_year INTEGER,
  is_primary BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalid', 'archived')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_customer (merchant_id, customer_identifier),
  INDEX idx_merchant_primary (merchant_id, is_primary),
  UNIQUE (merchant_id, customer_identifier, card_token)
);

-- ============================================================================
-- CARD UPDATER EVENTS
-- ============================================================================

CREATE TABLE card_updater_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES customer_payment_methods(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('card_updated', 'card_expired', 'card_closed', 'reconciliation')),
  old_card_hash VARCHAR(64),
  new_card_hash VARCHAR(64),
  new_expiry_month INTEGER,
  new_expiry_year INTEGER,
  processor_response JSONB,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  INDEX idx_merchant_status (merchant_id, status),
  INDEX idx_payment_method_id (payment_method_id),
  INDEX idx_event_type (event_type)
);

-- ============================================================================
-- REPORT JOBS & SCHEDULING
-- ============================================================================

CREATE TABLE report_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(20),
  format VARCHAR(20) DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv', 'json', 'email')),
  include_data JSONB,
  schedule_cron VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  last_sent_at TIMESTAMP,
  next_scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_merchant_status (merchant_id, status),
  INDEX idx_next_scheduled (next_scheduled_at)
);

-- ============================================================================
-- WHITELIST & LINK METRICS
-- ============================================================================

CREATE TABLE payment_link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_link_id UUID NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referer VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_link_id (payment_link_id),
  INDEX idx_created_at (created_at)
);

-- Update payment_links.updated_at on change
CREATE OR REPLACE FUNCTION update_payment_links_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_links_updated_at BEFORE UPDATE ON payment_links
FOR EACH ROW EXECUTE FUNCTION update_payment_links_timestamp();

-- Update invoice_sequences.updated_at on change
CREATE OR REPLACE FUNCTION update_invoice_sequences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_sequences_updated_at BEFORE UPDATE ON invoice_sequences
FOR EACH ROW EXECUTE FUNCTION update_invoice_sequences_timestamp();

-- Update customer_payment_methods.updated_at on change
CREATE OR REPLACE FUNCTION update_payment_methods_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_updated_at BEFORE UPDATE ON customer_payment_methods
FOR EACH ROW EXECUTE FUNCTION update_payment_methods_timestamp();

-- Update report_jobs.updated_at on change
CREATE OR REPLACE FUNCTION update_report_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER report_jobs_updated_at BEFORE UPDATE ON report_jobs
FOR EACH ROW EXECUTE FUNCTION update_report_jobs_timestamp();
