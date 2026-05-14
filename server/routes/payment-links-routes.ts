import { RequestHandler } from "express";
import { z } from "zod";
import { PaymentLinksService } from "../services/payment-links-service";

const createLinkSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(1000).optional(),
  amount_cents: z.number().min(1).optional(),
  is_variable_amount: z.boolean().optional(),
  min_amount_cents: z.number().min(1).optional(),
  max_amount_cents: z.number().min(1).optional(),
  currency: z.string().length(3).default("USD"),
  theme_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  custom_message: z.string().max(500).optional(),
  redirect_url: z.string().url().optional(),
  expires_at: z.string().datetime().optional(),
});

/**
 * Create a new payment link
 * POST /api/payment-links
 */
export const handleCreatePaymentLink: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const userId = req.user?.id;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const validatedData = createLinkSchema.parse(req.body);

    const link = await PaymentLinksService.createPaymentLink(
      merchantId,
      validatedData,
      userId
    );

    const publicUrl = PaymentLinksService.getPublicLinkUrl(link.slug);

    res.status(201).json({
      success: true,
      data: {
        ...link,
        public_url: publicUrl,
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

    console.error("Error creating payment link:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment link",
    });
  }
};

/**
 * Get public payment link (no auth required)
 * GET /api/payment-links/:slug/checkout
 */
export const handleGetPaymentLinkCheckout: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;
    const ip = req.ip || req.socket?.remoteAddress;
    const ua = req.get("user-agent");

    // Record click for analytics
    const link = await PaymentLinksService.getPaymentLinkBySlug(slug);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Payment link not found or has expired",
      });
    }

    // Record click asynchronously
    if (link.id) {
      PaymentLinksService.recordLinkClick(link.id, ip, ua).catch(console.error);
    }

    res.json({
      success: true,
      data: {
        id: link.id,
        title: link.title,
        description: link.description,
        amount_cents: link.amount_cents,
        is_variable_amount: link.is_variable_amount,
        min_amount_cents: link.min_amount_cents,
        max_amount_cents: link.max_amount_cents,
        currency: link.currency,
        theme_color: link.theme_color,
        custom_message: link.custom_message,
      },
    });
  } catch (error) {
    console.error("Error fetching payment link:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment link",
    });
  }
};

/**
 * List merchant payment links
 * GET /api/payment-links
 */
export const handleListPaymentLinks: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const { links, total } = await PaymentLinksService.listMerchantLinks(
      merchantId,
      limit,
      offset
    );

    const linksWithUrls = links.map((link: any) => ({
      ...link,
      public_url: PaymentLinksService.getPublicLinkUrl(link.slug),
    }));

    res.json({
      success: true,
      data: linksWithUrls,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error("Error listing payment links:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment links",
    });
  }
};

/**
 * Get payment link by ID
 * GET /api/payment-links/:id
 */
export const handleGetPaymentLink: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const link = await PaymentLinksService.getPaymentLink(id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Payment link not found",
      });
    }

    const analytics = await PaymentLinksService.getPaymentLinkAnalytics(id);
    const publicUrl = PaymentLinksService.getPublicLinkUrl(link.slug);

    res.json({
      success: true,
      data: {
        ...link,
        public_url: publicUrl,
        analytics,
      },
    });
  } catch (error) {
    console.error("Error fetching payment link:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment link",
    });
  }
};

/**
 * Update payment link
 * PUT /api/payment-links/:id
 */
export const handleUpdatePaymentLink: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = createLinkSchema.partial().parse(req.body);

    const updated = await PaymentLinksService.updatePaymentLink(id, validatedData);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Payment link not found",
      });
    }

    const publicUrl = PaymentLinksService.getPublicLinkUrl(updated.slug);

    res.json({
      success: true,
      data: {
        ...updated,
        public_url: publicUrl,
      },
    });
  } catch (error) {
    console.error("Error updating payment link:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment link",
    });
  }
};

/**
 * Archive payment link
 * DELETE /api/payment-links/:id
 */
export const handleArchivePaymentLink: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const archived = await PaymentLinksService.archivePaymentLink(id);

    if (!archived) {
      return res.status(404).json({
        success: false,
        message: "Payment link not found",
      });
    }

    res.json({
      success: true,
      message: "Payment link archived",
      data: archived,
    });
  } catch (error) {
    console.error("Error archiving payment link:", error);
    res.status(500).json({
      success: false,
      message: "Failed to archive payment link",
    });
  }
};

/**
 * Get payment link analytics
 * GET /api/payment-links/:id/analytics
 */
export const handleGetPaymentLinkAnalytics: RequestHandler = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const analytics = await PaymentLinksService.getPaymentLinkAnalytics(id);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching payment link analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

/**
 * Check slug availability
 * GET /api/payment-links/check-slug/:slug
 */
export const handleCheckSlugAvailability: RequestHandler = async (req, res) => {
  try {
    const { slug } = req.params;

    const available = await PaymentLinksService.isSlugAvailable(slug);

    res.json({
      success: true,
      data: { slug, available },
    });
  } catch (error) {
    console.error("Error checking slug availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check slug availability",
    });
  }
};
