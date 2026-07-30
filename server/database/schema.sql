-- QPay Payment Processor Database Schema
-- Comprehensive schema for enterprise-grade payment processing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS business_users (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- admin, staff, viewer
  permissions TEXT[], -- JSON array of permissions
  verified_email BOOLEAN DEFAULT FALSE,
  verified_phone BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  refresh_token TEXT NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES business_users(id)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES business_users(id)
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES business_users(id)
);

-- ============================================
-- BUSINESSES & MERCHANTS
-- ============================================

CREATE TABLE IF NOT EXISTS businesses (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- sme, enterprise
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  description TEXT,
  logo_url VARCHAR(255),
  industry VARCHAR(100),
  country VARCHAR(2),
  region VARCHAR(100),
  
  -- Compliance
  kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  kyc_document_url VARCHAR(255),
  aml_check_status VARCHAR(50) DEFAULT 'pending', -- pending, passed, failed
  
  -- API & Settings
  api_key VARCHAR(255) UNIQUE,
  api_secret_hash VARCHAR(255),
  webhook_url VARCHAR(255),
  webhook_secret_hash VARCHAR(255),
  
  -- Settlement
  settlement_frequency VARCHAR(50) DEFAULT 'daily', -- daily, weekly, monthly
  settlement_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Verification
  verified_email BOOLEAN DEFAULT FALSE,
  verified_phone BOOLEAN DEFAULT FALSE,
  
  -- Pricing & Limits
  pricing_tier VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
  max_monthly_volume BIGINT, -- in cents
  transaction_fee_percent DECIMAL(5,2) DEFAULT 2.90,
  refund_fee_percent DECIMAL(5,2) DEFAULT 0,
  chargeback_fee_cents BIGINT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  onboarded_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(255) NOT NULL,
  routing_number VARCHAR(50),
  bank_name VARCHAR(255),
  swift_code VARCHAR(11),
  iban VARCHAR(34),
  country VARCHAR(2),
  currency VARCHAR(3),
  account_type VARCHAR(50), -- checking, savings
  is_primary BOOLEAN DEFAULT FALSE,
  verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50), -- micro_deposits, instant
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_preview VARCHAR(20),
  permissions TEXT[], -- JSON array
  ip_whitelist TEXT[], -- JSON array of IPs
  rate_limit_per_hour INT DEFAULT 10000,
  rate_limit_per_day INT DEFAULT 100000,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- ============================================
