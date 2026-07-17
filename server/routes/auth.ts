import { RequestHandler } from "express";
import { z } from "zod";
import Database from "../database/client";
import { authService } from "../services/auth-service";
import crypto from "crypto";

/**
 * Auth Routes - User and Merchant Authentication
 * Handles: register, login, refresh token, logout, password reset
 */

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name is required"),
  business_name: z.string().min(2, "Business name is required"),
  business_type: z.enum(["sme", "enterprise"]),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

const passwordResetSchema = z.object({
  email: z.string().email("Invalid email"),
});

const passwordResetConfirmSchema = z.object({
  reset_token: z.string(),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Register a new user and business
 * POST /api/auth/register
 */
export const handleRegister: RequestHandler = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await Database.getOne(
      "SELECT id FROM business_users WHERE email = $1",
      [validatedData.email]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(validatedData.password);

    // Create business record
    const businessId = `biz_${crypto.randomBytes(8).toString("hex")}`;
    const apiKey = `sk_live_${crypto.randomBytes(16).toString("hex")}`;
    
    const business = await Database.insert("businesses", {
      id: businessId,
      name: validatedData.business_name,
      type: validatedData.business_type,
      email: validatedData.email,
      phone: validatedData.phone || null,
      industry: "", // Will be filled in onboarding
      country: "", // Will be filled in onboarding
      api_key: apiKey,
      kyc_status: "pending",
      aml_check_status: "pending",
      verified_email: false,
      verified_phone: false,
      settlement_frequency: "daily",
      settlement_currency: "USD",
      pricing_tier: "starter",
      transaction_fee_percent: 2.9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create business user (owner)
    const userId = `user_${crypto.randomBytes(8).toString("hex")}`;
    const businessUser = await Database.insert("business_users", {
      id: userId,
      business_id: businessId,
      email: validatedData.email,
      password_hash: hashedPassword,
      full_name: validatedData.full_name,
      role: "admin",
      permissions: ["all"],
      verified_email: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Generate tokens
    const accessToken = authService.generateAccessToken(userId, businessId);
    const refreshToken = authService.generateRefreshToken(userId);

    // Store refresh token session
    await Database.insert("user_sessions", {
      id: `session_${crypto.randomBytes(8).toString("hex")}`,
      user_id: userId,
      refresh_token: refreshToken,
      ip_address: req.ip || "",
      user_agent: req.get("user-agent") || "",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    // Log the registration
    console.log(`[AUTH] New user registered: ${validatedData.email} (${businessId})`);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: userId,
        email: businessUser.email,
        full_name: businessUser.full_name,
        business_id: businessId,
      },
      business: {
        id: businessId,
        name: business.name,
        type: business.type,
        api_key: apiKey,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: 3600,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }

    console.error("[AUTH] Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await Database.getOne(
      `SELECT bu.*, b.id as business_id, b.name as business_name, b.api_key
       FROM business_users bu
       JOIN businesses b ON bu.business_id = b.id
       WHERE bu.email = $1`,
      [validatedData.email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password
    const passwordValid = await authService.verifyPassword(
      validatedData.password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const accessToken = authService.generateAccessToken(user.id, user.business_id);
    const refreshToken = authService.generateRefreshToken(user.id);

    // Store refresh token session
    await Database.insert("user_sessions", {
      id: `session_${crypto.randomBytes(8).toString("hex")}`,
      user_id: user.id,
      refresh_token: refreshToken,
      ip_address: req.ip || "",
      user_agent: req.get("user-agent") || "",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    // Update last login
    await Database.update(
      "business_users",
      { last_login: new Date().toISOString() },
      { id: user.id }
    );

    console.log(`[AUTH] User logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        business_id: user.business_id,
        role: user.role,
      },
      business: {
        id: user.business_id,
        name: user.business_name,
        api_key: user.api_key,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "Bearer",
        expires_in: 3600,
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

    console.error("[AUTH] Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export const handleRefresh: RequestHandler = async (req, res) => {
  try {
    const validatedData = refreshSchema.parse(req.body);

    // Find and verify refresh token
    const session = await Database.getOne(
      `SELECT us.*, bu.business_id FROM user_sessions us
       JOIN business_users bu ON us.user_id = bu.id
       WHERE us.refresh_token = $1 AND us.expires_at > NOW()`,
      [validatedData.refresh_token]
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Verify token signature
    try {
      authService.verifyRefreshToken(validatedData.refresh_token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Revoke old session
    await Database.update(
      "user_sessions",
      { revoked_at: new Date().toISOString() },
      { id: session.id }
    );

    // Generate new tokens
    const accessToken = authService.generateAccessToken(
      session.user_id,
      session.business_id
    );
    const newRefreshToken = authService.generateRefreshToken(session.user_id);

    // Create new session
    await Database.insert("user_sessions", {
      id: `session_${crypto.randomBytes(8).toString("hex")}`,
      user_id: session.user_id,
      refresh_token: newRefreshToken,
      ip_address: req.ip || "",
      user_agent: req.get("user-agent") || "",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    console.log(`[AUTH] Token refreshed for user: ${session.user_id}`);

    res.status(200).json({
      success: true,
      tokens: {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        token_type: "Bearer",
        expires_in: 3600,
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

    console.error("[AUTH] Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Token refresh failed",
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const handleLogout: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided",
      });
    }

    // Extract user ID from token
    const payload = authService.verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    // Revoke all sessions for this user
    await Database.update(
      "user_sessions",
      { revoked_at: new Date().toISOString() },
      { user_id: payload.userId, revoked_at: null }
    );

    console.log(`[AUTH] User logged out: ${payload.userId}`);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("[AUTH] Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

/**
 * Request password reset
 * POST /api/auth/password-reset
 */
export const handlePasswordReset: RequestHandler = async (req, res) => {
  try {
    const validatedData = passwordResetSchema.parse(req.body);

    // Find user by email
    const user = await Database.getOne(
      "SELECT id FROM business_users WHERE email = $1",
      [validatedData.email]
    );

    if (!user) {
      // Don't reveal whether email exists
      return res.status(200).json({
        success: true,
        message: "If an account exists with that email, a reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Store reset token
    await Database.insert("password_reset_tokens", {
      id: `reset_${crypto.randomBytes(8).toString("hex")}`,
      user_id: user.id,
      token_hash: resetTokenHash,
      expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour
      created_at: new Date().toISOString(),
    });

    // In production, send email with reset link containing resetToken
    console.log(`[AUTH] Password reset requested for: ${validatedData.email} (token: ${resetToken})`);

    res.status(200).json({
      success: true,
      message: "If an account exists with that email, a reset link has been sent",
      // In development, return token for testing
      ...(process.env.NODE_ENV !== "production" && { reset_token: resetToken }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("[AUTH] Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

/**
 * Confirm password reset
 * POST /api/auth/password-reset-confirm
 */
export const handlePasswordResetConfirm: RequestHandler = async (req, res) => {
  try {
    const validatedData = passwordResetConfirmSchema.parse(req.body);

    // Hash the provided token
    const resetTokenHash = crypto.createHash("sha256").update(validatedData.reset_token).digest("hex");

    // Find valid reset token
    const resetRecord = await Database.getOne(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [resetTokenHash]
    );

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const hashedPassword = await authService.hashPassword(validatedData.new_password);

    // Update user password
    await Database.update(
      "business_users",
      { password_hash: hashedPassword, updated_at: new Date().toISOString() },
      { id: resetRecord.user_id }
    );

    // Mark token as used
    await Database.update(
      "password_reset_tokens",
      { used_at: new Date().toISOString() },
      { id: resetRecord.id }
    );

    // Revoke all sessions for this user
    await Database.update(
      "user_sessions",
      { revoked_at: new Date().toISOString() },
      { user_id: resetRecord.user_id, revoked_at: null }
    );

    console.log(`[AUTH] Password reset completed for user: ${resetRecord.user_id}`);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("[AUTH] Password reset confirm error:", error);
    res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

/**
 * Verify email with token
 * POST /api/auth/verify-email
 */
export const handleVerifyEmail: RequestHandler = async (req, res) => {
  try {
    const { verification_token } = req.body;

    if (!verification_token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Find and verify token
    const verificationRecord = await Database.getOne(
      `SELECT * FROM email_verification_tokens
       WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL`,
      [verification_token]
    );

    if (!verificationRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Update user verified status
    await Database.update(
      "business_users",
      { verified_email: true, updated_at: new Date().toISOString() },
      { id: verificationRecord.user_id }
    );

    // Mark token as used
    await Database.update(
      "email_verification_tokens",
      { used_at: new Date().toISOString() },
      { id: verificationRecord.id }
    );

    console.log(`[AUTH] Email verified for user: ${verificationRecord.user_id}`);

    res.status(200).json({
      success: true,
      message: "Email verification successful",
    });
  } catch (error) {
    console.error("[AUTH] Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
};
