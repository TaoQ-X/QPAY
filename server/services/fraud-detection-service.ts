import Database from "../database/client";

export interface TransactionData {
  business_id: string;
  customer_email?: string;
  customer_ip?: string;
  amount_cents: number;
  currency: string;
  card_last_four?: string;
  card_brand?: string;
  card_country?: string;
  customer_name?: string;
}

export interface FraudScore {
  overall_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  factors: FraudFactor[];
  action_taken: "approve" | "review" | "block" | "challenge";
}

export interface FraudFactor {
  name: string;
  score: number;
  description: string;
}

export class FraudDetectionService {
  // Risk scoring ranges
  private static readonly RISK_THRESHOLDS = {
    LOW: 20,
    MEDIUM: 50,
    HIGH: 75,
    CRITICAL: 90,
  };

  /**
   * Analyze transaction for fraud risk
   */
  static async scoreTransaction(transactionData: TransactionData): Promise<FraudScore> {
    const factors: FraudFactor[] = [];
    let totalScore = 0;

    // Factor 1: Velocity Analysis
    const velocityScore = await this.checkVelocityFraud(transactionData.business_id);
    if (velocityScore.score > 0) {
      factors.push(velocityScore);
      totalScore += velocityScore.score;
    }

    // Factor 2: Amount Anomaly
    const amountScore = await this.checkAmountAnomaly(
      transactionData.business_id,
      transactionData.amount_cents
    );
    if (amountScore.score > 0) {
      factors.push(amountScore);
      totalScore += amountScore.score;
    }

    // Factor 3: Card Testing
    const cardTestingScore = await this.detectCardTesting(
      transactionData.card_last_four,
      transactionData.business_id
    );
    if (cardTestingScore.score > 0) {
      factors.push(cardTestingScore);
      totalScore += cardTestingScore.score;
    }

    // Factor 4: Geographic Inconsistency
    const geoScore = this.checkGeographicInconsistency(
      transactionData.customer_ip,
      transactionData.card_country
    );
    if (geoScore.score > 0) {
      factors.push(geoScore);
      totalScore += geoScore.score;
    }

    // Factor 5: Device Fingerprinting
    const deviceScore = await this.checkDeviceReputation(
      transactionData.customer_ip,
      transactionData.business_id
    );
    if (deviceScore.score > 0) {
      factors.push(deviceScore);
      totalScore += deviceScore.score;
    }

    // Factor 6: Email Risk
    const emailScore = await this.checkEmailRisk(
      transactionData.customer_email,
      transactionData.business_id
    );
    if (emailScore.score > 0) {
      factors.push(emailScore);
      totalScore += emailScore.score;
    }

    // Factor 7: 3D Secure Status
    const threeDSecureScore = await this.check3DSecureStatus(transactionData.business_id);
    if (threeDSecureScore.score > 0) {
      factors.push(threeDSecureScore);
      totalScore -= threeDSecureScore.score; // Reduce score (3DS is good)
    }

    // Factor 8: Card Brand Risk
    const brandScore = this.checkCardBrandRisk(transactionData.card_brand);
    if (brandScore.score > 0) {
      factors.push(brandScore);
      totalScore += brandScore.score;
    }

    // Normalize score to 0-100
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Determine risk level and action
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    let recommendedAction: "approve" | "review" | "block" | "challenge" = "approve";

    if (totalScore >= this.RISK_THRESHOLDS.CRITICAL) {
      riskLevel = "critical";
      recommendedAction = "block";
    } else if (totalScore >= this.RISK_THRESHOLDS.HIGH) {
      riskLevel = "high";
      recommendedAction = "block";
    } else if (totalScore >= this.RISK_THRESHOLDS.MEDIUM) {
      riskLevel = "medium";
      recommendedAction = "review";
    } else if (totalScore >= this.RISK_THRESHOLDS.LOW) {
      riskLevel = "low";
      recommendedAction = "challenge";
    }

    return {
      overall_score: Math.round(totalScore),
      risk_level: riskLevel,
      factors,
      action_taken: recommendedAction,
    };
  }

