import crypto from "crypto";

export interface ReferralProgram {
  id: string;
  merchantId: string;
  name: string;
  status: "active" | "paused" | "archived";
  referrerReward: {
    type: "percentage" | "flat";
    value: number;
    currency: string;
    maxReward?: number;
  };
  refereeReward: {
    type: "percentage" | "flat" | "credit";
    value: number;
    currency: string;
    description: string;
  };
  conditions: {
    minimumFirstTransaction: number;
    validityDays: number;
    maxReferralsPerMonth?: number;
  };
  redemptionRules: {
    payoutMethod: "account_balance" | "bank_transfer" | "credit";
    minimumEarnings: number;
    payoutFrequency: "weekly" | "monthly" | "on_demand";
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  programId: string;
  referrerId: string;
  refereeEmail: string;
  referralCode: string;
  status: "pending" | "qualified" | "rewarded" | "failed";
  createdAt: Date;
  qualifiedAt?: Date;
  rewardedAt?: Date;
  firstTransactionAmount?: number;
  referrerEarnings: number;
  refereeRewardApplied: boolean;
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  topReferrers: Array<{ referrerId: string; count: number; earnings: number }>;
  conversionRate: number;
}

class ReferralProgramService {
  private programs: Map<string, ReferralProgram> = new Map();
  private referrals: Map<string, Referral> = new Map();
  private referralCodes: Map<string, string> = new Map(); // code -> referral ID
  private referrerEarnings: Map<string, number> = new Map();
  private programStats: Map<string, ReferralStats> = new Map();

  /**
   * Create a new referral program
   */
  createReferralProgram(program: Omit<ReferralProgram, "id" | "createdAt" | "updatedAt">): ReferralProgram {
    const id = crypto.randomUUID();

    const newProgram: ReferralProgram = {
      ...program,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.programs.set(id, newProgram);
    this.programStats.set(id, {
      totalReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 0,
      totalEarnings: 0,
      topReferrers: [],
      conversionRate: 0,
    });

    return newProgram;
  }

  /**
   * Get pre-configured referral programs
   */
  getDefaultPrograms(): Omit<ReferralProgram, "id" | "createdAt" | "updatedAt">[] {
    return [
      {
        merchantId: "default",
        name: "Standard Referral Program",
        status: "active",
        referrerReward: {
          type: "percentage",
          value: 10,
          currency: "USD",
        },
        refereeReward: {
          type: "credit",
          value: 50,
          currency: "USD",
          description: "$50 credit on first purchase",
        },
        conditions: {
          minimumFirstTransaction: 100,
          validityDays: 90,
          maxReferralsPerMonth: undefined,
        },
        redemptionRules: {
          payoutMethod: "account_balance",
          minimumEarnings: 100,
          payoutFrequency: "monthly",
        },
      },
      {
        merchantId: "default",
        name: "Premium Referral Program",
        status: "active",
        referrerReward: {
          type: "percentage",
          value: 15,
          currency: "USD",
          maxReward: 500,
        },
        refereeReward: {
          type: "percentage",
          value: 5,
          currency: "USD",
          description: "5% off first purchase",
        },
        conditions: {
          minimumFirstTransaction: 250,
          validityDays: 180,
          maxReferralsPerMonth: undefined,
        },
        redemptionRules: {
          payoutMethod: "bank_transfer",
          minimumEarnings: 50,
          payoutFrequency: "weekly",
        },
      },
    ];
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(referrerId: string): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `${referrerId.substr(0, 3)}-${timestamp}-${randomStr}`.toUpperCase();
  }

  /**
   * Create a referral
   */
  createReferral(
    programId: string,
    referrerId: string,
    refereeEmail: string
  ): Referral | null {
    const program = this.programs.get(programId);
    if (!program) return null;

    const id = crypto.randomUUID();
    const referralCode = this.generateReferralCode(referrerId);

    const referral: Referral = {
      id,
      programId,
      referrerId,
      refereeEmail,
      referralCode,
      status: "pending",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + program.conditions.validityDays * 24 * 60 * 60 * 1000),
      referrerEarnings: 0,
      refereeRewardApplied: false,
    };

    this.referrals.set(id, referral);
    this.referralCodes.set(referralCode, id);

    return referral;
  }

