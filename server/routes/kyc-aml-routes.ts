import { RequestHandler } from "express";
import { z } from "zod";
import { KYCAMLService } from "../services/kyc-aml-service";

const submitKYCSchema = z.object({
  full_name: z.string().min(2).max(100),
  date_of_birth: z.string().datetime(),
  id_type: z.enum(["passport", "drivers_license", "national_id"]),
  id_number: z.string().min(5).max(20),
  id_expiry: z.string().datetime().optional(),
  country: z.string().length(2).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  business_name: z.string().max(100).optional(),
  business_type: z.string().max(50).optional(),
  tax_id: z.string().max(50).optional(),
});

/**
 * Submit KYC verification
 * POST /api/kyc/submit
 */
export const handleSubmitKYC: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const userId = req.user?.id;

    if (!merchantId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Merchant and user ID required",
      });
    }

    const validatedData = submitKYCSchema.parse(req.body);

    const documentUrls = {
      id_front: req.body.id_front_url,
      id_back: req.body.id_back_url,
      selfie: req.body.selfie_url,
    };

    const verification = await KYCAMLService.submitKYCVerification(
      merchantId,
      userId,
      validatedData,
      documentUrls
    );

    res.status(201).json({
      success: true,
      message: "KYC verification submitted and AML check initiated",
      data: verification,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error submitting KYC:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit KYC verification",
    });
  }
};

/**
 * Get KYC status
 * GET /api/kyc/status
 */
export const handleGetKYCStatus: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID required",
      });
    }

    const kycStatus = await KYCAMLService.getKYCStatus(merchantId);
    const riskProfile = await KYCAMLService.getMerchantRiskProfile(merchantId);

    res.json({
      success: true,
      data: {
        kyc: kycStatus,
        risk_profile: riskProfile,
      },
    });
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KYC status",
    });
  }
};

/**
 * Get AML check history
 * GET /api/kyc/aml-history
 */
export const handleGetAMLHistory: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    if (!merchantId) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID required",
      });
    }

    const history = await KYCAMLService.getAMLCheckHistory(merchantId, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching AML history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch AML history",
    });
  }
};

/**
 * Approve KYC (Admin only)
 * POST /api/kyc/:verificationId/approve
 */
export const handleApproveKYC: RequestHandler = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const approved = await KYCAMLService.approveKYC(verificationId, userId);

    res.json({
      success: true,
      message: "KYC verification approved",
      data: approved,
    });
  } catch (error) {
    console.error("Error approving KYC:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve KYC",
    });
  }
};

/**
 * Reject KYC (Admin only)
 * POST /api/kyc/:verificationId/reject
 */
export const handleRejectKYC: RequestHandler = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason required",
      });
    }

    const rejected = await KYCAMLService.rejectKYC(verificationId, reason, userId);

    res.json({
      success: true,
      message: "KYC verification rejected",
      data: rejected,
    });
  } catch (error) {
    console.error("Error rejecting KYC:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject KYC",
    });
  }
};

/**
 * Request additional documents
 * POST /api/kyc/:verificationId/request-documents
 */
export const handleRequestAdditionalDocuments: RequestHandler = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { documents_needed } = req.body;

    if (!Array.isArray(documents_needed) || documents_needed.length === 0) {
      return res.status(400).json({
        success: false,
        message: "documents_needed array is required",
      });
    }

    const updated = await KYCAMLService.requestAdditionalDocuments(
      verificationId,
      documents_needed
    );

    res.json({
      success: true,
      message: "Additional documents requested",
      data: updated,
    });
  } catch (error) {
    console.error("Error requesting documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to request documents",
    });
  }
};

/**
 * Check merchant verification status
 * GET /api/kyc/merchant/:merchantId/verified
 */
export const handleCheckMerchantVerification: RequestHandler = async (req, res) => {
  try {
    const { merchantId } = req.params;

    const isVerified = await KYCAMLService.isMerchantVerified(merchantId);

    res.json({
      success: true,
      data: {
        merchant_id: merchantId,
        is_verified: isVerified,
        can_process_payments: isVerified,
      },
    });
  } catch (error) {
    console.error("Error checking verification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check verification status",
    });
  }
};

/**
 * Check for suspicious activity
 * POST /api/kyc/check-suspicious-activity
 */
export const handleCheckSuspiciousActivity: RequestHandler = async (req, res) => {
  try {
    const merchantId = req.body.merchantId || req.user?.merchant_id;
    const { activity_type } = req.body;

    if (!merchantId || !activity_type) {
      return res.status(400).json({
        success: false,
        message: "Merchant ID and activity type required",
      });
    }

    const result = await KYCAMLService.checkForSuspiciousActivity(
      merchantId,
      activity_type
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error checking suspicious activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check for suspicious activity",
    });
  }
};
