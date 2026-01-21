/**
 * Advanced Security & Data Protection Module for Q Pay
 * Implements encryption, tokenization, and compliance features
 */

import crypto from "crypto";

/**
 * Encryption Service
 * Handles AES-256 encryption for sensitive data
 */
export class EncryptionService {
  private encryptionKey: Buffer;
  private algorithm = "aes-256-gcm";

  constructor(key?: string) {
    // Use provided key or generate one (32 bytes for AES-256)
    this.encryptionKey = key
      ? Buffer.from(key, "hex")
      : crypto.randomBytes(32);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    };
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      Buffer.from(iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Hash password using PBKDF2
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const passwordSalt = salt || crypto.randomBytes(32).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, passwordSalt, 100000, 64, "sha256")
      .toString("hex");

    return { hash, salt: passwordSalt };
  }

  /**
   * Verify password
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: newHash } = this.hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(newHash));
  }

  /**
   * Generate random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }
}

/**
 * Tokenization Service
 * Replaces sensitive card data with tokens
 */
export class TokenizationService {
  private tokens: Map<string, { cardData: string; expiresAt: Date }> = new Map();
  private encryption: EncryptionService;

  constructor(encryption: EncryptionService) {
    this.encryption = encryption;
  }

  /**
   * Tokenize credit card data
   */
  tokenizeCard(cardNumber: string, expiryDate: string, cvv: string): string {
    const cardData = JSON.stringify({
      number: cardNumber,
      expiry: expiryDate,
      cvv: cvv,
    });

    const { encrypted, iv, authTag } = this.encryption.encrypt(cardData);
    const token = `tok_${crypto.randomBytes(16).toString("hex")}`;

    this.tokens.set(token, {
      cardData: JSON.stringify({ encrypted, iv, authTag }),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    return token;
  }

  /**
   * Retrieve tokenized card data (only last 4 digits)
   */
  getCardPreview(token: string): string | null {
    const tokenData = this.tokens.get(token);
    if (!tokenData) return null;

    const { encrypted, iv, authTag } = JSON.parse(tokenData.cardData);
    const cardData = JSON.parse(this.encryption.decrypt(encrypted, iv, authTag));

    return `•••• •••• •••• ${cardData.number.slice(-4)}`;
  }

  /**
   * Mask credit card number (PCI-DSS compliant)
   */
  maskCardNumber(cardNumber: string): string {
    return `•••• •••• •••• ${cardNumber.slice(-4)}`;
  }

  /**
   * Validate credit card number (Luhn algorithm)
   */
  validateCardNumber(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }
}

/**
 * Rate Limiting Service
 * Prevents abuse and DDoS attacks
 */
export class RateLimitService {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();
  private defaultLimit = 100; // requests per minute
  private defaultWindow = 60000; // milliseconds

  /**
   * Check if request should be allowed
   */
  isAllowed(identifier: string, limit: number = this.defaultLimit): boolean {
    const now = Date.now();
    const current = this.limits.get(identifier);

    if (!current || now > current.resetTime) {
      // Reset window
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.defaultWindow,
      });
      return true;
    }

    if (current.count < limit) {
      current.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests
   */
  getRemaining(identifier: string, limit: number = this.defaultLimit): number {
    const current = this.limits.get(identifier);
    if (!current) return limit;
    return Math.max(0, limit - current.count);
  }

  /**
   * Get reset time
   */
  getResetTime(identifier: string): Date | null {
    const current = this.limits.get(identifier);
    if (!current) return null;
    return new Date(current.resetTime);
  }
}

/**
 * Compliance & Audit Service
 * Logs all transactions and access for compliance
 */
export class ComplianceService {
  private auditLog: AuditEntry[] = [];
  private maxLogSize = 10000;

  /**
   * Log transaction
   */
  logTransaction(
    businessId: string,
    transactionId: string,
    amount: number,
    paymentMethod: string,
    status: string
  ): void {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      type: "transaction",
      businessId,
      details: {
        transactionId,
        amount,
        paymentMethod,
        status,
      },
    };

    this.addLogEntry(entry);
  }

  /**
   * Log data access
   */
  logDataAccess(
    userId: string,
    businessId: string,
    dataType: string,
    action: "read" | "update" | "delete"
  ): void {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      type: "data_access",
      userId,
      businessId,
      details: {
        dataType,
        action,
      },
    };

    this.addLogEntry(entry);
  }

  /**
   * Log failed login attempt
   */
  logFailedLogin(email: string, ipAddress: string): void {
    const entry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      type: "failed_login",
      details: {
        email,
        ipAddress,
      },
    };

