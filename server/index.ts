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
