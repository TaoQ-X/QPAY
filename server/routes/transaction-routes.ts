import { RequestHandler } from "express";
import Database from "../database/client";
import { stripeIntegration } from "../services/stripe-integration";
import { emvPaymentProcessor } from "../services/emv-payment-processor";
import { settlementEngine } from "../services/settlement-engine";
import { notificationService } from "../services/notification-service";

/**
 * Transaction Processing Routes
 * Handles payment processing, refunds, and reconciliation
 */

export const handleProcessPayment: RequestHandler = async (req, res) => {
  try {
    const {
      amount,
      currency,
      cardToken,
      paymentMethod,
      description,
      customerEmail,
      customerPhone,
      metadata,
    } = req.body;

    const merchantId = req.merchantId;
    const terminalId = req.body.terminalId || "API";

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    if (!amount || !cardToken || !paymentMethod) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Process payment with Stripe
    const paymentResult = await stripeIntegration.processPayment({
      amount,
      currency: currency || "USD",
      cardToken,
      cardholderName: "Customer",
      description: description || `Payment from ${merchantId}`,
      merchantId,
      transactionId: "",
      metadata,
    });

    // Store transaction in database
    const transaction = await Database.insert("transactions", {
      merchant_id: merchantId,
      terminal_id: terminalId,
      amount,
      currency: currency || "USD",
      payment_method: paymentMethod,
      status: paymentResult.status === "succeeded" ? "approved" : "declined",
      stripe_charge_id: paymentResult.chargeId,
      authorization_code: paymentResult.chargeId.substring(0, 10),
      customer_email: customerEmail,
      customer_phone: customerPhone,
      receipt_number: `RCP-${Date.now()}`,
      metadata: JSON.stringify(metadata || {}),
    });

    // Send confirmation email if approved
    if (paymentResult.status === "succeeded" && customerEmail) {
      await notificationService.sendTransactionConfirmation({
        merchantName: "Merchant",
        merchantEmail: customerEmail,
        transactionId: transaction.id,
        amount,
        currency: currency || "USD",
        status: "approved",
        timestamp: new Date(),
      });
    }

    res.json({
      transactionId: transaction.id,
      status: paymentResult.status,
      amount,
      currency,
      authorizationCode: paymentResult.chargeId,
      receiptUrl: paymentResult.receiptUrl,
      failureMessage: paymentResult.failureMessage,
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
};

export const handleRefundTransaction: RequestHandler = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    // Get original transaction
    const transaction = await Database.getOne(
      "SELECT * FROM transactions WHERE id = $1 AND merchant_id = $2",
      [transactionId, merchantId]
    );

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    if (!transaction.stripe_charge_id) {
      res.status(400).json({ error: "Cannot refund this transaction" });
      return;
    }

    // Process refund with Stripe
    const refundResult = await stripeIntegration.refundCharge(
      transaction.stripe_charge_id,
      amount
    );

    // Store refund in database
    const refund = await Database.insert("refunds", {
      transaction_id: transactionId,
      merchant_id: merchantId,
      amount: amount || transaction.amount,
      reason: reason || "Merchant requested",
      status: refundResult.status === "succeeded" ? "completed" : "processing",
      stripe_refund_id: refundResult.refundId,
    });

    // Update transaction status
    await Database.update(
      "transactions",
      { status: "refunded" },
      { id: transactionId }
    );

    res.json({
      refundId: refund.id,
      transactionId,
      amount: amount || transaction.amount,
      status: refund.status,
    });
  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({ error: "Failed to process refund" });
  }
};

export const handleGetTransaction: RequestHandler = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    const transaction = await Database.getOne(
      "SELECT * FROM transactions WHERE id = $1 AND merchant_id = $2",
      [transactionId, merchantId]
    );

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
};

export const handleListTransactions: RequestHandler = async (req, res) => {
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

    const countResult = await Database.query(
      "SELECT COUNT(*) FROM transactions WHERE merchant_id = $1",
      [merchantId]
    );

    res.json({
      transactions,
      total: parseInt(countResult.rows[0]?.count || 0),
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error listing transactions:", error);
    res.status(500).json({ error: "Failed to list transactions" });
  }
};

export const handleReconcile: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    // Get all transactions from database
    const dbTransactions = await Database.getMany(
      "SELECT * FROM transactions WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT 100",
      [merchantId]
    );

    // Get merchant's Stripe customer ID and fetch charges from Stripe
    const stripeCharges = await stripeIntegration.listCharges(
      "cus_xxxxx", // In production, look up customer ID from database
      100
    );

    // Reconcile
    const reconciliation = settlementEngine.reconcileTransactions(
      dbTransactions,
      stripeCharges as any
    );

    res.json({
      status: "reconciliation_complete",
      matched: reconciliation.matched,
      missing: reconciliation.missing,
      extra: reconciliation.extra,
      discrepancies: reconciliation.discrepancies,
    });
  } catch (error) {
    console.error("Reconciliation error:", error);
    res.status(500).json({ error: "Failed to reconcile transactions" });
  }
};

export const handleExportTransactions: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.merchantId;
    const { format = "csv", startDate, endDate } = req.query;

    if (!merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    let query = "SELECT * FROM transactions WHERE merchant_id = $1";
    const params: any[] = [merchantId];

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    const transactions = await Database.getMany(query, params);

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "ID",
        "Amount",
        "Currency",
        "Status",
        "Payment Method",
        "Created At",
      ];
      const rows = transactions.map((t) => [
        t.id,
        t.amount,
        t.currency,
        t.status,
        t.payment_method,
        t.created_at,
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((r) => r.join(",")),
      ].join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="transactions-${Date.now()}.csv"`
      );
      res.send(csv);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="transactions-${Date.now()}.json"`
      );
      res.json(transactions);
    }
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export transactions" });
  }
};
