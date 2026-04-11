import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleRegisterBusiness,
  handleGetBusinessAnalytics,
  handleListTransactions,
  handleVerifyEmail,
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
  handleGetInvoiceStats,
  handleProcessTerminalTransaction,
  handleGetTerminalConfig,
  handleUpdateTerminalConfig,
  handleGetTerminalStats,
  handlePerformHealthCheck,
  handleGetMerchantTerminals,
  handleGetTerminalTransactions,
  handleGetEMVComplianceReport,
} from "./routes/pos-operations";
import { AIAgentManager } from "./ai-agents";

// Initialize AI Agent Manager
const aiAgentManager = new AIAgentManager();

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Demo endpoint
  app.get("/api/demo", handleDemo);

  // Business Registration API
  app.post("/api/register-business", handleRegisterBusiness);

  // Business Analytics API
  app.get("/api/business/:businessId/analytics", handleGetBusinessAnalytics);

  // List Business Transactions
  app.get("/api/business/:businessId/transactions", handleListTransactions);

  // Verify Email
  app.post("/api/business/:businessId/verify-email", handleVerifyEmail);

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
  app.get("/api/invoices/stats", handleGetInvoiceStats);

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

  // AI Agent Status endpoint
  app.get("/api/ai-agents/status", (_req, res) => {
    const agentStatus = aiAgentManager.getAgentStatus();
    res.json({
      status: "active",
      agents: agentStatus,
      active_count: agentStatus.filter((a) => a.enabled).length,
    });
  });

  // Start AI agents on server startup
  aiAgentManager.start();

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    aiAgentManager.stop();
  });

  return app;
}