-- PAYMENTS & TRANSACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  customer_id VARCHAR(255),
  payment_method_id VARCHAR(255),
  
  -- Amount & Currency
  amount_cents BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Payment Details
  type VARCHAR(50) NOT NULL, -- payment, refund, chargeback, adjustment
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
  payment_method VARCHAR(50), -- card, bank_transfer, wallet, etc
  card_brand VARCHAR(50),
  card_last_four VARCHAR(4),
  card_country VARCHAR(2),
  
  -- 3DS/Authentication
  three_ds_status VARCHAR(50), -- required, attempted, authenticated, not_required
  
  -- Fraud & Risk
  fraud_score DECIMAL(3,2),
  fraud_status VARCHAR(50), -- passed, review, blocked
  risk_level VARCHAR(50), -- low, medium, high
  
  -- Stripe/Processor Details
  processor VARCHAR(50) DEFAULT 'stripe', -- stripe, wise, etc
  processor_transaction_id VARCHAR(255),
  processor_charge_id VARCHAR(255),
  
  -- Idempotency
  idempotency_key VARCHAR(255),
  
  -- Metadata & Receipts
  description TEXT,
  receipt_email VARCHAR(255),
  statement_descriptor VARCHAR(22),
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,

  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS refunds (
  id VARCHAR(255) PRIMARY KEY,
  transaction_id VARCHAR(255) NOT NULL,
  business_id VARCHAR(255) NOT NULL,
  amount_cents BIGINT NOT NULL,
  reason VARCHAR(50), -- requested_by_customer, duplicate, fraudulent, etc
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed
  processor_refund_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS disputes (
  id VARCHAR(255) PRIMARY KEY,
  transaction_id VARCHAR(255) NOT NULL,
  business_id VARCHAR(255) NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency VARCHAR(3),
  reason VARCHAR(100), -- chargeback, retrieval_request, etc
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, won, lost, accepted
  evidence_due_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- ============================================
-- CUSTOMER PAYMENT METHODS & CARDS
-- ============================================

CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  customer_id VARCHAR(255),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  
  -- Card Details (tokenized)
  card_token VARCHAR(255), -- Stripe token or vault reference
  card_brand VARCHAR(50), -- visa, mastercard, amex, discover
  card_last_four VARCHAR(4),
  card_expiry_month INT,
  card_expiry_year INT,
  card_country VARCHAR(2),
  card_fingerprint VARCHAR(255) UNIQUE,
  
  -- Bank Account Details (tokenized)
  bank_account_token VARCHAR(255),
  bank_account_last_four VARCHAR(4),
  bank_name VARCHAR(255),
  
  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  is_valid BOOLEAN DEFAULT TRUE,
  is_expired BOOLEAN DEFAULT FALSE,
  
  -- Card Updater
  card_updater_status VARCHAR(50), -- active, updated, expired, invalid
  card_updater_last_check TIMESTAMP,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS card_updater_events (
  id VARCHAR(255) PRIMARY KEY,
  payment_method_id VARCHAR(255) NOT NULL,
  business_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50), -- card_expiry_updated, card_closed, new_card_issued
  old_card_last_four VARCHAR(4),
  new_card_last_four VARCHAR(4),
  old_expiry_date VARCHAR(10),
  new_expiry_date VARCHAR(10),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_method FOREIGN KEY (payment_method_id) REFERENCES customer_payment_methods(id),
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- ============================================
-- SETTLEMENTS & PAYOUTS
-- ============================================

CREATE TABLE IF NOT EXISTS settlements (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  settlement_date DATE NOT NULL,
  currency VARCHAR(3),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Amounts (in cents)
  gross_amount_cents BIGINT,
  fees_cents BIGINT,
  chargebacks_cents BIGINT,
  refunds_cents BIGINT,
  net_amount_cents BIGINT,
  
  -- Processor Details
  processor_payout_id VARCHAR(255),
  
  -- Metadata
  transaction_count INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS settlement_details (
  id VARCHAR(255) PRIMARY KEY,
  settlement_id VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255),
  business_id VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- transaction, fee, chargeback, refund, adjustment
  amount_cents BIGINT,
  description VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_settlement FOREIGN KEY (settlement_id) REFERENCES settlements(id),
  CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS payouts (
  id VARCHAR(255) PRIMARY KEY,
  settlement_id VARCHAR(255) NOT NULL,
  business_id VARCHAR(255) NOT NULL,
  bank_account_id VARCHAR(255),
  amount_cents BIGINT NOT NULL,
  currency VARCHAR(3),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_transit, completed, failed, cancelled
  processor_payout_id VARCHAR(255),
  arrival_date DATE,
  failure_code VARCHAR(50),
  failure_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  CONSTRAINT fk_settlement FOREIGN KEY (settlement_id) REFERENCES settlements(id),
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id),
  CONSTRAINT fk_bank_account FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);

-- ============================================
-- PAYMENT LINKS & HOSTED CHECKOUT
-- ============================================

CREATE TABLE IF NOT EXISTS payment_links (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  description TEXT,
  
  -- Amount
  amount_cents BIGINT,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Redirect
  redirect_url VARCHAR(255),
  success_url VARCHAR(255),
  cancel_url VARCHAR(255),
  
  -- Customization
  custom_message TEXT,
  custom_button_text VARCHAR(100),
  branding_logo_url VARCHAR(255),
  
  -- Status & Expiry
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  
  -- Analytics
  created_by_user_id VARCHAR(255),
  total_payments INT DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS payment_link_clicks (
  id VARCHAR(255) PRIMARY KEY,
  payment_link_id VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  referer VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_link FOREIGN KEY (payment_link_id) REFERENCES payment_links(id)
);

CREATE TABLE IF NOT EXISTS payment_link_transactions (
  id VARCHAR(255) PRIMARY KEY,
  payment_link_id VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_link FOREIGN KEY (payment_link_id) REFERENCES payment_links(id),
  CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- ============================================
-- INVOICING & PAYMENT REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS invoice_sequences (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  prefix VARCHAR(50) DEFAULT 'INV',
  current_number BIGINT DEFAULT 1,
  separator VARCHAR(10) DEFAULT '-',
  current_year INT,
  reset_frequency VARCHAR(50) DEFAULT 'yearly', -- yearly, monthly
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(100) UNIQUE,
  customer_id VARCHAR(255),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_address TEXT,
  
  -- Amounts (in cents)
  subtotal_cents BIGINT,
  tax_cents BIGINT DEFAULT 0,
  discount_cents BIGINT DEFAULT 0,
  total_cents BIGINT,
  paid_cents BIGINT DEFAULT 0,
  
  -- Currency & Status
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, paid, overdue, cancelled
  
  -- Dates
  issue_date DATE,
  due_date DATE,
  paid_at TIMESTAMP,
  
  -- Description & Notes
  description TEXT,
  notes TEXT,
  
  -- Line Items (JSON)
  line_items JSONB,
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_cycle VARCHAR(50), -- monthly, quarterly, yearly
  next_invoice_date DATE,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS invoice_jobs (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  invoice_id VARCHAR(255),
  transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, generating, generated, sending, sent, failed
  delivery_method VARCHAR(50), -- email, download, webhook
  recipient_email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id),
  CONSTRAINT fk_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- ============================================
-- WEBHOOKS & NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  url VARCHAR(255) NOT NULL,
  secret_hash VARCHAR(255),
  events TEXT[], -- JSON array of events
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id VARCHAR(255) PRIMARY KEY,
  webhook_endpoint_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100),
  payload JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed
  response_status INT,
  response_body TEXT,
  attempt_count INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_webhook_endpoint FOREIGN KEY (webhook_endpoint_id) REFERENCES webhook_endpoints(id)
);

-- ============================================
-- KYC / AML COMPLIANCE
-- ============================================

CREATE TABLE IF NOT EXISTS kyc_verifications (
  id VARCHAR(255) PRIMARY KEY,
  merchant_id VARCHAR(255),
  business_id VARCHAR(255),
  user_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, additional_docs_requested
  verification_method VARCHAR(50), -- manual, automated, video
  
  -- Personal Information
  full_name VARCHAR(255),
  date_of_birth DATE,
  nationality VARCHAR(2),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2),
  
  -- Identification
  id_type VARCHAR(50), -- passport, drivers_license, national_id
  id_number VARCHAR(100),
  id_issue_date DATE,
  id_expiry_date DATE,
  id_country VARCHAR(2),
  
  -- Documents
  document_urls TEXT[], -- JSON array of S3/upload URLs
  
  -- Review
  reviewed_by_user_id VARCHAR(255),
  review_notes TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES business_users(id)
);

CREATE TABLE IF NOT EXISTS aml_checks (
  id VARCHAR(255) PRIMARY KEY,
  kyc_verification_id VARCHAR(255),
  business_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, passed, failed, review_required
  check_type VARCHAR(50), -- pep, sanctions, adverse_media
  risk_level VARCHAR(50), -- low, medium, high
  matches JSONB, -- Array of matches found
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_kyc_verification FOREIGN KEY (kyc_verification_id) REFERENCES kyc_verifications(id),
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- ============================================
-- FRAUD DETECTION & RISK
-- ============================================

CREATE TABLE IF NOT EXISTS fraud_events (
  id VARCHAR(255) PRIMARY KEY,
  transaction_id VARCHAR(255),
  business_id VARCHAR(255) NOT NULL,
  fraud_score DECIMAL(3,2),
  risk_level VARCHAR(50), -- low, medium, high
  risk_factors TEXT[], -- JSON array
  action_taken VARCHAR(50), -- none, review, block, decline
  status VARCHAR(50) DEFAULT 'open', -- open, reviewed, false_positive, confirmed
  reviewed_by_user_id VARCHAR(255),
  review_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  CONSTRAINT fk_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE TABLE IF NOT EXISTS suspicious_activities (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  activity_type VARCHAR(50), -- velocity, card_testing, refund_abuse, chargebacks
  description TEXT,
  severity VARCHAR(50), -- low, medium, high
  detected_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- ============================================
-- RECURRING PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  customer_id VARCHAR(255),
  payment_method_id VARCHAR(255),
  
  -- Plan Details
  plan_name VARCHAR(255),
  amount_cents BIGINT,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle VARCHAR(50), -- monthly, quarterly, yearly
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, paused, cancelled, expired
  
  -- Dates
  start_date DATE,
  renewal_date DATE,
  cancelled_at TIMESTAMP,
  
  -- Retries & Dunning
  failed_attempt_count INT DEFAULT 0,
  next_retry_date DATE,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);

-- ============================================
-- AUDIT & LOGGING
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255),
  user_id VARCHAR(255),
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_business FOREIGN KEY (business_id) REFERENCES businesses(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES business_users(id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_transactions_business_id ON transactions(business_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_processor_id ON transactions(processor_transaction_id);

CREATE INDEX idx_settlements_business_id ON settlements(business_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_date ON settlements(settlement_date);

CREATE INDEX idx_payment_methods_business_id ON customer_payment_methods(business_id);
CREATE INDEX idx_payment_methods_customer_id ON customer_payment_methods(customer_id);
CREATE INDEX idx_payment_methods_fingerprint ON customer_payment_methods(card_fingerprint);

CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE INDEX idx_webhook_deliveries_endpoint_id ON webhook_deliveries(webhook_endpoint_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);

CREATE INDEX idx_fraud_events_business_id ON fraud_events(business_id);
CREATE INDEX idx_fraud_events_transaction_id ON fraud_events(transaction_id);
CREATE INDEX idx_fraud_events_status ON fraud_events(status);

CREATE INDEX idx_kyc_verifications_business_id ON kyc_verifications(business_id);
CREATE INDEX idx_kyc_verifications_status ON kyc_verifications(status);

CREATE INDEX idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
