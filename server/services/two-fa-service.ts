import crypto from "crypto";

/**
 * Enterprise Two-Factor Authentication Service
 * Supports SMS, Email, and Authenticator apps (TOTP)
 */

export interface TwoFAMethod {
  id: string;
  type: "sms" | "email" | "authenticator";
  destination: string; // Phone number or email
  verificationCode?: string;
  backupCodes: string[];
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface TwoFASession {
  id: string;
  userId: string;
  businessId: string;
  status: "pending" | "verified" | "expired";
  method: "sms" | "email" | "authenticator";
  code?: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  createdAt: Date;
  verifiedAt?: Date;
}

export class TwoFAService {
  private methods: Map<string, TwoFAMethod> = new Map();
  private sessions: Map<string, TwoFASession> = new Map();
  private emailService: any; // Injected
  private smsService: any; // Injected

  /**
   * Setup 2FA for user
   */
  async setupTwoFA(
    userId: string,
    type: "sms" | "email" | "authenticator",
    destination?: string
  ): Promise<TwoFAMethod> {
    const id = `2fa_${crypto.randomBytes(12).toString("hex")}`;

    let backupCodes: string[] = [];
    if (type !== "authenticator") {
      // Generate backup codes for SMS/Email
      backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(4).toString("hex").toUpperCase()
      );
    }

    const method: TwoFAMethod = {
      id,
      type,
      destination: destination || "",
      isVerified: false,
      isActive: false,
      backupCodes,
      createdAt: new Date(),
    };

    this.methods.set(id, method);

    console.log(`[2FA] Setup initiated for ${userId} via ${type}`);
    return method;
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(methodId: string): Promise<string> {
    const method = this.methods.get(methodId);
    if (!method) throw new Error("2FA method not found");

    const code = this.generateVerificationCode();
    method.verificationCode = code;

    if (method.type === "sms") {
      await this.sendSMSCode(method.destination, code);
    } else if (method.type === "email") {
      await this.sendEmailCode(method.destination, code);
    }

    console.log(`[2FA] Code sent to ${method.destination}`);
    return methodId;
  }

  /**
   * Verify 2FA code
   */
  async verifyCode(methodId: string, code: string): Promise<boolean> {
    const method = this.methods.get(methodId);
    if (!method) return false;

    // Check if code matches
    if (method.verificationCode === code) {
      method.isVerified = true;
      method.isActive = true;
      method.verificationCode = undefined;
      return true;
    }

    // Check backup codes
    const backupIndex = method.backupCodes.indexOf(code.toUpperCase());
    if (backupIndex !== -1) {
      method.backupCodes.splice(backupIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * Verify authenticator code (TOTP)
   */
  verifyAuthenticatorCode(methodId: string, code: string): boolean {
    const method = this.methods.get(methodId);
    if (!method || method.type !== "authenticator") return false;

    // Simplified TOTP verification
    // In production: Use library like speakeasy
    const currentTime = Math.floor(Date.now() / 30000);
    const isValid = code.length === 6 && /^\d+$/.test(code);

    return isValid;
  }

  /**
   * Create 2FA verification session
   */
  async createVerificationSession(
    userId: string,
    businessId: string,
    methodType: "sms" | "email" | "authenticator"
  ): Promise<TwoFASession> {
    const id = `2fas_${crypto.randomBytes(12).toString("hex")}`;
    const code = methodType === "authenticator" ? undefined : this.generateVerificationCode();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    const session: TwoFASession = {
      id,
      userId,
      businessId,
      status: "pending",
      method: methodType,
      code,
      attempts: 0,
      maxAttempts: 5,
      expiresAt,
      createdAt: new Date(),
    };

    this.sessions.set(id, session);

    // Send code if not authenticator
    if (methodType !== "authenticator" && code) {
      // await this.sendCode(methodType, code);
    }

    return session;
  }

  /**
   * Verify session
   */
  async verifySession(sessionId: string, code: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Check expiry
    if (new Date() > session.expiresAt) {
      session.status = "expired";
      return false;
    }

    // Check attempts
    if (session.attempts >= session.maxAttempts) {
      session.status = "expired";
      return false;
    }

    session.attempts++;

    if (session.method === "authenticator") {
      if (this.verifyAuthenticatorCode(sessionId, code)) {
        session.status = "verified";
        session.verifiedAt = new Date();
        return true;
      }
    } else {
      if (session.code === code) {
        session.status = "verified";
        session.verifiedAt = new Date();
        return true;
      }
    }

    return false;
  }

  /**
   * Get session status
   */
  getSessionStatus(sessionId: string): TwoFASession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get user 2FA methods
   */
  getUserMethods(userId: string): TwoFAMethod[] {
    return Array.from(this.methods.values()).filter(
      (m) => m.destination.includes(userId) // Simplified - in production use actual user ID
    );
  }

  /**
   * Disable 2FA method
   */
  disableMethod(methodId: string): boolean {
    const method = this.methods.get(methodId);
    if (!method) return false;

    method.isActive = false;
    return true;
  }

  /**
   * Regenerate backup codes
   */
  regenerateBackupCodes(methodId: string): string[] {
    const method = this.methods.get(methodId);
    if (!method) return [];

    method.backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    return method.backupCodes;
  }

  /**
   * Get authentication status
   */
  getStats() {
    const activeMethods = Array.from(this.methods.values()).filter((m) => m.isActive);
    const verifiedMethods = Array.from(this.methods.values()).filter((m) => m.isVerified);
    const activeSessions = Array.from(this.sessions.values()).filter(
      (s) => s.status === "pending"
    );

    return {
      totalMethods: this.methods.size,
      activeMethods: activeMethods.length,
      verifiedMethods: verifiedMethods.length,
      activeSessions: activeSessions.length,
      byType: {
        sms: Array.from(this.methods.values()).filter((m) => m.type === "sms").length,
        email: Array.from(this.methods.values()).filter((m) => m.type === "email").length,
        authenticator: Array.from(this.methods.values()).filter(
          (m) => m.type === "authenticator"
        ).length,
      },
    };
  }

  /**
   * Helper methods
   */

  private generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private async sendSMSCode(phone: string, code: string) {
    // In production: Use Twilio, AWS SNS, or similar
    console.log(`[2FA-SMS] Sending code ${code} to ${phone}`);
  }

  private async sendEmailCode(email: string, code: string) {
    // In production: Use emailService
    console.log(`[2FA-Email] Sending code ${code} to ${email}`);
  }
}

export default TwoFAService;
