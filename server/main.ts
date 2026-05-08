/**
 * QPay Application Entry Point
 * Initializes the application and starts the server
 */

import "dotenv/config";
import { createServer } from "./index";
import StartupManager from "./startup";

const PORT = process.env.APP_PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || "development";

async function main() {
  try {
    console.log("🔄 Starting QPay Payment Platform...\n");

    // Run startup procedures
    const startupSuccess = await StartupManager.startup();

    if (!startupSuccess && NODE_ENV === "production") {
      console.error("❌ Startup failed. Exiting.");
      process.exit(1);
    }

    // Create Express application
    const app = await createServer();

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date(),
        environment: NODE_ENV,
        uptime: process.uptime(),
      });
    });

    // Ready check endpoint
    app.get("/ready", async (req, res) => {
      try {
        const db = await import("./database/client").then((m) => m.default);
        const healthy = await db.healthCheck();

        if (healthy) {
          res.json({
            status: "ready",
            timestamp: new Date(),
          });
        } else {
          res.status(503).json({
            status: "not_ready",
            reason: "database_connection_failed",
          });
        }
      } catch (error) {
        res.status(503).json({
          status: "not_ready",
          reason: "internal_error",
        });
      }
    });

    // Root endpoint
    app.get("/", (req, res) => {
      res.json({
        message: "QPay Payment Platform API",
        version: "1.0.0",
        environment: NODE_ENV,
        documentation: "https://docs.qpay.io",
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        error: "Not Found",
        path: req.path,
        method: req.method,
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📍 Environment: ${NODE_ENV}`);
      console.log(`📖 Documentation: https://docs.qpay.io`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health\n`);
    });

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down gracefully...");
      const db = await import("./database/client").then((m) => m.default);
      await db.close();
      console.log("✅ Database connections closed");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

main();
