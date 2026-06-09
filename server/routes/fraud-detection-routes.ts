import { RequestHandler } from "express";
import { z } from "zod";
import { FraudDetectionService } from "../services/fraud-detection-service";

const analyzeTransactionSchema = z.object({
  transaction_id: z.string(),
  merchant_id: z.string(),
  customer_email: z.string().email().optional(),
  customer_ip: z.string().ip().optional(),
  amount_cents: z.number().min(1),
  currency: z.string().length(3),
  card_last_four: z.string().optional(),
  card_brand: z.string().optional(),
  card_country: z.string().optional(),
  customer_name: z.string().optional(),
});

/**
 * Score transaction for fraud risk
 * POST /api/fraud/score-transaction
 */
export const handleScoreTransaction: RequestHandler = async (req, res) => {
  try {
    const validatedData = analyzeTransactionSchema.parse(req.body);

    const fraudScore = await FraudDetectionService.scoreTransaction(validatedData);

    // Record the fraud event
    await FraudDetectionService.recordFraudEvent(
      validatedData.merchant_id,
      validatedData.transaction_id,
      fraudScore,
      validatedData.customer_ip,
      validatedData.customer_email
    );

    res.json({
      success: true,
      data: {
        transaction_id: validatedData.transaction_id,
        fraud_score: fraudScore,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error scoring transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to score transaction",
    });
  }
};

/**
 * Get fraud statistics for merchant
 * GET /api/fraud/stats
 */
export const handleGetFraudStats: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const daysBack = parseInt(req.query.days_back as string) || 30;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID required",
      });
    }

    const stats = await FraudDetectionService.getFraudStats(merchantId, daysBack);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching fraud stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fraud statistics",
    });
  }
};

/**
 * Get high-risk transactions for review
 * GET /api/fraud/high-risk-transactions
 */
export const handleGetHighRiskTransactions: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const minScore = parseInt(req.query.min_score as string) || 75;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID required",
      });
    }

    const transactions = await FraudDetectionService.getHighRiskTransactions(
      merchantId,
      minScore,
      limit
    );

    res.json({
      success: true,
      data: transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Error fetching high-risk transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch high-risk transactions",
    });
  }
};

/**
 * Mark fraud event as confirmed or false positive
 * POST /api/fraud/:fraudEventId/mark
 */
export const handleMarkFraudEvent: RequestHandler = async (req, res) => {
  try {
    const { fraudEventId } = req.params;
    const { resolution } = req.body;

    if (!["confirmed_fraud", "false_positive", "suspicious_but_valid"].includes(resolution)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resolution. Must be one of: confirmed_fraud, false_positive, suspicious_but_valid",
      });
    }

    const marked = await FraudDetectionService.markFraudEvent(fraudEventId, resolution);

    res.json({
      success: true,
      message: `Fraud event marked as ${resolution}`,
      data: marked,
    });
  } catch (error) {
    console.error("Error marking fraud event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark fraud event",
    });
  }
};

/**
 * Block merchant account due to fraud
 * POST /api/fraud/:merchantId/block
 */
export const handleBlockMerchantAccount: RequestHandler = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Reason for blocking is required",
      });
    }

    // Update merchant status
    const updated = await Database.update(
      `UPDATE merchants 
       SET status = 'suspended', suspension_reason = $1, suspended_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [reason, merchantId]
    );

    // Log the action
    console.log(`[FRAUD] Merchant ${merchantId} suspended: ${reason}`);

    res.json({
      success: true,
      message: "Merchant account suspended due to fraud",
      data: updated,
    });
  } catch (error) {
    console.error("Error blocking merchant:", error);
    res.status(500).json({
      success: false,
      message: "Failed to block merchant account",
    });
  }
};

/**
 * Get fraud detection rules
 * GET /api/fraud/rules
 */
export const handleGetFraudRules: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        rules: [
          {
            name: "Velocity Fraud",
            description: "Detects unusually high transaction velocity",
            thresholds: {
              warning: 50,
              block: 100,
            },
            unit: "transactions per hour",
          },
          {
            name: "Amount Anomaly",
            description: "Detects transactions with unusual amounts",
            thresholds: {
              warning: 2,
              block: 4,
            },
            unit: "standard deviations from average",
          },
          {
            name: "Card Testing",
            description: "Detects patterns of small test transactions",
            thresholds: {
              warning: 5,
              block: 10,
            },
            unit: "small transactions in 24 hours",
          },
          {
            name: "Geographic Inconsistency",
            description: "Detects impossible travel or location mismatches",
            thresholds: {
              warning: "mismatch",
              block: "impossible travel",
            },
          },
          {
            name: "Device Reputation",
            description: "Checks if device/IP has history of fraud",
            thresholds: {
              warning: 2,
              block: 5,
            },
            unit: "fraud incidents in 90 days",
          },
          {
            name: "Email Risk",
            description: "Detects disposable emails and fraud history",
            thresholds: {
              warning: "disposable_email",
              block: "fraud_history",
            },
          },
          {
            name: "3D Secure",
            description: "3D Secure authentication reduces fraud risk",
            thresholds: {
              approved: "authentication_used",
            },
          },
        ],
        scoring: {
          low: "0-20",
          medium: "20-50",
          high: "50-75",
          critical: "75-100",
        },
        actions: {
          low: "approve",
          medium: "challenge",
          high: "review",
          critical: "block",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching fraud rules:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fraud rules",
    });
  }
};

/**
 * Update merchant fraud settings
 * PUT /api/fraud/:merchantId/settings
 */
export const handleUpdateFraudSettings: RequestHandler = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const {
      enable_3ds,
      block_high_risk,
      challenge_medium_risk,
      velocity_threshold,
    } = req.body;

    // Save to merchant settings
    const updated = await Database.update(
      `UPDATE merchants 
       SET fraud_settings = $1 
       WHERE id = $2 
       RETURNING *`,
      [
        JSON.stringify({
          enable_3ds: enable_3ds !== false,
          block_high_risk: block_high_risk !== false,
          challenge_medium_risk: challenge_medium_risk !== false,
          velocity_threshold: velocity_threshold || 100,
        }),
        merchantId,
      ]
    );

    res.json({
      success: true,
      message: "Fraud settings updated",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating fraud settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update fraud settings",
    });
  }
};

// Import Database at the top
import Database from "../database/client";
