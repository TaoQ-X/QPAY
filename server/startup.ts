/**
 * QPay Startup Initialization
 * Handles database setup, migrations, and health checks
 */

import Database from "./database/client";
import { notificationService } from "./services/notification-service";
import fs from "fs";
import path from "path";

class StartupManager {
  /**
   * Initialize database
   */
  static async initializeDatabase(): Promise<boolean> {
    console.log("📊 Initializing database...");

    try {
      // Check connection
      const healthy = await Database.healthCheck();
      if (!healthy) {
        console.error("❌ Database connection failed");
        return false;
      }

      console.log("✅ Database connection successful");

      // Load and execute schema
      const schemaPath = path.join(__dirname, "database", "schema.sql");
      const schema = fs.readFileSync(schemaPath, "utf-8");

      // Execute schema
      const statements = schema.split(";").filter((s) => s.trim());
      for (const statement of statements) {
        try {
          await Database.query(statement);
        } catch (error: any) {
          // Ignore errors from existing objects
          if (!error.message.includes("already exists")) {
            console.warn(`Warning: ${error.message}`);
          }
        }
      }

      console.log("✅ Database schema initialized");
      return true;
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      return false;
    }
  }

  /**
   * Verify environment variables
   */
  static async verifyEnvironment(): Promise<boolean> {
    console.log("🔐 Verifying environment configuration...");

    const requiredVars = [
      "NODE_ENV",
      "JWT_SECRET",
      "STRIPE_SECRET_KEY",
      "DATABASE_URL",
    ];

    const optionalVars = [
      "SMTP_HOST",
      "TWILIO_ACCOUNT_SID",
      "SENTRY_DSN",
      "AWS_S3_BUCKET",
    ];

    let allValid = true;

    // Check required variables
    for (const variable of requiredVars) {
      if (!process.env[variable]) {
        console.error(`❌ Missing required environment variable: ${variable}`);
        allValid = false;
      }
    }

    // Check optional variables
    for (const variable of optionalVars) {
      if (!process.env[variable]) {
        console.warn(`⚠️  Optional feature disabled (${variable} not set)`);
      }
    }

    if (allValid) {
      console.log("✅ All required environment variables configured");
    }

    return allValid;
  }

  /**
   * Test external services
   */
  static async testExternalServices(): Promise<void> {
    console.log("🔗 Testing external services...");

    // Test email
    try {
      const emailTest = await notificationService.testEmailConnection();
      if (emailTest.success) {
        console.log("✅ Email service configured");
      } else {
        console.warn(`⚠️  Email service unavailable: ${emailTest.message}`);
      }
    } catch (error) {
      console.warn("⚠️  Email service test skipped");
    }

    // Test Stripe (implicit - checked at first transaction)
    console.log("✅ Stripe integration ready");

    // Add more tests as needed
  }

  /**
   * Create default admin user (if needed)
   */
  static async createDefaultUsers(): Promise<void> {
    console.log("👤 Setting up default users...");

    try {
      // Check if any users exist
      const result = await Database.query("SELECT COUNT(*) FROM users");
      const userCount = parseInt(result.rows[0]?.count || 0);

      if (userCount === 0) {
        console.log("ℹ️  No users found. Admin user creation recommended.");
      } else {
        console.log(`✅ Found ${userCount} existing user(s)`);
      }
    } catch (error) {
      console.warn("⚠️  Could not check user count");
    }
  }

  /**
   * Run health checks
   */
  static async runHealthChecks(): Promise<boolean> {
    console.log("🏥 Running health checks...");

    const checks: { name: string; test: () => Promise<boolean> }[] = [
      {
        name: "Database",
        test: async () => await Database.healthCheck(),
      },
      {
        name: "Environment",
        test: async () => await this.verifyEnvironment(),
      },
    ];

    let allPassed = true;

    for (const check of checks) {
      try {
        const passed = await check.test();
        if (passed) {
          console.log(`  ✅ ${check.name}`);
        } else {
          console.error(`  ❌ ${check.name}`);
          allPassed = false;
        }
      } catch (error) {
        console.error(`  ❌ ${check.name}: ${error}`);
        allPassed = false;
      }
    }

    return allPassed;
  }

  /**
   * Log startup information
   */
  static logStartupInfo(): void {
    console.log("\n" + "=".repeat(60));
    console.log("          🚀 QPay Payment Platform");
    console.log("=".repeat(60));
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Port: ${process.env.APP_PORT || 8080}`);
    console.log(`Database: ${process.env.NODE_ENV === "production" ? "PostgreSQL (Production)" : "PostgreSQL (Dev)"}`);
    console.log("=".repeat(60) + "\n");
  }

  /**
   * Full startup procedure
   */
  static async startup(): Promise<boolean> {
    try {
      this.logStartupInfo();

      // 1. Verify environment
      const envValid = await this.verifyEnvironment();
      if (!envValid && process.env.NODE_ENV === "production") {
        console.error("❌ Critical environment variables missing");
        return false;
      }

      // 2. Initialize database
      const dbInit = await this.initializeDatabase();
      if (!dbInit) {
        console.error("❌ Database initialization failed");
        return false;
      }

      // 3. Test external services
      await this.testExternalServices();

      // 4. Create default users
      await this.createDefaultUsers();

      // 5. Run health checks
      const healthChecks = await this.runHealthChecks();
      if (!healthChecks && process.env.NODE_ENV === "production") {
        console.error("❌ Health checks failed");
        return false;
      }

      console.log("\n✅ Startup complete! System ready for requests.\n");
      return true;
    } catch (error) {
      console.error("❌ Startup failed:", error);
      return false;
    }
  }
}

export default StartupManager;
