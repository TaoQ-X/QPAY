import Database from "../database/client";

export interface KYCData {
  full_name: string;
  date_of_birth: string;
  id_type: "passport" | "drivers_license" | "national_id";
  id_number: string;
  id_expiry?: string;
  country?: string;
  address?: string;
  phone?: string;
  email?: string;
  business_name?: string;
  business_type?: string;
  tax_id?: string;
}

export interface AMLCheckResult {
  status: "clear" | "review" | "blocked";
  risk_level: "low" | "medium" | "high" | "critical";
  flags: string[];
  checked_at: Date;
  score: number;
}

export class KYCAMLService {
  /**
   * Submit KYC verification
   */
  static async submitKYCVerification(
    merchantId: string,
    userId: string,
    kycData: KYCData,
    documentUrls?: { id_front?: string; id_back?: string; selfie?: string }
  ) {
    const verification = await Database.insert("kyc_verifications", {
      merchant_id: merchantId,
      user_id: userId,
      full_name: kycData.full_name,
      date_of_birth: kycData.date_of_birth,
      id_type: kycData.id_type,
      id_number: kycData.id_number,
      id_expiry: kycData.id_expiry || null,
      country: kycData.country || null,
      address: kycData.address || null,
      phone: kycData.phone || null,
      email: kycData.email || null,
      business_name: kycData.business_name || null,
      business_type: kycData.business_type || null,
      tax_id: kycData.tax_id || null,
      id_front_url: documentUrls?.id_front || null,
      id_back_url: documentUrls?.id_back || null,
      selfie_url: documentUrls?.selfie || null,
      status: "pending",
      verification_method: "manual",
    });

    // Trigger AML check immediately
    await this.performAMLCheck(merchantId, kycData);

    return verification;
  }

  /**
   * Perform AML screening
   */
  static async performAMLCheck(merchantId: string, kycData: KYCData) {
    const flags: string[] = [];
    let riskScore = 0;

    // Check 1: OFAC/Sanction lists (mock implementation)
    // In production, use real OFAC data or third-party service
    const sanctionedNames = ["osama", "iran", "syria", "north korea"];
    const nameLower = kycData.full_name.toLowerCase();

    if (sanctionedNames.some((name) => nameLower.includes(name))) {
      flags.push("POTENTIAL_SANCTIONED_PARTY");
      riskScore += 50;
    }

    // Check 2: High-risk countries
    const highRiskCountries = ["IR", "SY", "KP", "CU"];
    if (kycData.country && highRiskCountries.includes(kycData.country)) {
      flags.push("HIGH_RISK_JURISDICTION");
      riskScore += 40;
    }

    // Check 3: Document validity
    if (kycData.id_expiry) {
      const expiryDate = new Date(kycData.id_expiry);
      if (expiryDate < new Date()) {
        flags.push("EXPIRED_IDENTIFICATION");
        riskScore += 25;
      }
    }

    // Check 4: Age verification (must be 18+)
    if (kycData.date_of_birth) {
      const age = this.calculateAge(new Date(kycData.date_of_birth));
      if (age < 18) {
        flags.push("UNDERAGE_USER");
        riskScore += 100;
      } else if (age > 100) {
        flags.push("INVALID_DATE_OF_BIRTH");
        riskScore += 20;
      }
    }

    // Check 5: Business risk assessment
    if (kycData.business_type) {
      const highRiskBusinesses = ["gambling", "weapons", "drugs", "money_transfer"];
      if (
        highRiskBusinesses.some((type) =>
          kycData.business_type?.toLowerCase().includes(type)
        )
      ) {
        flags.push("HIGH_RISK_BUSINESS");
        riskScore += 30;
      }
    }

    // Determine overall status
    let status: "clear" | "review" | "blocked" = "clear";
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";

    if (riskScore >= 100) {
      status = "blocked";
      riskLevel = "critical";
    } else if (riskScore >= 50) {
      status = "review";
      riskLevel = "high";
    } else if (riskScore >= 25) {
      riskLevel = "medium";
    }

    // Record AML check
    const amlCheck = await Database.insert("aml_checks", {
      merchant_id: merchantId,
      full_name: kycData.full_name,
      status,
      risk_level: riskLevel,
      risk_score: riskScore,
      flags: JSON.stringify(flags),
    });

    return {
      amlCheckId: amlCheck.id,
      status,
      riskLevel,
      flags,
      score: riskScore,
    };
  }

  /**
   * Get KYC verification status
   */
  static async getKYCStatus(merchantId: string) {
    return await Database.getOne(
      `SELECT * FROM kyc_verifications WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [merchantId]
    );
  }

  /**
   * Get AML check history
   */
  static async getAMLCheckHistory(merchantId: string, limit = 10) {
    return await Database.getMany(
      `SELECT * FROM aml_checks WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [merchantId, limit]
    );
  }

