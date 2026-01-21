/**
 * Database schema types for Q Pay
 * All types align with Supabase PostgreSQL schema
 */

export type BusinessType = "sme" | "enterprise";
export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";
export type TransactionType = "payment" | "settlement" | "refund";

/**
 * Business Profile
 */
export interface Business {
  id: string;
  user_id: string;
  name: string;
  type: BusinessType; // 'sme' or 'enterprise'
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  industry: string;
  country: string;
  region?: string;
  
  // Compliance & KYC
  kyc_status: "pending" | "verified" | "rejected";
  kyc_document_url?: string;
  aml_check_status: "pending" | "passed" | "failed";
  
  // API Keys
  api_key?: string;
  api_secret?: string;
  
  // Settings
  webhook_url?: string;
  settlement_frequency: "daily" | "weekly" | "monthly";
  settlement_currency: string;
  
  // Verification
  verified_email: boolean;
  verified_phone: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  onboarded_at?: string;
  
  // Pricing tier
  pricing_tier: "starter" | "professional" | "enterprise";
  max_monthly_volume?: number; // in cents
  transaction_fee_percent: number;
}

/**
 * Business User
 */
export interface BusinessUser {
  id: string;
  business_id: string;
  email: string;
  full_name: string;
  role: "admin" | "accountant" | "viewer";
  permissions: string[];
  verified_email: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

/**
 * Payment Request/Invoice
 */
export interface PaymentRequest {
  id: string;
  business_id: string;
  customer_id?: string;
  amount: number; // in cents
  currency: string;
  description: string;
  status: PaymentStatus;
  blockchain_network: string; // 'bitcoin', 'ethereum', 'polygon', etc.
  wallet_address?: string;
  payment_hash?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  completed_at?: string;
}

/**
 * Transaction Record
 */
export interface Transaction {
  id: string;
  business_id: string;
  payment_request_id?: string;
  type: TransactionType;
  amount: number; // in cents
  currency: string;
  fee: number; // in cents
  blockchain_hash?: string;
  status: PaymentStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Business Analytics
 */
export interface BusinessAnalytics {
  id: string;
  business_id: string;
  date: string;
  total_transactions: number;
  total_amount: number; // in cents
  total_fees: number; // in cents
  successful_transactions: number;
  failed_transactions: number;
  average_transaction_size: number; // in cents
  unique_customers: number;
  created_at: string;
}

/**
 * AI Agent Log
 */
export interface AIAgentLog {
  id: string;
  business_id: string;
  agent_name: string;
  action_type: string;
  status: "success" | "failed" | "pending";
  description: string;
  result?: Record<string, unknown>;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * System Configuration
 */
export interface SystemConfig {
  id: string;
  key: string;
  value: string | number | boolean;
  description?: string;
  updated_at: string;
}

/**
 * Database Responses
 */
export interface RegisterBusinessRequest {
  name: string;
  type: BusinessType;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  industry: string;
  country: string;
  region?: string;
  settlement_currency: string;
  settlement_frequency: "daily" | "weekly" | "monthly";
  full_name: string; // Primary contact person
}

export interface RegisterBusinessResponse {
  success: boolean;
  business_id?: string;
  api_key?: string;
  message: string;
}

export interface BusinessStatsResponse {
  total_revenue: number; // in cents
  total_transactions: number;
  active_customers: number;
  kyc_status: string;
  next_settlement: string;
  monthly_volume_remaining?: number; // in cents
}