  /**
   * Check for rapid transaction velocity
   */
  private static async checkVelocityFraud(merchantId: string): Promise<FraudFactor> {
    const transactions = await Database.getMany(
      `SELECT COUNT(*) as count FROM transactions 
       WHERE business_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [merchantId]
    );

    const hourlyCount = transactions[0]?.count || 0;

    if (hourlyCount > 100) {
      return {
        name: "Unusual Transaction Velocity",
        score: 45,
        description: `${hourlyCount} transactions in the last hour`,
      };
    } else if (hourlyCount > 50) {
      return {
        name: "Elevated Transaction Velocity",
        score: 25,
        description: `${hourlyCount} transactions in the last hour`,
      };
    }

    return { name: "Velocity Check", score: 0, description: "Normal velocity" };
  }

  /**
   * Detect unusual transaction amounts
   */
  private static async checkAmountAnomaly(
    merchantId: string,
    currentAmount: number
  ): Promise<FraudFactor> {
    const stats = await Database.getOne(
      `SELECT 
        AVG(amount_cents) as avg_amount,
        STDDEV(amount_cents) as stddev_amount
       FROM transactions 
       WHERE business_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
      [merchantId]
    );

    if (!stats?.avg_amount) {
      return { name: "Amount Anomaly Check", score: 0, description: "Insufficient data" };
    }

    const avgAmount = parseFloat(stats.avg_amount);
    const stdDev = parseFloat(stats.stddev_amount || "0");
    const zScore = stdDev > 0 ? Math.abs((currentAmount - avgAmount) / stdDev) : 0;

    if (zScore > 4) {
      return {
        name: "Extreme Amount Anomaly",
        score: 50,
        description: `Amount ${(currentAmount / 100).toFixed(2)} is ${zScore.toFixed(1)}σ from average`,
      };
    } else if (zScore > 2) {
      return {
        name: "Amount Anomaly",
        score: 25,
        description: `Amount is ${zScore.toFixed(1)}σ from average`,
      };
    }

    return { name: "Amount Anomaly Check", score: 0, description: "Amount within normal range" };
  }

