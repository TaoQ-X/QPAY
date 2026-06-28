import { RequestHandler } from "express";
import { z } from "zod";
import { InvoiceAutomationService } from "../services/invoice-automation-service";

const createInvoiceSequenceSchema = z.object({
  sequence_type: z.string().default("general"),
  prefix: z.string().max(20).default("INV"),
  padding_digits: z.number().min(1).max(10).default(6),
  format_template: z
    .string()
    .max(100)
    .default("{prefix}-{sequence}"),
});

/**
 * Initialize invoice sequence for merchant
 * POST /api/invoices/sequences/init
 */
export const handleInitializeInvoiceSequence: RequestHandler = async (
  req,
  res
) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const validatedData = createInvoiceSequenceSchema.parse(req.body);

    const sequence = await InvoiceAutomationService.initializeSequence(
      merchantId,
      validatedData
    );

    res.status(201).json({
      success: true,
      data: sequence,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error initializing invoice sequence:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize invoice sequence",
    });
  }
};

/**
 * Generate next invoice number
 * POST /api/invoices/next-number
 */
export const handleGenerateInvoiceNumber: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const sequenceType = req.body.sequence_type || "general";

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const result = await InvoiceAutomationService.generateInvoiceNumber(
      merchantId,
      sequenceType
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error generating invoice number:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate invoice number",
    });
  }
};

/**
 * Create invoice job for transaction
 * POST /api/invoices/jobs
 */
export const handleCreateInvoiceJob: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const { transaction_id, sequence_type = "general" } = req.body;

    if (!merchantId || !transaction_id) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID and transaction ID are required",
      });
    }

    const job = await InvoiceAutomationService.createInvoiceJob(
      merchantId,
      transaction_id,
      sequence_type
    );

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error creating invoice job:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create invoice job",
    });
  }
};

/**
 * Get invoice job by transaction
 * GET /api/invoices/job/:transactionId
 */
export const handleGetInvoiceJobByTransaction: RequestHandler = async (
  req,
  res
) => {
  try {
    const { transactionId } = req.params;

    const job = await InvoiceAutomationService.getInvoiceJobByTransaction(
      transactionId
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Invoice job not found",
      });
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error fetching invoice job:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice job",
    });
  }
};

/**
 * Get merchant invoice jobs
 * GET /api/invoices/jobs
 */
export const handleGetMerchantInvoiceJobs: RequestHandler = async (
  req,
  res
) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const { jobs, total } = await InvoiceAutomationService.getMerchantInvoiceJobs(
      merchantId,
      status,
      limit,
      offset
    );

    res.json({
      success: true,
      data: jobs,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error("Error fetching invoice jobs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice jobs",
    });
  }
};

/**
 * Update invoice job status
 * PUT /api/invoices/jobs/:jobId
 */
export const handleUpdateInvoiceJobStatus: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, ...metadata } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const updated = await InvoiceAutomationService.updateJobStatus(
      jobId,
      status,
      metadata
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Invoice job not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating invoice job:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update invoice job",
    });
  }
};

/**
 * Record invoice delivery
 * POST /api/invoices/jobs/:jobId/delivered
 */
export const handleRecordInvoiceDelivery: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { method, recipient } = req.body;

    if (!method || !recipient) {
      return res.status(400).json({
        success: false,
        message: "Method and recipient are required",
      });
    }

    const updated = await InvoiceAutomationService.recordInvoiceDelivery(
      jobId,
      method,
      recipient
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error recording invoice delivery:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record invoice delivery",
    });
  }
};

/**
 * Get invoice statistics
 * GET /api/invoices/stats
 */
export const handleGetAutomationInvoiceStats: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const daysBack = parseInt(req.query.daysBack as string) || 30;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID is required",
      });
    }

    const stats = await InvoiceAutomationService.getInvoiceStats(
      merchantId,
      daysBack
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice statistics",
    });
  }
};

/**
 * Get invoice details
 * GET /api/invoices/:jobId/details
 */
export const handleGetInvoiceDetails: RequestHandler = async (req, res) => {
  try {
    const { jobId } = req.params;

    const details = await InvoiceAutomationService.getInvoiceDetails(jobId);

    if (!details) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice details",
    });
  }
};
