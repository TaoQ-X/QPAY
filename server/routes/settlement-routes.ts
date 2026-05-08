import { RequestHandler } from "express";
import Database from "../database/client";
import { settlementEngine } from "../services/settlement-engine";
import { notificationService } from "../services/notification-service";

/**
 * Settlement & Payout Routes
 * Handles settlement calculations and merchant payouts
 */

export const handleCalculateSettlement: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { startDate, endDate } = req.query;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    // Get merchant info
    const merchant = await Database.getOne(
      "SELECT * FROM merchants WHERE id = $1",
      [merchantId]
    );

    if (!merchant) {
      res.status(404).json({ error: "Merchant not found" });
      return;
    }

    // Get transactions for period
    const transactions = await Database.getMany(
      `SELECT * FROM transactions 
      WHERE merchant_id = $1 
      AND created_at >= $2 
      AND created_at <= $3
      ORDER BY created_at DESC`,
      [
        merchantId,
        startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate || new Date(),
      ]
    );

    // Calculate settlement
    const settlement = await settlementEngine.calculateSettlement(
      merchantId,
      new Date(startDate as string),
      new Date(endDate as string),
      transactions,
      merchant.tier
    );

    // Store settlement in database
    const storedSettlement = await Database.insert("settlements", {
      merchant_id: merchantId,
      settlement_date: new Date(),
      period_start_date: settlement.periodStartDate,
      period_end_date: settlement.periodEndDate,
      gross_volume: settlement.summary.grossVolume,
      fee_amount: settlement.summary.totalFees,
      net_volume: settlement.summary.netVolume,
      transaction_count: settlement.summary.transactionCount,
      status: "pending",
    });

    res.json({
      settlementId: storedSettlement.id,
      ...settlement.summary,
      status: "pending",
      payoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });
  } catch (error) {
    console.error("Settlement calculation error:", error);
    res.status(500).json({ error: "Failed to calculate settlement" });
  }
};

export const handleProcessPayout: RequestHandler = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    // Get settlement
    const settlement = await Database.getOne(
      "SELECT * FROM settlements WHERE id = $1 AND merchant_id = $2",
      [settlementId, merchantId]
    );

    if (!settlement) {
      res.status(404).json({ error: "Settlement not found" });
      return;
    }

    if (settlement.status !== "pending") {
      res.status(400).json({ error: "Settlement cannot be processed" });
      return;
    }

    // Get primary bank account
    const bankAccount = await Database.getOne(
      "SELECT * FROM bank_accounts WHERE merchant_id = $1 AND verified = true LIMIT 1",
      [merchantId]
    );

    if (!bankAccount) {
      res.status(400).json({ error: "No verified bank account found" });
      return;
    }

    // Process payout with settlement engine
    const payout = await settlementEngine.processPayout(
      merchantId,
      settlement.net_volume,
      bankAccount.id,
      "USD"
    );

    // Update settlement status
    const updatedSettlement = await Database.update(
      "settlements",
      {
        status: "processing",
        stripe_payout_id: payout.payoutId,
        processed_at: new Date(),
      },
      { id: settlementId }
    );

    // Send settlement email
    const merchant = await Database.getOne(
      "SELECT * FROM merchants WHERE id = $1",
      [merchantId]
    );

    if (merchant) {
      await notificationService.sendSettlementSummary({
        merchantName: merchant.business_name,
        merchantEmail: merchant.email,
        settlementId,
        periodStart: settlement.period_start_date,
        periodEnd: settlement.period_end_date,
        grossVolume: settlement.gross_volume,
        fees: settlement.fee_amount,
        netAmount: settlement.net_volume,
        transactionCount: settlement.transaction_count,
        payoutDate: payout.arrivalDate,
      });
    }

    res.json({
      settlementId,
      payoutId: payout.payoutId,
      status: "processing",
      amount: payout.amount,
      arrivalDate: payout.arrivalDate,
    });
  } catch (error) {
    console.error("Payout processing error:", error);
    res.status(500).json({ error: "Failed to process payout" });
  }
};

export const handleGetPayoutStatus: RequestHandler = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    // Get settlement with this payout
    const settlement = await Database.getOne(
      "SELECT * FROM settlements WHERE stripe_payout_id = $1 AND merchant_id = $2",
      [payoutId, merchantId]
    );

    if (!settlement) {
      res.status(404).json({ error: "Payout not found" });
      return;
    }

    // Get status from Stripe
    const status = await settlementEngine.getPayoutStatus(payoutId);

    res.json({
      payoutId,
      status: status.status,
      amount: status.amount,
      arrivedAt: status.arrivedAt,
    });
  } catch (error) {
    console.error("Error fetching payout status:", error);
    res.status(500).json({ error: "Failed to fetch payout status" });
  }
};

export const handleGetSettlementHistory: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { limit = 12, offset = 0 } = req.query;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    const settlements = await Database.getMany(
      `SELECT * FROM settlements 
      WHERE merchant_id = $1 
      ORDER BY settlement_date DESC 
      LIMIT $2 OFFSET $3`,
      [merchantId, limit, offset]
    );

    const countResult = await Database.query(
      "SELECT COUNT(*) FROM settlements WHERE merchant_id = $1",
      [merchantId]
    );

    res.json({
      settlements,
      total: parseInt(countResult.rows[0]?.count || 0),
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching settlement history:", error);
    res.status(500).json({ error: "Failed to fetch settlement history" });
  }
};

export const handleGetPayoutSchedule: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    // Get merchant tier
    const merchant = await Database.getOne(
      "SELECT tier FROM merchants WHERE id = $1",
      [merchantId]
    );

    if (!merchant) {
      res.status(404).json({ error: "Merchant not found" });
      return;
    }

    // Get payout schedule
    const schedule = settlementEngine.getPayoutSchedule(merchant.tier);

    res.json({
      frequency: schedule.frequency,
      nextPayoutDate: schedule.nextPayoutDate,
      minimumAmount: schedule.minimumAmount,
      daysUntilPayout: schedule.daysUntilPayout,
    });
  } catch (error) {
    console.error("Error fetching payout schedule:", error);
    res.status(500).json({ error: "Failed to fetch payout schedule" });
  }
};

export const handleGetSettlementDetails: RequestHandler = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    // Get settlement
    const settlement = await Database.getOne(
      "SELECT * FROM settlements WHERE id = $1 AND merchant_id = $2",
      [settlementId, merchantId]
    );

    if (!settlement) {
      res.status(404).json({ error: "Settlement not found" });
      return;
    }

    // Get settlement details (transactions included)
    const details = await Database.getMany(
      `SELECT sd.*, t.amount, t.status, t.payment_method 
      FROM settlement_details sd
      JOIN transactions t ON sd.transaction_id = t.id
      WHERE sd.settlement_id = $1`,
      [settlementId]
    );

    res.json({
      settlement,
      details,
      transactionCount: details.length,
    });
  } catch (error) {
    console.error("Error fetching settlement details:", error);
    res.status(500).json({ error: "Failed to fetch settlement details" });
  }
};
