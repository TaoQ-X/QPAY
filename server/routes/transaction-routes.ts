import { RequestHandler } from "express";
import crypto from "crypto";
import Database from "../database/client";
import { stripeIntegration } from "../services/stripe-integration";
import { emvPaymentProcessor } from "../services/emv-payment-processor";
import { settlementEngine } from "../services/settlement-engine";
import { notificationService } from "../services/notification-service";
import { ledgerService } from "../services/ledger-service";

/**
 * Transaction Processing Routes
 * Handles payment processing, refunds, and reconciliation
 */

export const handleProcessPayment: RequestHandler = async (req, res) => {
  try {
    const {
      amount,
      currency = "USD",
      cardToken,
      paymentMethod,
      description,
      customerEmail,
      customerPhone,
      metadata,
    } = req.body;
    const businessId = req.merchantId;
    const idempotencyKey = req.get("Idempotency-Key");

    if (!businessId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    if (!Number.isInteger(amount) || amount <= 0 || !cardToken || !paymentMethod) {
      res.status(400).json({ error: "amount must be a positive integer and payment details are required" });
      return;
    }

    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 255) {
      res.status(400).json({ error: "Idempotency-Key header is required and must be 8-255 characters" });
      return;
    }

    const existing = await Database.getOne(
      `SELECT id, status, amount_cents, currency, processor_transaction_id, processor_charge_id
       FROM transactions WHERE business_id = $1 AND idempotency_key = $2`,
      [businessId, idempotencyKey]
    );

    if (existing) {
      res.status(200).json({
        transactionId: existing.id,
        status: existing.status,
        amount: existing.amount_cents,
        currency: existing.currency,
        authorizationCode: existing.processor_charge_id,
        idempotentReplay: true,
      });
      return;
    }

    const paymentResult = await stripeIntegration.processPayment({
      amount,
      currency,
      cardToken,
      cardholderName: "Customer",
      description: description || `Payment from ${businessId}`,
      merchantId: businessId,
      transactionId: idempotencyKey,
      metadata,
    });

    const succeeded = paymentResult.status === "succeeded";
    const processorChargeId = paymentResult.chargeId || null;
    const transaction = await Database.insert("transactions", {
      id: `txn_${crypto.randomUUID()}`,
      business_id: businessId,
      amount_cents: amount,
      currency: currency.toUpperCase(),
      type: "payment",
      payment_method: paymentMethod,
      status: succeeded ? "completed" : "failed",
      processor: "stripe",
      processor_transaction_id: paymentResult.chargeId || null,
      processor_charge_id: processorChargeId,
      idempotency_key: idempotencyKey,
      receipt_email: customerEmail || null,
      description: description || null,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    });

    if (succeeded) {
      await ledgerService.record({
        businessId,
        transactionId: transaction.id,
        type: "payment",
        amountCents: amount,
        currency,
        description: description || "Payment",
        metadata,
      });
    }

    if (succeeded && customerEmail) {
      await notificationService.sendTransactionConfirmation({
        merchantName: "Merchant",
        merchantEmail: customerEmail,
        transactionId: transaction.id,
        amount,
        currency,
        status: "approved",
        timestamp: new Date(),
      });
    }

    res.status(succeeded ? 200 : 402).json({
      transactionId: transaction.id,
      status: succeeded ? "completed" : "failed",
      amount,
      currency,
      authorizationCode: processorChargeId,
      receiptUrl: paymentResult.receiptUrl,
      failureMessage: paymentResult.failureMessage,
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "Payment with this Idempotency-Key is already processing" });
      return;
    }
    console.error("Payment processing error:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
};

export const handleRefundTransaction: RequestHandler = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;
    const businessId = req.merchantId;
    const idempotencyKey = req.get("Idempotency-Key");

    if (!businessId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 255) {
      res.status(400).json({ error: "Idempotency-Key header is required and must be 8-255 characters" });
      return;
    }

    const existingRefund = await Database.getOne(
      `SELECT id, transaction_id, amount_cents, status
       FROM refunds WHERE business_id = $1 AND idempotency_key = $2`,
      [businessId, idempotencyKey]
    );

    if (existingRefund) {
      res.status(200).json({
        refundId: existingRefund.id,
        transactionId: existingRefund.transaction_id,
        amount: existingRefund.amount_cents,
        status: existingRefund.status,
        idempotentReplay: true,
      });
      return;
    }

    const transaction = await Database.getOne(
      `SELECT * FROM transactions
       WHERE id = $1 AND business_id = $2 AND status IN ('completed', 'partially_refunded')`,
      [transactionId, businessId]
    );

    if (!transaction) {
      res.status(404).json({ error: "Refundable transaction not found" });
      return;
    }

    if (!transaction.processor_charge_id) {
      res.status(400).json({ error: "Cannot refund this transaction" });
      return;
    }

    const refundedTotals = await Database.getOne<{ total: string }>(
      `SELECT COALESCE(SUM(amount_cents), 0)::text AS total
       FROM refunds WHERE transaction_id = $1 AND status IN ('completed', 'processing')`,
      [transactionId]
    );
    const alreadyRefunded = Number(refundedTotals?.total || 0);
    const remaining = Number(transaction.amount_cents) - alreadyRefunded;
    const refundAmount = amount === undefined ? remaining : amount;

    if (!Number.isInteger(refundAmount) || refundAmount <= 0 || refundAmount > remaining) {
      res.status(400).json({
        error: "Refund amount must be a positive integer in cents and cannot exceed the remaining balance",
        remainingAmount: remaining,
      });
      return;
    }

    const refundResult = await stripeIntegration.refundCharge(
      transaction.processor_charge_id,
      refundAmount
    );
    const refundStatus = refundResult.status === "succeeded" ? "completed" : "processing";
    const refund = await Database.insert("refunds", {
      id: `ref_${crypto.randomUUID()}`,
      transaction_id: transactionId,
      business_id: businessId,
      amount_cents: refundAmount,
      reason: reason || "requested_by_customer",
      status: refundStatus,
      processor_refund_id: refundResult.refundId,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      processed_at: refundStatus === "completed" ? new Date().toISOString() : null,
    });

    const newStatus = refundStatus === "completed" && refundAmount === remaining
      ? "refunded"
      : "partially_refunded";
    await Database.update(
      "transactions",
      { status: newStatus, updated_at: new Date().toISOString() },
      { id: transactionId, business_id: businessId }
    );

    await ledgerService.record({
      businessId,
      transactionId,
      type: "refund",
      amountCents: -refundAmount,
      currency: transaction.currency,
      description: reason || "Refund",
      metadata: { refundId: refund.id, idempotencyKey },
    });

    res.status(201).json({
      refundId: refund.id,
      transactionId,
      amount: refundAmount,
      status: refundStatus,
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      res.status(409).json({ error: "Refund with this Idempotency-Key is already processing" });
      return;
    }
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
