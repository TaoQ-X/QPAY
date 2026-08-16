import { RequestHandler } from "express";
import { z } from "zod";
import crypto from "crypto";
import Database from "../database/client";

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1).max(50),
});

const hashSecret = (secret: string) =>
  crypto.createHash("sha256").update(secret).digest("hex");

export const handleCreateWebhookEndpoint: RequestHandler = async (req, res) => {
  try {
    const businessId = req.merchantId;
    if (!businessId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }

    const { url, events } = webhookSchema.parse(req.body);
    const secret = `whsec_${crypto.randomBytes(24).toString("hex")}`;
    const endpoint = await Database.insert("webhook_endpoints", {
      id: `wh_${crypto.randomUUID()}`,
      business_id: businessId,
      url,
      secret_hash: hashSecret(secret),
      events,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      endpoint: {
        id: endpoint.id,
        url: endpoint.url,
        events: endpoint.events,
        is_active: endpoint.is_active,
        created_at: endpoint.created_at,
      },
      secret,
      warning: "Store this signing secret securely; it will not be shown again.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "Invalid webhook endpoint", details: error.errors });
      return;
    }
    console.error("Create webhook endpoint error:", error);
    res.status(500).json({ success: false, error: "Failed to create webhook endpoint" });
  }
};

export const handleListWebhookEndpoints: RequestHandler = async (req, res) => {
  try {
    if (!req.merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }
    const endpoints = await Database.getMany(
      `SELECT id, url, events, is_active, created_at, updated_at
       FROM webhook_endpoints WHERE business_id = $1 ORDER BY created_at DESC`,
      [req.merchantId]
    );
    res.json({ success: true, endpoints });
  } catch (error) {
    console.error("List webhook endpoints error:", error);
    res.status(500).json({ success: false, error: "Failed to list webhook endpoints" });
  }
};

export const handleDeleteWebhookEndpoint: RequestHandler = async (req, res) => {
  try {
    if (!req.merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }
    const rows = await Database.update(
      "webhook_endpoints",
      { is_active: false, updated_at: new Date().toISOString() },
      { id: req.params.endpointId, business_id: req.merchantId }
    );
    if (!rows.length) {
      res.status(404).json({ success: false, error: "Webhook endpoint not found" });
      return;
    }
    res.json({ success: true, message: "Webhook endpoint disabled" });
  } catch (error) {
    console.error("Delete webhook endpoint error:", error);
    res.status(500).json({ success: false, error: "Failed to disable webhook endpoint" });
  }
};

export const handleListWebhookDeliveries: RequestHandler = async (req, res) => {
  try {
    if (!req.merchantId) {
      res.status(401).json({ error: "Merchant context required" });
      return;
    }
    const deliveries = await Database.getMany(
      `SELECT d.id, d.event_type, d.status, d.response_status,
              d.attempt_count, d.last_attempt_at, d.next_retry_at, d.created_at
       FROM webhook_deliveries d
       JOIN webhook_endpoints e ON e.id = d.webhook_endpoint_id
       WHERE e.business_id = $1
       ORDER BY d.created_at DESC LIMIT 100`,
      [req.merchantId]
    );
    res.json({ success: true, deliveries });
  } catch (error) {
    console.error("List webhook deliveries error:", error);
    res.status(500).json({ success: false, error: "Failed to list webhook deliveries" });
  }
};
