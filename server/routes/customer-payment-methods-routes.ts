import { RequestHandler } from "express";
import { z } from "zod";
import { CustomerPaymentMethodsService } from "../services/customer-payment-methods-service";

const addPaymentMethodSchema = z.object({
  customer_identifier: z.string().min(1).max(255),
  card_token: z.string().min(10),
  card_brand: z.string().regex(/^(visa|mastercard|amex|discover)$/i),
  card_last_four: z.string().regex(/^\d{4}$/),
  card_expiry_month: z.number().min(1).max(12),
  card_expiry_year: z.number().min(new Date().getFullYear()),
  is_primary: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Add payment method for customer
 * POST /api/customers/payment-methods
 */
export const handleAddPaymentMethod: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const validatedData = addPaymentMethodSchema.parse(req.body);

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const method = await CustomerPaymentMethodsService.addPaymentMethod(
      merchantId,
      validatedData
    );

    res.status(201).json({
      success: true,
      data: method,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error adding payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add payment method",
    });
  }
};

/**
 * Get customer's primary payment method
 * GET /api/customers/:customerId/payment-methods/primary
 */
export const handleGetPrimaryPaymentMethod: RequestHandler = async (
  req,
  res
) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const { customerId } = req.params;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const method = await CustomerPaymentMethodsService.getPrimaryPaymentMethod(
      merchantId,
      customerId
    );

    if (!method) {
      return res.status(404).json({
        success: false,
        message: "No primary payment method found",
      });
    }

    res.json({
      success: true,
      data: method,
    });
  } catch (error) {
    console.error("Error fetching primary payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment method",
    });
  }
};

/**
 * Get all payment methods for customer
 * GET /api/customers/:customerId/payment-methods
 */
export const handleGetCustomerPaymentMethods: RequestHandler = async (
  req,
  res
) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const { customerId } = req.params;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const methods = await CustomerPaymentMethodsService.getCustomerPaymentMethods(
      merchantId,
      customerId
    );

    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
    });
  }
};

/**
 * Mark payment method as expired
 * PUT /api/customers/payment-methods/:methodId/expire
 */
export const handleMarkAsExpired: RequestHandler = async (req, res) => {
  try {
    const { methodId } = req.params;

    const updated = await CustomerPaymentMethodsService.markAsExpired(methodId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error marking payment method as expired:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark payment method as expired",
    });
  }
};

/**
 * Mark payment method as invalid
 * PUT /api/customers/payment-methods/:methodId/invalidate
 */
export const handleMarkAsInvalid: RequestHandler = async (req, res) => {
  try {
    const { methodId } = req.params;

    const updated = await CustomerPaymentMethodsService.markAsInvalid(methodId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error marking payment method as invalid:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark payment method as invalid",
    });
  }
};

/**
 * Archive payment method
 * DELETE /api/customers/payment-methods/:methodId
 */
export const handleArchivePaymentMethod: RequestHandler = async (req, res) => {
  try {
    const { methodId } = req.params;

    const updated = await CustomerPaymentMethodsService.archivePaymentMethod(
      methodId
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found",
      });
    }

    res.json({
      success: true,
      message: "Payment method archived",
      data: updated,
    });
  } catch (error) {
    console.error("Error archiving payment method:", error);
    res.status(500).json({
      success: false,
      message: "Failed to archive payment method",
    });
  }
};

/**
 * Record card updater event
 * POST /api/customers/payment-methods/:methodId/updater-event
 */
export const handleRecordCardUpdaterEvent: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const { methodId } = req.params;
    const {
      event_type,
      processor_response,
      new_expiry_month,
      new_expiry_year,
    } = req.body;

    if (!merchantId || !event_type) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID and event type are required",
      });
    }

    const event = await CustomerPaymentMethodsService.recordCardUpdaterEvent(
      merchantId,
      methodId,
      event_type,
      processor_response,
      {
        expiry_month: new_expiry_month,
        expiry_year: new_expiry_year,
      }
    );

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error recording card updater event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record card updater event",
    });
  }
};

/**
 * Get card updater history
 * GET /api/customers/payment-methods/:methodId/updater-history
 */
export const handleGetMethodUpdaterHistory: RequestHandler = async (
  req,
  res
) => {
  try {
    const { methodId } = req.params;

    const history = await CustomerPaymentMethodsService.getMethodUpdaterHistory(
      methodId
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching card updater history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch updater history",
    });
  }
};

/**
 * Get payment method stats for merchant
 * GET /api/customers/payment-methods/stats
 */
export const handleGetPaymentMethodStats: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const stats = await CustomerPaymentMethodsService.getPaymentMethodStats(
      merchantId
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching payment method stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

/**
 * Webhook for card network updater (PSP integration)
 * POST /api/webhooks/card-updater
 */
export const handleCardUpdaterWebhook: RequestHandler = async (req, res) => {
  try {
    const { merchant_id, payment_method_id, event_type, data } = req.body;

    if (!merchant_id || !payment_method_id || !event_type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    await CustomerPaymentMethodsService.recordCardUpdaterEvent(
      merchant_id,
      payment_method_id,
      event_type,
      data
    );

    res.json({
      success: true,
      message: "Card updater event processed",
    });
  } catch (error) {
    console.error("Error processing card updater webhook:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process webhook",
    });
  }
};
