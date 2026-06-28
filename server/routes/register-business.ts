import { RequestHandler } from "express";
import { z } from "zod";
import {
  RegisterBusinessRequest,
  RegisterBusinessResponse,
} from "@shared/database";

// Validation schema
const registerBusinessSchema = z.object({
  name: z.string().min(2, "Business name is required").max(100),
  type: z.enum(["sme", "enterprise"], { message: "Invalid business type" }),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  industry: z.string().min(2, "Industry is required").max(50),
  country: z.string().min(2).max(2), // ISO country code, allow 2+ chars for validation
  region: z.string().optional().or(z.literal("")),
  settlement_currency: z.string().min(3).max(3), // ISO currency code
  settlement_frequency: z.enum(["daily", "weekly", "monthly"], { message: "Invalid settlement frequency" }),
  full_name: z.string().min(2, "Full name is required").max(100),
}).transform((data) => ({
  ...data,
  phone: data.phone || undefined,
  website: data.website || undefined,
  description: data.description || undefined,
  region: data.region || undefined,
}));

/**
 * Register a new business
 * POST /api/register-business
 */
export const handleRegisterBusiness: RequestHandler = async (req, res) => {
  try {
    // Validate request body
    const validatedData = registerBusinessSchema.parse(req.body);

    // In production, you would:
    // 1. Connect to Supabase
    // 2. Check if email already exists
    // 3. Create business record
    // 4. Generate API keys
    // 5. Send verification email
    // 6. Trigger AI agent for onboarding

    // Mock response for now
    const mockBusinessId = `biz_${Date.now()}`;
    const mockApiKey = `sk_live_${Math.random().toString(36).substr(2, 20)}`;

    const response: RegisterBusinessResponse = {
      success: true,
      business_id: mockBusinessId,
      api_key: mockApiKey,
      message: `Business "${validatedData.name}" registered successfully. Please check your email for verification.`,
    };

    // Log the registration (for AI agent consumption)
    console.log(`[REGISTRATION] New ${validatedData.type} business:`, {
      name: validatedData.name,
      email: validatedData.email,
      industry: validatedData.industry,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    } else {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to register business",
      });
    }
  }
};

/**
 * Get business analytics
 * GET /api/business/:businessId/analytics
 */
export const handleGetBusinessAnalytics: RequestHandler = async (
  req,
  res
) => {
  try {
    const { businessId } = req.params;

    // Log the incoming request for debugging
    console.log(`[ANALYTICS] Request for businessId: "${businessId}"`);

    // Validate businessId - accept more flexible patterns
    if (!businessId || typeof businessId !== "string" || businessId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid business ID",
      });
    }

    // Mock response - returns demo analytics data
    const analyticsResponse = {
      success: true,
      data: {
        total_revenue: 150000, // in cents = $1500
        total_transactions: 42,
        active_customers: 28,
        kyc_status: "verified",
        next_settlement: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        monthly_volume_remaining: 500000, // $5000
        chart_data: {
          daily: [
            { date: "2024-01-15", amount: 5000, count: 5 },
            { date: "2024-01-16", amount: 8000, count: 7 },
            { date: "2024-01-17", amount: 6500, count: 6 },
          ],
        },
      },
    };

    // Ensure we're returning valid JSON with proper headers
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).json(analyticsResponse);
  } catch (error) {
    console.error("Analytics error:", error);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

/**
 * List business transactions
 * GET /api/business/:businessId/transactions
 */
export const handleListBusinessTransactions: RequestHandler = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { limit = "20", offset = "0" } = req.query;

    // Mock response
    const response = {
      success: true,
      data: [
        {
          id: "txn_1",
          amount: 5000,
          currency: "USD",
          status: "completed",
          blockchain_hash: "0x1234567890abcdef",
          created_at: new Date().toISOString(),
        },
        {
          id: "txn_2",
          amount: 3000,
          currency: "USD",
          status: "completed",
          blockchain_hash: "0xfedcba0987654321",
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
      ],
      total: 42,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    res.json(response);
  } catch (error) {
    console.error("Transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

/**
 * Verify business email
 * POST /api/business/:businessId/verify-email
 */
export const handleVerifyEmail: RequestHandler = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { code } = req.body;

    // In production, verify the code and update business record
    const response = {
      success: true,
      message: "Email verified successfully",
      verified_at: new Date().toISOString(),
    };

    res.json(response);
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify email",
    });
  }
};