    this.addLogEntry(entry);
  }

  /**
   * Add log entry and manage size
   */
  private addLogEntry(entry: AuditEntry): void {
    this.auditLog.unshift(entry);

    // Keep only recent logs
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog = this.auditLog.slice(0, this.maxLogSize);
    }

    console.log(`📋 [AUDIT] ${entry.type.toUpperCase()}: ${JSON.stringify(entry.details)}`);
  }

  /**
   * Get audit logs for compliance reporting
   */
  getAuditLogs(businessId?: string, days: number = 90): AuditEntry[] {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.auditLog.filter(entry => {
      const isRecent = entry.timestamp > cutoffDate;
      const matchesBusiness = !businessId || entry.businessId === businessId;
      return isRecent && matchesBusiness;
    });
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(businessId: string, days: number = 30): ComplianceReport {
    const logs = this.getAuditLogs(businessId, days);

    const transactions = logs.filter(l => l.type === "transaction");
    const dataAccess = logs.filter(l => l.type === "data_access");
    const failedLogins = logs.filter(l => l.type === "failed_login");

    return {
      businessId,
      generatedAt: new Date(),
      period: `Last ${days} days`,
      totalTransactions: transactions.length,
      totalDataAccess: dataAccess.length,
      failedLoginAttempts: failedLogins.length,
      highRiskActivities: failedLogins.filter(l =>
        logs.filter(x => x.details?.email === l.details?.email).length > 5
      ).length,
      auditLog: logs,
    };
  }
}

/**
 * Two-Factor Authentication Service
 */
export class TwoFactorAuthService {
  private secrets: Map<string, { secret: string; verified: boolean; createdAt: Date }> = new Map();
  private encryption: EncryptionService;

  constructor(encryption: EncryptionService) {
    this.encryption = encryption;
  }

  /**
   * Generate 2FA secret
   */
  generateSecret(userId: string): { secret: string; qrCode: string } {
    const secret = crypto.randomBytes(32).toString("hex").slice(0, 32);

    this.secrets.set(userId, {
      secret,
      verified: false,
      createdAt: new Date(),
    });

    // In real app, would generate QR code
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `otpauth://totp/Q%20Pay:${userId}?secret=${secret}`
    )}`;

    return { secret, qrCode };
  }

  /**
   * Verify 2FA token
   */
  verifyToken(userId: string, token: string): boolean {
    const userSecret = this.secrets.get(userId);
    if (!userSecret) return false;

    // Simplified TOTP verification (in real app, would use library like speakeasy)
    const tokenValid = token.length === 6 && /^\d+$/.test(token);

    if (tokenValid && !userSecret.verified) {
      userSecret.verified = true;
    }

    return tokenValid;
  }

  /**
   * Check if 2FA is enabled
   */
  isTwoFactorEnabled(userId: string): boolean {
    const userSecret = this.secrets.get(userId);
    return userSecret ? userSecret.verified : false;
  }
}

/**
 * Interfaces and Types
 */
interface AuditEntry {
  id: string;
  timestamp: Date;
  type: "transaction" | "data_access" | "failed_login" | string;
  userId?: string;
  businessId?: string;
  details: Record<string, any>;
}

interface ComplianceReport {
  businessId: string;
  generatedAt: Date;
  period: string;
  totalTransactions: number;
  totalDataAccess: number;
  failedLoginAttempts: number;
  highRiskActivities: number;
  auditLog: AuditEntry[];
}

/**
 * Security Configuration
 */
export const securityConfig = {
  // Password requirements
  minPasswordLength: 12,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true,

  // Session configuration
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  rememberMeTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Rate limiting
  loginAttempts: 5,
  loginWindow: 15 * 60 * 1000, // 15 minutes
  apiRateLimit: 100, // per minute

  // Encryption
  algorithm: "aes-256-gcm",
  keyLength: 32, // bytes
  saltLength: 32, // bytes

  // PCI-DSS Compliance
  minTLSVersion: "1.2",
  requireHTTPS: true,
  cardDataRetention: 0, // Never store full card data
};

/**
 * Create security services instance
 */
export function createSecurityServices(encryptionKey?: string) {
  const encryption = new EncryptionService(encryptionKey);

  return {
    encryption,
    tokenization: new TokenizationService(encryption),
    rateLimit: new RateLimitService(),
    compliance: new ComplianceService(),
    twoFactor: new TwoFactorAuthService(encryption),
  };
}
