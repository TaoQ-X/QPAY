import { RequestHandler } from "express";
import { z } from "zod";
import crypto from "crypto";
import Database from "../database/client";
import { FraudDetectionService } from "../services/fraud-detection-service";
import { stripeIntegration } from "../services/stripe-integration";
import { ledgerService } from "../services/ledger-service";

const checkoutSchema = z.object({
  amount_cents: z.number().int().positive().optional(),
  card_token: z.string().min(3),
  payment_method: z.enum(["card", "apple_pay", "google_pay", "wallet"]).default("card"),
  customer_email: z.string().email().optional(),
  customer_name: z.string().max(255).optional(),
  card_last_four: z.string().regex(/^\d{4}$/).optional(),
  card_brand: z.string().max(50).optional(),
  card_country: z.string().length(2).optional(),
  metadata: z.record(z.string()).optional(),
});

export const handleProcessPaymentLinkCheckout: RequestHandler = async (req, res) => {
  try {
    const idempotencyKey = req.get("Idempotency-Key");
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 255) {
      res.status(400).json({ success: false, error: "Idempotency-Key header is required" });
      return;
    }

    const input = checkoutSchema.parse(req.body);
    const link = await Database.getOne<{
      id: string;
      business_id: string;
      name: string;
      amount_cents: number | null;
      is_variable_amount: boolean;
      min_amount_cents: number | null;
      max_amount_cents: number | null;
      currency: string;
      is_active: boolean;
      expires_at: string | null;
    }>(
      `SELECT id, business_id, name, amount_cents, is_variable_amount,
              min_amount_cents, max_amount_cents, currency, is_active, expires_at
       FROM payment_links WHERE slug = $1`,
      [req.params.slug]
    );

    if (!link || !link.is_active || (link.expires_at && new Date(link.expires_at) <= new Date())) {
      res.status(404).json({ success: false, error: "Payment link not found or expired" });
      return;
    }

    const amountCents = input.amount_cents ?? link.amount_cents;
    if (!amountCents || (link.is_variable_amount && link.min_amount_cents && amountCents < link.min_amount_cents) || (link.is_variable_amount && link.max_amount_cents && amountCents > link.max_amount_cents) || (!link.is_variable_amount && amountCents !== link.amount_cents)) {
      res.status(400).json({ success: false, error: "Invalid checkout amount" });
      return;
    }

    const existing = await Database.getOne(
      `SELECT id, status, amount_cents, currency, processor_charge_id
       FROM transactions WHERE business_id = $1 AND idempotency_key = $2`,
      [link.business_id, idempotencyKey]
    );
    if (existing) {
      res.status(200).json({ success: true, transaction_id: existing.id, status: existing.status, amount_cents: existing.amount_cents, currency: existing.currency, idempotent_replay: true });
      return;
    }

    const transactionId = `txn_${crypto.randomUUID()}`;
    await Database.insert("transactions", {
      id: transactionId,
      business_id: link.business_id,
      amount_cents: amountCents,
      currency: link.currency.toUpperCase(),
      type: "payment",
      status: "pending",
      payment_method: input.payment_method,
      idempotency_key: idempotencyKey,
      receipt_email: input.customer_email || null,
      metadata: { payment_link_id: link.id, ...(input.metadata || {}) },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const fraudScore = await FraudDetectionService.scoreTransaction({
      business_id: link.business_id,
      amount_cents: amountCents,
      currency: link.currency,
      customer_email: input.customer_email,
      customer_ip: req.ip,
      card_last_four: input.card_last_four,
      card_brand: input.card_brand,
      card_country: input.card_country,
      customer_name: input.customer_name,
    });
    await FraudDetectionService.recordFraudEvent(link.business_id, transactionId, fraudScore, req.ip, input.customer_email);

    if (fraudScore.action_taken === "block") {
      await Database.update("transactions", { status: "failed", updated_at: new Date().toISOString() }, { id: transactionId, business_id: link.business_id });
      res.status(402).json({ success: false, error: "Payment blocked by risk controls", transaction_id: transactionId, risk_level: fraudScore.risk_level });
      return;
    }

    if (fraudScore.action_taken === "review" || fraudScore.action_taken === "challenge") {
      res.status(202).json({ success: false, status: "requires_action", transaction_id: transactionId, risk_level: fraudScore.risk_level, message: "Additional verification is required" });
      return;
    }

    const payment = await stripeIntegration.processPayment({
      amount: amountCents,
      currency: link.currency,
      cardToken: input.card_token,
      cardholderName: input.customer_name || "Customer",
      description: link.name,
      merchantId: link.business_id,
      transactionId,
      metadata: { payment_link_id: link.id, idempotency_key: idempotencyKey, ...(input.metadata || {}) },
    });
    const succeeded = payment.status === "succeeded";

    const updated = await Database.update(
      "transactions",
      {
        status: succeeded ? "completed" : "failed",
        processor_transaction_id: payment.chargeId || null,
        processor_charge_id: payment.chargeId || null,
        updated_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      },
      { id: transactionId, business_id: link.business_id }
    );

    if (succeeded) {
      await ledgerService.record({
        businessId: link.business_id,
        transactionId,
        type: "payment",
        amountCents,
        currency: link.currency,
        description: link.name,
        metadata: { payment_link_id: link.id },
      });
      await Database.insert("payment_link_transactions", {
        id: `plt_${crypto.randomUUID()}`,
        payment_link_id: link.id,
        transaction_id: transactionId,
        created_at: new Date().toISOString(),
      });
    }

    res.status(succeeded ? 200 : 402).json({
      success: succeeded,
      transaction_id: updated[0]?.id || transactionId,
      status: succeeded ? "completed" : "failed",
      amount_cents: amountCents,
      currency: link.currency,
      receipt_url: payment.receiptUrl,
      error: payment.failureMessage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "Invalid checkout request", details: error.errors });
      return;
    }
    console.error("Payment link checkout error:", error);
    res.status(500).json({ success: false, error: "Checkout could not be completed" });
  }
};