  /**
   * Validate and process referral code
   */
  processReferralCode(code: string, newCustomerEmail: string): { valid: boolean; reward?: any; message: string } {
    const referralId = this.referralCodes.get(code);
    if (!referralId) {
      return { valid: false, message: "Invalid referral code" };
    }

    const referral = this.referrals.get(referralId);
    if (!referral) {
      return { valid: false, message: "Referral not found" };
    }

    // Check if referral is expired
    if (new Date() > referral.expiresAt) {
      referral.status = "failed";
      return { valid: false, message: "Referral code has expired" };
    }

    // Check if referral is already used
    if (referral.status !== "pending") {
      return { valid: false, message: "Referral code already used" };
    }

    const program = this.programs.get(referral.programId);
    if (!program) {
      return { valid: false, message: "Program not found" };
    }

    // Return reward details
    return {
      valid: true,
      reward: {
        ...program.refereeReward,
        message: `Get ${program.refereeReward.value}${program.refereeReward.type === "percentage" ? "%" : "$"} ${program.refereeReward.description}`,
      },
      message: "Referral code is valid",
    };
  }

  /**
   * Mark referral as qualified (after first transaction)
   */
  qualifyReferral(referralCode: string, transactionAmount: number): { success: boolean; earnings?: number } {
    const referralId = this.referralCodes.get(referralCode);
    if (!referralId) return { success: false };

    const referral = this.referrals.get(referralId);
    if (!referral) return { success: false };

    const program = this.programs.get(referral.programId);
    if (!program) return { success: false };

    // Check minimum transaction requirement
    if (transactionAmount < program.conditions.minimumFirstTransaction) {
      return { success: false };
    }

    // Calculate referrer earnings
    let referrerEarnings = 0;
    if (program.referrerReward.type === "percentage") {
      referrerEarnings = (transactionAmount * program.referrerReward.value) / 100;
      if (program.referrerReward.maxReward) {
        referrerEarnings = Math.min(referrerEarnings, program.referrerReward.maxReward);
      }
    } else {
      referrerEarnings = program.referrerReward.value;
    }

    // Update referral
    referral.status = "qualified";
    referral.qualifiedAt = new Date();
    referral.firstTransactionAmount = transactionAmount;
    referral.referrerEarnings = referrerEarnings;
    referral.refereeRewardApplied = true;

    // Track earnings
    this.updateEarnings(referral.referrerId, referrerEarnings);

    // Update stats
    this.updateProgramStats(referral.programId);

    return { success: true, earnings: referrerEarnings };
  }

  /**
   * Get referral statistics for a referrer
   */
  getReferrerStats(referrerId: string): {
    totalReferrals: number;
    successfulReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
    conversionRate: number;
  } {
    let totalReferrals = 0;
    let successfulReferrals = 0;
    let totalEarnings = 0;
    let pendingEarnings = 0;

    for (const referral of this.referrals.values()) {
      if (referral.referrerId === referrerId) {
        totalReferrals++;
        if (referral.status === "qualified" || referral.status === "rewarded") {
          successfulReferrals++;
          if (referral.status === "qualified") {
            pendingEarnings += referral.referrerEarnings;
          }
          totalEarnings += referral.referrerEarnings;
        }
      }
    }

    return {
      totalReferrals,
      successfulReferrals,
      totalEarnings,
      pendingEarnings,
      conversionRate: totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0,
    };
  }

  /**
   * Get program statistics
   */
  getProgramStats(programId: string): ReferralStats | null {
    return this.programStats.get(programId) || null;
  }

  /**
   * Process payouts for referrers
   */
  processPayout(referrerId: string, amount: number): { success: boolean; referrals: string[] } {
    const paidReferrals: string[] = [];

    for (const referral of this.referrals.values()) {
      if (
        referral.referrerId === referrerId &&
        referral.status === "qualified" &&
        referral.referrerEarnings <= amount
      ) {
        referral.status = "rewarded";
        referral.rewardedAt = new Date();
        paidReferrals.push(referral.id);
      }
    }

    return {
      success: paidReferrals.length > 0,
      referrals: paidReferrals,
    };
  }

