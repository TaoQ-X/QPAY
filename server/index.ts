import "dotenv/config";
import express from "express";
import cors from "cors";
import Database from "./database/client";
import {
  verifyToken,
  verifyAuth,
  requireMerchant,
  requireUser,
  rateLimitMiddleware,
  corsMiddleware,
  securityHeadersMiddleware,
  requestLoggingMiddleware,
  errorHandlerMiddleware,
} from "./middleware/auth-middleware";
import { requireRole } from "./middleware/rbac";
import { handleProcessPaymentLinkCheckout } from "./routes/checkout-routes";
import {
  handleCreateWebhookEndpoint,
  handleListWebhookEndpoints,
  handleDeleteWebhookEndpoint,
  handleListWebhookDeliveries,
} from "./routes/webhook-routes";
import { handleDemo } from "./routes/demo";
import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout,
  handlePasswordReset,
  handlePasswordResetConfirm,
  handleVerifyEmail,
} from "./routes/auth";
import {
  handleRegisterBusiness,
  handleGetBusinessAnalytics,
  handleListBusinessTransactions,
  handleVerifyEmail as handleVerifyBusinessEmail,
} from "./routes/register-business";
import {
  handleCreateAlertConfig,
  handleGetAlertTemplates,
  handleTriggerAlert,
  handleGetNotificationLog,
  handleCreateInvoice,
  handleSendInvoice,
  handleGetInvoice,
  handleVerifyInvoiceSignature,
  handleGetPOSInvoiceStats,
  handleProcessTerminalTransaction,
  handleGetTerminalConfig,
  handleUpdateTerminalConfig,
  handleGetTerminalStats,
  handlePerformHealthCheck,
  handleGetMerchantTerminals,
  handleGetTerminalTransactions,
  handleGetEMVComplianceReport,
} from "./routes/pos-operations";
import {
  handleProcessEMVTransaction,
  handleTokenizeCard,
  handleInitiate3DSecure,
  handleVerify3DSecure,
  handleProcessContactlessPayment,
  handleCreatePINpadSession,
  handleVerifyPIN,
  handleGetPINpadSession,
  handleGetTransaction,
  handleGetComplianceReport,
} from "./routes/payment-processing";
import {
  handleMerchantOnboarding,
  handleGetMerchantProfile,
  handleUpdateMerchantProfile,
  handleUploadKYCDocuments,
  handleAddBankAccount,
  handleGetAPIKeys,
  handleCreateAPIKey,
  handleRevokeAPIKey,
  handleGetMerchantDashboard,
  handleGetTransactionHistory,
} from "./routes/merchant-management";
import {
  handleCreatePaymentLink,
  handleGetPaymentLinkCheckout,
  handleListPaymentLinks,
  handleGetPaymentLink,
  handleUpdatePaymentLink,
  handleArchivePaymentLink,
  handleGetPaymentLinkAnalytics,
  handleCheckSlugAvailability,
} from "./routes/payment-links-routes";
import {
  handleInitializeInvoiceSequence,
  handleGenerateInvoiceNumber,
  handleCreateInvoiceJob,
  handleGetInvoiceJobByTransaction,
  handleGetMerchantInvoiceJobs,
  handleUpdateInvoiceJobStatus,
  handleRecordInvoiceDelivery,
  handleGetAutomationInvoiceStats,
  handleGetInvoiceDetails,
} from "./routes/invoice-automation-routes";
import {
  handleAddPaymentMethod,
  handleGetPrimaryPaymentMethod,
  handleGetCustomerPaymentMethods,
  handleMarkAsExpired,
  handleMarkAsInvalid,
  handleArchivePaymentMethod,
  handleRecordCardUpdaterEvent,
  handleGetMethodUpdaterHistory,
  handleGetPaymentMethodStats,
  handleCardUpdaterWebhook,
} from "./routes/customer-payment-methods-routes";
import {
  handleSubmitKYC,
  handleGetKYCStatus,
  handleGetAMLHistory,
  handleApproveKYC,
  handleRejectKYC,
  handleRequestAdditionalDocuments,
  handleCheckMerchantVerification,
  handleCheckSuspiciousActivity,
} from "./routes/kyc-aml-routes";
import {
  handleScoreTransaction,
  handleGetFraudStats,
  handleGetHighRiskTransactions,
  handleMarkFraudEvent,
  handleBlockMerchantAccount,
  handleGetFraudRules,
  handleUpdateFraudSettings,
} from "./routes/fraud-detection-routes";
import {
  handleProcessPayment,
  handleRefundTransaction,
  handleGetTransaction as handleGetTransactionDetail,
  handleListTransactions as handleListPaymentTransactions,
  handleReconcile,
  handleExportTransactions,
} from "./routes/transaction-routes";
import {
  handleCalculateSettlement,
  handleProcessPayout,
  handleGetPayoutStatus,
  handleGetSettlementHistory,
  handleGetPayoutSchedule,
  handleGetSettlementDetails,
} from "./routes/settlement-routes";
import { AIAgentManager } from "./ai-agents";

