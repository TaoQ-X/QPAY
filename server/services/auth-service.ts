import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

/**
 * Authentication Service
 * Handles user registration, login, JWT token generation, and session management
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: "active" | "inactive" | "suspended" | "deleted";
  emailVerified: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  userId: string;
  merchantId?: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}

class AuthService {
  private jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";
  private refreshTokenSecret =
    process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-change-in-production";
  private accessTokenExpiry = "15m"; // 15 minutes
  private refreshTokenExpiry = "7d"; // 7 days

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(userId: string, merchantId?: string): AuthTokens {
    const accessToken = jwt.sign(
      {
        userId,
        merchantId,
        type: "access",
        iat: Math.floor(Date.now() / 1000),
      },
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        merchantId,
        type: "refresh",
        iat: Math.floor(Date.now() / 1000),
      },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    // Calculate expiry
    const decoded = jwt.decode(accessToken) as any;
    const expiresIn = decoded.exp - decoded.iat;

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): { userId: string; merchantId?: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      if (decoded.type !== "access") {
        return null;
      }
      return {
        userId: decoded.userId,
        merchantId: decoded.merchantId,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): { userId: string; merchantId?: string } | null {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as any;
      if (decoded.type !== "refresh") {
        return null;
      }
      return {
        userId: decoded.userId,
        merchantId: decoded.merchantId,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate API key for merchant
   */
  generateAPIKey(): { key: string; hash: string } {
    const key = `qpay_${crypto.randomBytes(32).toString("hex")}`;
    const hash = crypto.createHash("sha256").update(key).digest("hex");
    return { key, hash };
  }

  /**
   * Validate API key
   */
  validateAPIKey(providedKey: string): { valid: boolean; keyHash?: string } {
    const hash = crypto.createHash("sha256").update(providedKey).digest("hex");
    // In production, look up hash in database
    return {
      valid: true,
      keyHash: hash,
    };
  }

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(email: string): string {
    return jwt.sign(
      {
        email,
        type: "email_verification",
      },
      this.jwtSecret,
      { expiresIn: "24h" }
    );
  }

  /**
   * Verify email verification token
   */
  verifyEmailToken(token: string): { email: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      if (decoded.type !== "email_verification") {
        return null;
      }
      return { email: decoded.email };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(userId: string): string {
    return jwt.sign(
      {
        userId,
        type: "password_reset",
      },
      this.jwtSecret,
      { expiresIn: "1h" }
    );
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      if (decoded.type !== "password_reset") {
        return null;
      }
      return { userId: decoded.userId };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate 2FA token
   */
  generate2FAToken(userId: string): { code: string; secret: string } {
    const code = crypto.randomInt(100000, 999999).toString();
    const secret = crypto.randomBytes(32).toString("hex");
    return { code, secret };
  }

  /**
   * Validate email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push("Password must be at least 12 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain uppercase letters");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain lowercase letters");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain numbers");
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push("Password must contain special characters (!@#$%^&*)");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate rate limit token for IP/user
   */
  generateRateLimitKey(ipAddress: string, endpoint: string): string {
    return crypto
      .createHash("sha256")
      .update(`${ipAddress}:${endpoint}`)
      .digest("hex");
  }
}

export const authService = new AuthService();