  /**
   * Get top referrers
   */
  getTopReferrers(programId: string, limit: number = 10): Array<{
    referrerId: string;
    referralCount: number;
    earnings: number;
    conversionRate: number;
  }> {
    const referrerStats: Record<string, any> = {};

    for (const referral of this.referrals.values()) {
      if (referral.programId === programId) {
        if (!referrerStats[referral.referrerId]) {
          referrerStats[referral.referrerId] = {
            referralCount: 0,
            earnings: 0,
            qualified: 0,
          };
        }
        referrerStats[referral.referrerId].referralCount++;
        if (referral.status === "qualified" || referral.status === "rewarded") {
          referrerStats[referral.referrerId].qualified++;
          referrerStats[referral.referrerId].earnings += referral.referrerEarnings;
        }
      }
    }

    return Object.entries(referrerStats)
      .map(([referrerId, stats]) => ({
        referrerId,
        referralCount: stats.referralCount,
        earnings: stats.earnings,
        conversionRate: (stats.qualified / stats.referralCount) * 100,
      }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, limit);
  }

  /**
   * Get referral sharing templates
   */
  getShareTemplates(referralCode: string, programId: string) {
    const program = this.programs.get(programId);
    if (!program) return null;

    const baseUrl = `https://qpay.io/join?ref=${referralCode}`;

    return {
      email: {
        subject: `You should check out QPay - Here's $50 credit!`,
        body: `I've been using QPay to process payments and I'm saving a ton of money. Use my referral code and get $50 credit: ${referralCode}\n\n${baseUrl}`,
      },
      sms: {
        body: `Try QPay payment processor! Get $50 credit with code: ${referralCode} ${baseUrl}`,
      },
      social: {
        facebook: `🚀 Just discovered @qpay - saves me ${program.referrerReward.value}% on every transaction. Check it out: ${baseUrl}`,
        twitter: `Switching to @qpay_io for payments - 10% better rates than competitors 📈 Join me: ${baseUrl}`,
        linkedin: `QPay has transformed my payment processing. Lower fees, better security, real support. Referral: ${referralCode}`,
      },
      web: {
        shortUrl: `qpay.io/r/${referralCode}`,
        fullUrl: baseUrl,
      },
    };
  }

  /**
   * Fraud detection for referral abuse
   */
  detectReferralFraud(referrerId: string): { isFraudulent: boolean; riskFactors: string[] } {
    const stats = this.getReferrerStats(referrerId);
    const riskFactors: string[] = [];

    // Too many referrals in short time
    const recentReferrals = Array.from(this.referrals.values()).filter(
      r => r.referrerId === referrerId && 
      new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (recentReferrals.length > 50) {
      riskFactors.push("Unusually high referral creation rate");
    }

    // Conversion rate too high
    if (stats.conversionRate > 80) {
      riskFactors.push("Suspiciously high conversion rate");
    }

    // Multiple referrals with same email domain
    const emailDomains: Record<string, number> = {};
    Array.from(this.referrals.values())
      .filter(r => r.referrerId === referrerId)
      .forEach(r => {
        const domain = r.refereeEmail.split("@")[1];
        emailDomains[domain] = (emailDomains[domain] || 0) + 1;
      });

    const suspiciousDomain = Object.values(emailDomains).some(count => count > 10);
    if (suspiciousDomain) {
      riskFactors.push("Multiple referrals from same email domain");
    }

    return {
      isFraudulent: riskFactors.length >= 2,
      riskFactors,
    };
  }

  /**
   * Get affiliate tracking data
   */
  getTrackingPixel(referralCode: string): {
    trackingId: string;
    pixelUrl: string;
    scriptUrl: string;
  } {
    return {
      trackingId: crypto.randomUUID(),
      pixelUrl: `https://qpay.io/pixel?ref=${referralCode}`,
      scriptUrl: `https://qpay.io/track.js?ref=${referralCode}`,
    };
  }

  // Private helper methods
  private updateEarnings(referrerId: string, amount: number) {
    const current = this.referrerEarnings.get(referrerId) || 0;
    this.referrerEarnings.set(referrerId, current + amount);
  }

  private updateProgramStats(programId: string) {
    let totalReferrals = 0;
    let successfulReferrals = 0;
    let pendingReferrals = 0;
    let totalEarnings = 0;

    for (const referral of this.referrals.values()) {
      if (referral.programId === programId) {
        totalReferrals++;
        if (referral.status === "pending") pendingReferrals++;
        if (referral.status === "qualified" || referral.status === "rewarded") {
          successfulReferrals++;
          totalEarnings += referral.referrerEarnings;
        }
      }
    }

    const stats: ReferralStats = {
      totalReferrals,
      successfulReferrals,
      pendingReferrals,
      totalEarnings,
      topReferrers: this.getTopReferrers(programId, 5),
      conversionRate: totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0,
    };

    this.programStats.set(programId, stats);
  }
}

export const referralProgramService = new ReferralProgramService();