// Initialize AI Agent Manager
const aiAgentManager = new AIAgentManager();

export async function createServer() {
  const app = express();

  // Middleware Stack
  app.use(requestLoggingMiddleware);
  app.use(corsMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(rateLimitMiddleware(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Database health check
  const dbHealthy = await Database.healthCheck();
  if (!dbHealthy) {
    console.warn("Database connection failed - continuing with degraded mode");
  }

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Demo endpoint
  app.get("/api/demo", handleDemo);

  /**
   * AUTHENTICATION ROUTES
   */
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/refresh", handleRefresh);
  app.post("/api/auth/logout", verifyToken, handleLogout);
  app.post("/api/auth/password-reset", handlePasswordReset);
  app.post("/api/auth/password-reset-confirm", handlePasswordResetConfirm);
  app.post("/api/auth/verify-email", handleVerifyEmail);

  // Business Registration API (deprecated - use /api/auth/register)
  app.post("/api/register-business", handleRegisterBusiness);

  // Business Analytics API
  app.get("/api/business/:businessId/analytics", handleGetBusinessAnalytics);

  // List Business Transactions
  app.get("/api/business/:businessId/transactions", handleListBusinessTransactions);

  // Verify Email
  app.post("/api/business/:businessId/verify-email", handleVerifyBusinessEmail);

  /**
   * ALERT & INVOICE API ROUTES
   */

  // Alert Configuration
  app.post("/api/alerts/config", handleCreateAlertConfig);
  app.get("/api/alerts/templates", handleGetAlertTemplates);
  app.post("/api/alerts/trigger", handleTriggerAlert);
  app.get("/api/alerts/log", handleGetNotificationLog);

  // Digital Invoices
  app.post("/api/invoices", handleCreateInvoice);
  app.post("/api/invoices/:invoiceId/send", handleSendInvoice);
  app.get("/api/invoices/:invoiceId", handleGetInvoice);
  app.get("/api/invoices/:invoiceId/verify", handleVerifyInvoiceSignature);
  app.get("/api/invoices/stats", handleGetPOSInvoiceStats);

  /**
   * POS TERMINAL API ROUTES
   */

  // Terminal Operations
  app.post("/api/terminals/transaction", handleProcessTerminalTransaction);
  app.get("/api/terminals/:terminalId/config", handleGetTerminalConfig);
  app.put("/api/terminals/:terminalId/config", handleUpdateTerminalConfig);
  app.get("/api/terminals/:terminalId/stats", handleGetTerminalStats);
  app.get("/api/terminals/:terminalId/health", handlePerformHealthCheck);

  // Merchant Terminal Management
  app.get("/api/merchants/:merchantId/terminals", handleGetMerchantTerminals);
  app.get("/api/terminals/:terminalId/transactions", handleGetTerminalTransactions);
  app.get("/api/merchants/:merchantId/compliance/emv", handleGetEMVComplianceReport);

  /**
   * EMV PAYMENT PROCESSING ROUTES
   */

  // EMV Transactions
  app.post("/api/payments/emv/process", handleProcessEMVTransaction);
  app.post("/api/payments/tokenize", handleTokenizeCard);
  app.get("/api/payments/transactions/:transactionId", handleGetTransaction);

  // 3D Secure Authentication
  app.post("/api/payments/3ds/initiate", handleInitiate3DSecure);
  app.post("/api/payments/3ds/verify", handleVerify3DSecure);

  // Contactless Payments
  app.post("/api/payments/contactless/process", handleProcessContactlessPayment);

  // PIN Verification
  app.post("/api/payments/pinpad/session", handleCreatePINpadSession);
  app.post("/api/payments/verify-pin", handleVerifyPIN);
  app.get("/api/payments/pinpad/session/:sessionId", handleGetPINpadSession);

  // Compliance Reports
  app.get("/api/merchants/:merchantId/compliance/report", handleGetComplianceReport);

  /**
   * MERCHANT MANAGEMENT ROUTES
   */

  // Merchant onboarding
  app.post("/api/merchants/onboard", verifyToken, handleMerchantOnboarding);
  app.get("/api/merchants/profile", verifyAuth, requireMerchant, handleGetMerchantProfile);
  app.put("/api/merchants/profile", verifyAuth, requireMerchant, handleUpdateMerchantProfile);

  // KYC & Banking
  app.post("/api/merchants/kyc/upload", verifyAuth, requireMerchant, handleUploadKYCDocuments);
  app.post("/api/merchants/bank-accounts", verifyAuth, requireMerchant, handleAddBankAccount);

  // API Keys
  app.get("/api/merchants/api-keys", verifyAuth, requireMerchant, handleGetAPIKeys);
  app.post("/api/merchants/api-keys", verifyAuth, requireMerchant, handleCreateAPIKey);
  app.delete("/api/merchants/api-keys/:keyId", verifyAuth, requireMerchant, handleRevokeAPIKey);

  // Dashboard & History
  app.get("/api/merchants/dashboard", verifyAuth, requireMerchant, handleGetMerchantDashboard);
  app.get("/api/merchants/transactions", verifyAuth, requireMerchant, handleGetTransactionHistory);

  /**
   * TRANSACTION PROCESSING ROUTES
   */

  // Process and manage payments
  app.post("/api/transactions/process", verifyAuth, requireMerchant, handleProcessPayment);
  app.post("/api/transactions/:transactionId/refund", verifyAuth, requireMerchant, handleRefundTransaction);
  app.get("/api/transactions/:transactionId", verifyAuth, requireMerchant, handleGetTransactionDetail);
  app.get("/api/transactions", verifyAuth, requireMerchant, handleListPaymentTransactions);

  // Reconciliation & Export
  app.post("/api/transactions/reconcile", verifyAuth, requireMerchant, handleReconcile);
  app.get("/api/transactions/export", verifyAuth, requireMerchant, handleExportTransactions);

  /**
   * SETTLEMENT & PAYOUT ROUTES
   */

  // Settlement management
  app.post("/api/settlements/calculate", verifyAuth, requireMerchant, handleCalculateSettlement);
  app.post("/api/settlements/:settlementId/payout", verifyAuth, requireMerchant, handleProcessPayout);
  app.get("/api/settlements/:settlementId", verifyAuth, requireMerchant, handleGetSettlementDetails);
  app.get("/api/settlements/:settlementId/status", verifyAuth, requireMerchant, handleGetPayoutStatus);
  app.get("/api/settlements", verifyAuth, requireMerchant, handleGetSettlementHistory);

  // Payout schedule
  app.get("/api/payouts/schedule", verifyAuth, requireMerchant, handleGetPayoutSchedule);

  /**
   * PAYMENT LINKS ROUTES (Dynamic Checkout & Sales Pages)
   */

  // Create and manage payment links
  app.post("/api/payment-links", verifyAuth, requireMerchant, handleCreatePaymentLink);
  app.get("/api/payment-links", verifyAuth, requireMerchant, handleListPaymentLinks);
  app.get("/api/payment-links/:id", verifyAuth, requireMerchant, handleGetPaymentLink);
  app.put("/api/payment-links/:id", verifyAuth, requireMerchant, handleUpdatePaymentLink);
  app.delete("/api/payment-links/:id", verifyAuth, requireMerchant, handleArchivePaymentLink);

  // Public checkout page and payment (fraud-protected, idempotent)
  app.get("/api/payment-links/:slug/checkout", handleGetPaymentLinkCheckout);
  app.post("/api/payment-links/:slug/pay", handleProcessPaymentLinkCheckout);

  // Analytics
  app.get("/api/payment-links/:id/analytics", verifyAuth, requireMerchant, handleGetPaymentLinkAnalytics);

  // Slug availability
  app.get("/api/payment-links/check-slug/:slug", handleCheckSlugAvailability);

  /**
   * INVOICE AUTOMATION ROUTES (Digital Invoices with Sequences)
   */

  // Initialize sequence
  app.post("/api/invoices/sequences/init", verifyAuth, requireMerchant, handleInitializeInvoiceSequence);

  // Generate invoice number
  app.post("/api/invoices/next-number", verifyAuth, requireMerchant, handleGenerateInvoiceNumber);

  // Invoice jobs
  app.post("/api/invoices/jobs", verifyAuth, requireMerchant, handleCreateInvoiceJob);
  app.get("/api/invoices/jobs", verifyAuth, requireMerchant, handleGetMerchantInvoiceJobs);
  app.get("/api/invoices/job/:transactionId", verifyAuth, requireMerchant, handleGetInvoiceJobByTransaction);
  app.put("/api/invoices/jobs/:jobId", verifyAuth, requireMerchant, handleUpdateInvoiceJobStatus);
  app.post("/api/invoices/jobs/:jobId/delivered", verifyAuth, requireMerchant, handleRecordInvoiceDelivery);

  // Invoice details & stats
  app.get("/api/invoices/:jobId/details", verifyAuth, requireMerchant, handleGetInvoiceDetails);
  app.get("/api/invoices/automation/stats", verifyAuth, requireMerchant, handleGetAutomationInvoiceStats);

  /**
   * CUSTOMER PAYMENT METHODS ROUTES (Stored Cards & Card Updater)
   */

  // Add/manage payment methods
  app.post("/api/customers/payment-methods", verifyAuth, requireMerchant, handleAddPaymentMethod);
  app.get("/api/customers/:customerId/payment-methods", verifyAuth, requireMerchant, handleGetCustomerPaymentMethods);
  app.get("/api/customers/:customerId/payment-methods/primary", verifyAuth, requireMerchant, handleGetPrimaryPaymentMethod);

  // Payment method status updates
  app.put("/api/customers/payment-methods/:methodId/expire", verifyAuth, requireMerchant, handleMarkAsExpired);
  app.put("/api/customers/payment-methods/:methodId/invalidate", verifyAuth, requireMerchant, handleMarkAsInvalid);
  app.delete("/api/customers/payment-methods/:methodId", verifyAuth, requireMerchant, handleArchivePaymentMethod);

  // Card updater
  app.post("/api/customers/payment-methods/:methodId/updater-event", verifyAuth, requireMerchant, handleRecordCardUpdaterEvent);
  app.get("/api/customers/payment-methods/:methodId/updater-history", verifyAuth, requireMerchant, handleGetMethodUpdaterHistory);

  // Stats
  app.get("/api/customers/payment-methods/stats", verifyAuth, requireMerchant, handleGetPaymentMethodStats);

  // Durable webhook endpoint management
  app.post("/api/webhooks/endpoints", verifyAuth, requireMerchant, handleCreateWebhookEndpoint);
  app.get("/api/webhooks/endpoints", verifyAuth, requireMerchant, handleListWebhookEndpoints);
  app.delete("/api/webhooks/endpoints/:endpointId", verifyAuth, requireMerchant, handleDeleteWebhookEndpoint);
  app.get("/api/webhooks/deliveries", verifyAuth, requireMerchant, handleListWebhookDeliveries);

  // Webhook for card network updater (webhook auth via API key)
  app.post("/api/webhooks/card-updater", handleCardUpdaterWebhook);

  /**
   * KYC/AML VERIFICATION ROUTES
   */

  // Submit KYC verification
  app.post("/api/kyc/submit", verifyAuth, requireMerchant, handleSubmitKYC);

  // Get KYC status
  app.get("/api/kyc/status", verifyAuth, requireMerchant, handleGetKYCStatus);

  // Get AML check history
  app.get("/api/kyc/aml-history", verifyAuth, requireMerchant, handleGetAMLHistory);

  // Approve KYC (admin only)
  app.post("/api/kyc/:verificationId/approve", verifyAuth, requireRole("admin"), handleApproveKYC);

  // Reject KYC (admin only)
  app.post("/api/kyc/:verificationId/reject", verifyAuth, requireRole("admin"), handleRejectKYC);

  // Request additional documents
  app.post(
    "/api/kyc/:verificationId/request-documents",
    verifyAuth,
    requireRole("admin"),
    handleRequestAdditionalDocuments
  );

  // Check merchant verification
  app.get(
    "/api/kyc/merchant/:merchantId/verified",
    handleCheckMerchantVerification
  );

  // Check for suspicious activity
  app.post("/api/kyc/check-suspicious-activity", verifyAuth, requireMerchant, handleCheckSuspiciousActivity);

  /**
   * FRAUD DETECTION ROUTES
   */

  // Score transaction for fraud risk
  app.post("/api/fraud/score-transaction", verifyToken, handleScoreTransaction);

  // Get fraud statistics
  app.get("/api/fraud/stats", verifyAuth, requireMerchant, handleGetFraudStats);

  // Get high-risk transactions for review
  app.get(
    "/api/fraud/high-risk-transactions",
    verifyAuth,
    requireMerchant,
    handleGetHighRiskTransactions
  );

  // Mark fraud event
  app.post("/api/fraud/:fraudEventId/mark", verifyAuth, handleMarkFraudEvent);

  // Block merchant account
  app.post("/api/fraud/:merchantId/block", verifyAuth, handleBlockMerchantAccount);

  // Get fraud detection rules
  app.get("/api/fraud/rules", handleGetFraudRules);

  // Update fraud settings
  app.put("/api/fraud/:merchantId/settings", verifyAuth, requireMerchant, handleUpdateFraudSettings);

  // AI Agent Status endpoint
  app.get("/api/ai-agents/status", (_req, res) => {
    const agentStatus = aiAgentManager.getAgentStatus();
    res.json({
      status: "active",
      agents: agentStatus,
      active_count: agentStatus.filter((a) => a.enabled).length,
    });
  });

  // Error handling middleware (must be last)
  app.use(errorHandlerMiddleware);

  // Start AI agents on server startup
  aiAgentManager.start();

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    aiAgentManager.stop();
    Database.close();
  });

  return app;
}