  /**
   * Detect card testing (multiple small transactions)
   */
  private static async detectCardTesting(
    cardLastFour: string | undefined,
    merchantId: string
  ): Promise<FraudFactor> {
    if (!cardLastFour) {
      return { name: "Card Testing Check", score: 0, description: "No card data" };
    }

    const smallTransactions = await Database.getMany(
      `SELECT COUNT(*) as count FROM transactions 
       WHERE business_id = $1 
       AND amount_cents < 10000 
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [merchantId]
    );

    const count = smallTransactions[0]?.count || 0;

    if (count > 10) {
      return {
        name: "Card Testing Pattern",
        score: 55,
        description: `${count} small transactions in 24 hours (card testing indicator)`,
      };
    }

    return { name: "Card Testing Check", score: 0, description: "Normal pattern" };
  }

  /**
   * Check geographic inconsistency
   */
  private static checkGeographicInconsistency(
    ipCountry: string | undefined,
    cardCountry: string | undefined
  ): FraudFactor {
    if (!ipCountry || !cardCountry) {
      return {
        name: "Geographic Check",
        score: 0,
        description: "Insufficient geographic data",
      };
    }

    if (ipCountry !== cardCountry) {
      // Check for impossible travel
      const impossibleCountries: { [key: string]: string[] } = {
        US: ["CN", "RU", "IR"],
        GB: ["CN", "RU", "IR", "KP"],
        AU: ["KP", "IR"],
      };

      if (
        impossibleCountries[ipCountry]?.includes(cardCountry) ||
        impossibleCountries[cardCountry]?.includes(ipCountry)
      ) {
        return {
          name: "Impossible Travel Detected",
          score: 60,
          description: `IP in ${ipCountry}, card issued in ${cardCountry}`,
        };
      }

      return {
        name: "Geographic Mismatch",
        score: 15,
        description: `IP in ${ipCountry}, card issued in ${cardCountry}`,
      };
    }

    return { name: "Geographic Check", score: 0, description: "Geographic match" };
  }

  /**
   * Check device reputation
   */
  private static async checkDeviceReputation(
    ipAddress: string | undefined,
    merchantId: string
  ): Promise<FraudFactor> {
    if (!ipAddress) {
      return { name: "Device Check", score: 10, description: "No IP address detected" };
    }

    // Check if IP has been associated with fraud
    const fraudHistory = await Database.getMany(
      `SELECT COUNT(*) as count FROM fraud_events 
       WHERE ip_address = $1 AND status = 'confirmed' 
       AND created_at > NOW() - INTERVAL '90 days'`,
      [ipAddress]
    );

    const fraudCount = fraudHistory[0]?.count || 0;

    if (fraudCount > 5) {
      return {
        name: "IP Fraud History",
        score: 70,
        description: `IP ${fraudCount} confirmed frauds in last 90 days`,
      };
    } else if (fraudCount > 2) {
      return {
        name: "IP Associated with Fraud",
        score: 40,
        description: `IP has ${fraudCount} fraud events`,
      };
    }

    return { name: "Device Check", score: 0, description: "Device reputation clean" };
  }

  /**
   * Check email risk
   */
  private static async checkEmailRisk(
    email: string | undefined,
    merchantId: string
  ): Promise<FraudFactor> {
    if (!email) {
      return { name: "Email Check", score: 0, description: "No email provided" };
    }

    // Check for disposable email domains
    const disposableDomains = [
      "tempmail.com",
      "10minutemail.com",
      "mailinator.com",
      "throwaway.email",
      "trashmail.com",
    ];

    const domain = email.split("@")[1];
    if (disposableDomains.includes(domain)) {
      return {
        name: "Disposable Email",
        score: 35,
        description: `Using disposable email service: ${domain}`,
      };
    }

    // Check email abuse history
    const abuseHistory = await Database.getMany(
      `SELECT COUNT(*) as count FROM fraud_events 
       WHERE email = $1 AND status = 'confirmed' 
       AND created_at > NOW() - INTERVAL '90 days'`,
      [email]
    );

    const abuseCount = abuseHistory[0]?.count || 0;
    if (abuseCount > 3) {
      return {
        name: "Email Associated with Fraud",
        score: 50,
        description: `Email has ${abuseCount} confirmed fraud incidents`,
      };
    }

    return { name: "Email Check", score: 0, description: "Email reputation clean" };
  }

  /**
   * Check if 3D Secure was used (reduces fraud risk)
   */
  private static async check3DSecureStatus(merchantId: string): Promise<FraudFactor> {
    const recent3DS = await Database.getMany(
      `SELECT COUNT(*) as count FROM transactions 
       WHERE business_id = $1 AND three_ds_status = 'authenticated' 
       AND created_at > NOW() - INTERVAL '1 day'`,
      [merchantId]
    );

    const count = recent3DS[0]?.count || 0;

    if (count > 0) {
      return {
        name: "3D Secure Protected",
        score: 20, // This reduces overall score
        description: "3D Secure authentication used (reduces fraud risk)",
      };
    }

    return { name: "3D Secure Check", score: 0, description: "No 3DS data" };
  }

  /**
   * Check card brand risk
   */
  private static checkCardBrandRisk(cardBrand: string | undefined): FraudFactor {
    if (!cardBrand) {
      return { name: "Card Brand Check", score: 0, description: "No card brand" };
    }

    // Prepaid and debit cards have higher fraud rates
    if (cardBrand.toLowerCase() === "prepaid") {
      return {
        name: "Prepaid Card",
        score: 15,
        description: "Prepaid cards have higher fraud rates",
      };
    }

    return { name: "Card Brand Check", score: 0, description: "Standard card" };
  }

  /**
   * Record fraud event
   */
  static async recordFraudEvent(
    merchantId: string,
    transactionId: string,
    fraudScore: FraudScore,
    ipAddress?: string,
    email?: string
  ) {
    return await Database.insert("fraud_events", {
      business_id: merchantId,
      transaction_id: transactionId,
      ip_address: ipAddress || null,
      customer_email: email || null,
      fraud_score: fraudScore.overall_score,
      risk_level: fraudScore.risk_level,
      risk_factors: fraudScore.factors.map((factor) => factor.name),
      action_taken: fraudScore.action_taken,
      metadata: { factors: fraudScore.factors },
      status: "open",
    });
  }

  /**
   * Get fraud statistics for merchant
   */
  static async getFraudStats(merchantId: string, daysBack = 30) {
    const stats = await Database.getOne(
      `SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count,
        SUM(CASE WHEN status = 'false_positive' THEN 1 ELSE 0 END) as false_positive_count,
        AVG(fraud_score) as avg_fraud_score,
        MAX(fraud_score) as max_fraud_score
       FROM fraud_events
       WHERE business_id = $1 AND created_at > NOW() - INTERVAL '${daysBack} days'`,
      [merchantId]
    );

    const blockEvents = await Database.getMany(
      `SELECT COUNT(*) as count FROM fraud_events 
       WHERE business_id = $1 AND action_taken = 'block' 
       AND created_at > NOW() - INTERVAL '${daysBack} days'`,
      [merchantId]
    );

    return {
      total_events: stats?.total_events || 0,
      confirmed: stats?.confirmed_count || 0,
      false_positives: stats?.false_positive_count || 0,
      average_fraud_score: stats?.avg_fraud_score ? Math.round(stats.avg_fraud_score) : 0,
      max_fraud_score: stats?.max_fraud_score || 0,
      blocked_attempts: blockEvents[0]?.count || 0,
      period_days: daysBack,
    };
  }

  /**
   * Review and mark fraud event
   */
  static async markFraudEvent(
    fraudEventId: string,
    resolution: "confirmed" | "false_positive" | "suspicious_but_valid"
  ) {
    return await Database.update(
      `UPDATE fraud_events SET status = $1, resolved_at = NOW() WHERE id = $2 RETURNING *`,
      [resolution, fraudEventId]
    );
  }

  /**
   * Get high-risk transactions for review
   */
  static async getHighRiskTransactions(
    merchantId: string,
    minScore = 75,
    limit = 50
  ) {
    return await Database.getMany(
      `SELECT * FROM fraud_events 
       WHERE business_id = $1 AND fraud_score >= $2 AND status = 'open'
       ORDER BY fraud_score DESC, created_at DESC
       LIMIT $3`,
      [merchantId, minScore, limit]
    );
  }
}