  /**
   * Approve KYC verification
   */
  static async approveKYC(verificationId: string, approvedBy: string) {
    const verification = await Database.update(
      `UPDATE kyc_verifications 
       SET status = 'approved', verified_at = NOW(), verified_by = $1 
       WHERE id = $2 
       RETURNING *`,
      [approvedBy, verificationId]
    );

    // Update merchant status
    if (verification?.merchant_id) {
      await Database.update(
        `UPDATE merchants SET kyc_status = 'verified' WHERE id = $1`,
        [verification.merchant_id]
      );
    }

    return verification;
  }

  /**
   * Reject KYC verification
   */
  static async rejectKYC(
    verificationId: string,
    rejectionReason: string,
    rejectedBy: string
  ) {
    return await Database.update(
      `UPDATE kyc_verifications 
       SET status = 'rejected', rejection_reason = $1, verified_by = $2, verified_at = NOW()
       WHERE id = $3 
       RETURNING *`,
      [rejectionReason, rejectedBy, verificationId]
    );
  }

  /**
   * Request additional KYC documents
   */
  static async requestAdditionalDocuments(
    verificationId: string,
    documentsNeeded: string[]
  ) {
    return await Database.update(
      `UPDATE kyc_verifications 
       SET status = 'pending_documents', documents_requested = $1, documents_requested_at = NOW()
       WHERE id = $2 
       RETURNING *`,
      [JSON.stringify(documentsNeeded), verificationId]
    );
  }

  /**
   * Check if merchant is KYC verified
   */
  static async isMerchantVerified(merchantId: string): Promise<boolean> {
    const merchant = await Database.getOne(
      `SELECT kyc_status FROM merchants WHERE id = $1`,
      [merchantId]
    );

    return merchant?.kyc_status === "verified";
  }

  /**
   * Get merchant AML risk profile
   */
  static async getMerchantRiskProfile(merchantId: string) {
    const recentChecks = await Database.getMany(
      `SELECT * FROM aml_checks WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [merchantId]
    );

    if (!recentChecks.length) {
      return {
        status: "not_checked",
        overall_risk_level: "unknown",
        latest_check: null,
        check_count: 0,
      };
    }

    const latestCheck = recentChecks[0];
    const averageRiskScore =
      recentChecks.reduce((sum, check) => sum + (check.risk_score || 0), 0) /
      recentChecks.length;

    return {
      status: latestCheck.status,
      overall_risk_level: latestCheck.risk_level,
      latest_check: latestCheck.created_at,
      check_count: recentChecks.length,
      average_risk_score: Math.round(averageRiskScore),
      recent_flags: latestCheck.flags,
    };
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Monitor for suspicious patterns
   */
  static async checkForSuspiciousActivity(
    merchantId: string,
    activityType: "rapid_velocity" | "unusual_amount" | "multiple_failures"
  ) {
    const flags: string[] = [];
    let riskScore = 0;

    if (activityType === "rapid_velocity") {
      // Check for unusually high transaction velocity
      const recentTransactions = await Database.getMany(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE merchant_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
        [merchantId]
      );

      if (recentTransactions[0]?.count > 100) {
        flags.push("UNUSUAL_TRANSACTION_VELOCITY");
        riskScore += 30;
      }
    }

    if (activityType === "unusual_amount") {
      // Check for unusually large transactions
      const largeTransactions = await Database.getMany(
        `SELECT AVG(amount_cents) as avg_amount FROM transactions 
         WHERE merchant_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
        [merchantId]
      );

      if (largeTransactions[0]?.avg_amount) {
        const avgAmount = largeTransactions[0].avg_amount;
        const recentHighValue = await Database.getMany(
          `SELECT COUNT(*) as count FROM transactions 
           WHERE merchant_id = $1 AND amount_cents > $2 AND created_at > NOW() - INTERVAL '1 day'`,
          [merchantId, avgAmount * 5]
        );

        if (recentHighValue[0]?.count > 5) {
          flags.push("UNUSUAL_TRANSACTION_AMOUNTS");
          riskScore += 25;
        }
      }
    }

    if (activityType === "multiple_failures") {
      // Check for multiple failed payment attempts
      const failedTransactions = await Database.getMany(
        `SELECT COUNT(*) as count FROM transactions 
         WHERE merchant_id = $1 AND status = 'failed' AND created_at > NOW() - INTERVAL '1 hour'`,
        [merchantId]
      );

      if (failedTransactions[0]?.count > 10) {
        flags.push("MULTIPLE_FAILED_ATTEMPTS");
        riskScore += 35;
      }
    }

    if (flags.length > 0) {
      await Database.insert("suspicious_activities", {
        merchant_id: merchantId,
        activity_type: activityType,
        flags: JSON.stringify(flags),
        risk_score: riskScore,
        status: "flagged",
      });
    }

    return {
      flagged: flags.length > 0,
      flags,
      riskScore,
    };
  }
}
