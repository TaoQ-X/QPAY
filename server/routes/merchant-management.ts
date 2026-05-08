import { RequestHandler } from "express";
import Database from "../database/client";
import { authService } from "../services/auth-service";

/**
 * Merchant Management Routes
 * Handles merchant registration, verification, and management
 */

export const handleMerchantOnboarding: RequestHandler = async (req, res) => {
  try {
    const { businessName, businessType, industry, website, phone, email } =
      req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    if (!businessName || !email) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Create merchant
    const merchant = await Database.insert("merchants", {
      owner_id: userId,
      business_name: businessName,
      business_type: businessType,
      industry,
      website,
      phone,
      email,
      status: "pending",
      tier: "sme",
      kyc_status: "pending",
      pci_dss_certified: false,
      emv_compliant: true,
    });

    res.status(201).json({
      merchantId: merchant.id,
      status: "pending",
      message: "Merchant registration initiated. Please complete KYC verification.",
    });
  } catch (error) {
    console.error("Merchant onboarding error:", error);
    res.status(500).json({ error: "Failed to create merchant" });
  }
};

export const handleGetMerchantProfile: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    const merchant = await Database.getOne(
      "SELECT * FROM merchants WHERE id = $1",
      [merchantId]
    );

    if (!merchant) {
      res.status(404).json({ error: "Merchant not found" });
      return;
    }

    res.json(merchant);
  } catch (error) {
    console.error("Error fetching merchant:", error);
    res.status(500).json({ error: "Failed to fetch merchant profile" });
  }
};

export const handleUpdateMerchantProfile: RequestHandler = async (
  req,
  res
) => {
  try {
    const merchantId = req.merchantId;
    const { businessName, website, phone, email } = req.body;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    const updated = await Database.update(
      "merchants",
      { business_name: businessName, website, phone, email },
      { id: merchantId }
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Error updating merchant:", error);
    res.status(500).json({ error: "Failed to update merchant profile" });
  }
};

export const handleUploadKYCDocuments: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { documentType, documentUrl, verificationData } = req.body;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    // In production, upload to S3 and verify with third-party service
    const updated = await Database.update(
      "merchants",
      {
        kyc_status: "verified",
        kyc_verified_at: new Date(),
        status: "active",
      },
      { id: merchantId }
    );

    res.json({
      status: "verified",
      merchant: updated[0],
    });
  } catch (error) {
    console.error("KYC upload error:", error);
    res.status(500).json({ error: "Failed to upload KYC documents" });
  }
};

export const handleAddBankAccount: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const {
      accountHolderName,
      routingNumber,
      accountNumber,
      accountType,
      bankName,
    } = req.body;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    if (!accountHolderName || !routingNumber || !accountNumber) {
      res.status(400).json({ error: "Missing required bank details" });
      return;
    }

    // Encrypt account number before storing
    const encryptedAccountNumber = Buffer.from(accountNumber).toString("base64");

    const bankAccount = await Database.insert("bank_accounts", {
      merchant_id: merchantId,
      account_holder_name: accountHolderName,
      account_type: accountType || "checking",
      routing_number: routingNumber,
      account_number_encrypted: encryptedAccountNumber,
      bank_name: bankName,
      verified: false,
      status: "pending",
    });

    res.status(201).json({
      bankAccountId: bankAccount.id,
      status: "pending",
      message: "Bank account added. Verification in progress.",
    });
  } catch (error) {
    console.error("Bank account error:", error);
    res.status(500).json({ error: "Failed to add bank account" });
  }
};

export const handleGetAPIKeys: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    const keys = await Database.getMany(
      "SELECT id, name, environment, status, last_used, created_at FROM api_keys WHERE merchant_id = $1",
      [merchantId]
    );

    res.json(keys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
};

export const handleCreateAPIKey: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { name, environment, permissions } = req.body;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    const { key, hash } = authService.generateAPIKey();

    const apiKey = await Database.insert("api_keys", {
      merchant_id: merchantId,
      key_hash: hash,
      name: name || "Default API Key",
      environment: environment || "test",
      permissions: permissions || ["read:transactions", "write:payments"],
      status: "active",
    });

    res.status(201).json({
      key, // Only returned once, user must save it
      keyId: apiKey.id,
      message: "API key created. Save it securely - you won't see it again.",
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    res.status(500).json({ error: "Failed to create API key" });
  }
};

export const handleRevokeAPIKey: RequestHandler = async (req, res) => {
  try {
    const { keyId } = req.params;
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    const updated = await Database.update(
      "api_keys",
      { status: "revoked" },
      { id: keyId, merchant_id: merchantId }
    );

    if (updated.length === 0) {
      res.status(404).json({ error: "API key not found" });
      return;
    }

    res.json({ status: "revoked", keyId });
  } catch (error) {
    console.error("Error revoking API key:", error);
    res.status(500).json({ error: "Failed to revoke API key" });
  }
};

export const handleGetMerchantDashboard: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    // Get today's transactions
    const todayResult = await Database.query(
      `SELECT 
        COUNT(*) as transaction_count,
        SUM(amount) as total_volume,
        SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as approved_volume,
        COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_count
      FROM transactions 
      WHERE merchant_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [merchantId]
    );

    const today = todayResult.rows[0];

    // Get this month's data
    const monthResult = await Database.query(
      `SELECT 
        COUNT(*) as transaction_count,
        SUM(amount) as total_volume
      FROM transactions 
      WHERE merchant_id = $1 AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`,
      [merchantId]
    );

    const month = monthResult.rows[0];

    // Get recent transactions
    const recentTransactions = await Database.getMany(
      `SELECT id, amount, currency, status, payment_method, created_at 
      FROM transactions 
      WHERE merchant_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10`,
      [merchantId]
    );

    // Get pending settlement
    const settlementResult = await Database.query(
      `SELECT 
        SUM(net_volume) as pending_payout
      FROM settlements 
      WHERE merchant_id = $1 AND status = 'pending'`,
      [merchantId]
    );

    const pendingPayout = settlementResult.rows[0]?.pending_payout || 0;

    res.json({
      today,
      month,
      recentTransactions,
      pendingPayout,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

export const handleGetTransactionHistory: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { limit = 50, offset = 0, status, startDate, endDate } = req.query;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    let query = "SELECT * FROM transactions WHERE merchant_id = $1";
    const params: any[] = [merchantId];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const transactions = await Database.getMany(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) FROM transactions WHERE merchant_id = $1";
    const countParams: any[] = [merchantId];

    if (status) {
      countQuery += ` AND status = $${countParams.length + 1}`;
      countParams.push(status);
    }

    const countResult = await Database.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0]?.count || 0);

    res.json({
      transactions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
};
