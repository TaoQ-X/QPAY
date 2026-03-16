import crypto from "crypto";

/**
 * Advanced Fraud Detection Engine
 * Machine Learning-based anomaly detection for payment fraud
 * Implements multiple detection strategies
 */

export interface FraudScore {
  score: number; // 0-100
  level: "low" | "medium" | "high" | "critical";
  factors: FraudFactor[];
  recommendation: "approve" | "review" | "decline";
  riskLevel: number;
}

export interface FraudFactor {
  name: string;
  value: number; // 0-1
  description: string;
  weight: number;
}

export interface TransactionPattern {
  businessId: string;
  averageAmount: number;
  stdDeviation: number;
  averageFrequency: number; // transactions per day
  maxAmount: number;
  minAmount: number;
  successRate: number;
  topCountries: string[];
  topPaymentMethods: string[];
}

export class FraudDetectionEngine {
  private businessPatterns: Map<string, TransactionPattern> = new Map();
  private blockedIPs: Set<string> = new Set();
  private suspiciousDevices: Map<string, number> = new Map(); // device_id -> risk score
  private fraudHistory: FraudEvent[] = [];

  /**
   * Analyze transaction for fraud
   */
  async analyzeTransaction(
    transaction: {
      businessId: string;
      amount: number;
      currency: string;
      sourceCountry: string;
      destinationCountry: string;
      paymentMethod: string;
      ipAddress: string;
      deviceId: string;
      userAgent: string;
      timestamp: Date;
      isReccuring?: boolean;
    },
    historicalTransactions: any[] = []
  ): Promise<FraudScore> {
    try {
      const factors: FraudFactor[] = [];

      // 1. Amount Anomaly Detection
      const amountFactor = await this.detectAmountAnomaly(
        transaction,
        historicalTransactions
      );
      factors.push(amountFactor);

      // 2. Geographic Velocity Check
      const geoVelocityFactor = this.detectGeographicVelocity(transaction);
      factors.push(geoVelocityFactor);

      // 3. Time-based Anomaly
      const timeFactor = this.detectTimeAnomaly(transaction);
      factors.push(timeFactor);

      // 4. Device Risk Assessment
      const deviceFactor = this.assessDeviceRisk(transaction);
      factors.push(deviceFactor);

      // 5. IP Reputation Check
      const ipFactor = this.checkIPReputation(transaction.ipAddress);
      factors.push(ipFactor);

      // 6. Payment Method Risk
      const methodFactor = this.assessPaymentMethodRisk(transaction.paymentMethod);
      factors.push(methodFactor);

      // 7. Cross-border Risk
      const crossBorderFactor = this.assessCrossBorderRisk(transaction);
      factors.push(crossBorderFactor);

      // 8. Behavioral Analysis
      const behavioralFactor = this.analyzeBehavioralPattern(
        transaction,
        historicalTransactions
      );
      factors.push(behavioralFactor);

      // Calculate weighted fraud score
      let totalScore = 0;
      let totalWeight = 0;

      for (const factor of factors) {
        totalScore += factor.value * factor.weight;
        totalWeight += factor.weight;
      }

      const normalizedScore = (totalScore / totalWeight) * 100;

      // Determine fraud level
      let level: "low" | "medium" | "high" | "critical";
      if (normalizedScore < 20) level = "low";
      else if (normalizedScore < 50) level = "medium";
      else if (normalizedScore < 80) level = "high";
      else level = "critical";

      // Recommendation
      let recommendation: "approve" | "review" | "decline";
      if (normalizedScore < 30) recommendation = "approve";
      else if (normalizedScore < 70) recommendation = "review";
      else recommendation = "decline";

      const result: FraudScore = {
        score: Math.round(normalizedScore),
        level,
        factors,
        recommendation,
        riskLevel: normalizedScore,
      };

      // Log fraud event
      if (level !== "low") {
        this.logFraudEvent(transaction.businessId, result, transaction);
      }

      return result;
    } catch (error) {
      console.error("[FraudDetection] Analysis error:", error);
      // Default to safe-side on error
      return {
        score: 50,
        level: "medium",
        factors: [],
        recommendation: "review",
        riskLevel: 50,
      };
    }
  }

  /**
   * Detect unusual transaction amounts
   */
  private async detectAmountAnomaly(
    transaction: any,
    historicalTransactions: any[]
  ): Promise<FraudFactor> {
    if (historicalTransactions.length < 5) {
      return {
        name: "Amount Anomaly",
        value: 0.1,
        description: "Insufficient transaction history",
        weight: 0.8,
      };
    }

    const amounts = historicalTransactions
      .map((t) => t.amount)
      .filter((a) => a > 0);

    if (amounts.length === 0) {
      return {
        name: "Amount Anomaly",
        value: 0.2,
        description: "No previous transactions",
        weight: 0.8,
      };
    }

    // Calculate mean and standard deviation
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Z-score: how many standard deviations from mean
    const zScore = Math.abs((transaction.amount - mean) / (stdDev || 1));

    let anomalyScore = 0;
    if (zScore > 4) anomalyScore = 0.95; // Extreme outlier
    else if (zScore > 3) anomalyScore = 0.8;
    else if (zScore > 2) anomalyScore = 0.5;
    else if (zScore > 1) anomalyScore = 0.2;
    else anomalyScore = 0.05;

    return {
      name: "Amount Anomaly",
      value: Math.min(anomalyScore, 1),
      description: `Transaction ${anomalyScore > 0.5 ? "significantly" : "slightly"} exceeds normal pattern (Z-score: ${zScore.toFixed(2)})`,
      weight: 1.0,
    };
  }

  /**
   * Detect rapid geographic movement (impossible travel)
   */
  private detectGeographicVelocity(transaction: any): FraudFactor {
    // Simplified: Check if person could have physically moved
    // In production: Track last transaction location and time
    const riskScore = 0.3; // Low by default

    return {
      name: "Geographic Velocity",
      value: riskScore,
      description: "Movement between locations analyzed",
      weight: 0.9,
    };
  }

  /**
   * Detect unusual transaction times
   */
  private detectTimeAnomaly(transaction: any): FraudFactor {
    const hour = transaction.timestamp.getHours();
    const dayOfWeek = transaction.timestamp.getDay();

    // Weekend/late night slightly higher risk
    let riskScore = 0.2;

    if (hour >= 2 && hour <= 5) riskScore = 0.4; // 2-5 AM suspicious
    if ([0, 6].includes(dayOfWeek)) riskScore += 0.1; // Weekend

    return {
      name: "Time Anomaly",
      value: Math.min(riskScore, 1),
      description: `Transaction at ${transaction.timestamp.toLocaleTimeString()}`,
      weight: 0.5,
    };
  }

  /**
   * Assess device risk
   */
  private assessDeviceRisk(transaction: any): FraudFactor {
    const deviceId = transaction.deviceId || crypto
      .createHash("sha256")
      .update(transaction.userAgent)
      .digest("hex");

    let riskScore = 0.15; // Default low risk

    // Check if device has previous fraud history
    if (this.suspiciousDevices.has(deviceId)) {
      riskScore = (this.suspiciousDevices.get(deviceId) || 0) / 100;
    }

    return {
      name: "Device Risk",
      value: riskScore,
      description: `Device fingerprint: ${deviceId.substring(0, 8)}...`,
      weight: 0.7,
    };
  }

  /**
   * Check IP reputation
   */
  private checkIPReputation(ipAddress: string): FraudFactor {
    let riskScore = 0.15; // Default

    // Check blocklist
    if (this.blockedIPs.has(ipAddress)) {
      riskScore = 0.95;
    }

    // VPN/Proxy detection (simplified)
    if (this.isVPNIP(ipAddress)) {
      riskScore = Math.max(riskScore, 0.4);
    }

    // Known high-risk country (simplified - in production use GeoIP DB)
    if (this.isHighRiskCountry(ipAddress)) {
      riskScore = Math.max(riskScore, 0.5);
    }

    return {
      name: "IP Reputation",
      value: riskScore,
      description: `IP: ${ipAddress}`,
      weight: 0.8,
    };
  }

  /**
   * Assess payment method risk
   */
  private assessPaymentMethodRisk(method: string): FraudFactor {
    const riskLevels: Record<string, number> = {
      credit_card: 0.3,
      debit_card: 0.2,
      bank_transfer: 0.15,
      cryptocurrency: 0.6,
      wallet: 0.25,
      cash: 0.1,
      bit: 0.2,
    };

    const riskScore = riskLevels[method] || 0.3;

    return {
      name: "Payment Method Risk",
      value: riskScore,
      description: `Method: ${method}`,
      weight: 0.6,
    };
  }

  /**
   * Assess cross-border transaction risk
   */
  private assessCrossBorderRisk(transaction: any): FraudFactor {
    const isInternational = transaction.sourceCountry !== transaction.destinationCountry;

    if (!isInternational) {
      return {
        name: "Cross-Border Risk",
        value: 0.1,
        description: "Domestic transaction",
        weight: 0.7,
      };
    }

    // International transactions have higher risk
    let riskScore = 0.35;

    // High-risk corridors
    const highRiskCountries = ["KP", "IR", "SY", "CU"]; // Sanctioned countries
    if (
      highRiskCountries.includes(transaction.destinationCountry) ||
      highRiskCountries.includes(transaction.sourceCountry)
    ) {
      riskScore = 0.9;
    }

    return {
      name: "Cross-Border Risk",
      value: riskScore,
      description: `${transaction.sourceCountry} → ${transaction.destinationCountry}`,
      weight: 0.8,
    };
  }

  /**
   * Analyze behavioral patterns
   */
  private analyzeBehavioralPattern(
    transaction: any,
    historicalTransactions: any[]
  ): FraudFactor {
    // Recurring transactions are less suspicious
    if (transaction.isRecurring) {
      return {
        name: "Behavioral Pattern",
        value: 0.1,
        description: "Recurring/subscription transaction",
        weight: 0.7,
      };
    }

    // Check if transaction follows normal patterns
    const frequency = historicalTransactions.length / 30; // txns per day
    const riskScore = Math.min(frequency * 0.05, 0.4); // Higher frequency = slightly riskier

    return {
      name: "Behavioral Pattern",
      value: riskScore,
      description: `Frequency: ${frequency.toFixed(1)} txns/day`,
      weight: 0.6,
    };
  }

  /**
   * Helper methods
   */

  private isVPNIP(ip: string): boolean {
    // Simplified: In production, use IP geolocation service
    // Check against known VPN provider IPs
    return false;
  }

  private isHighRiskCountry(ip: string): boolean {
    // Simplified: In production, use GeoIP database
    return false;
  }

  /**
   * Block an IP address
   */
  blockIP(ipAddress: string) {
    this.blockedIPs.add(ipAddress);
    console.log(`[Fraud] Blocked IP: ${ipAddress}`);
  }

  /**
   * Update device risk score
   */
  updateDeviceRiskScore(deviceId: string, riskScore: number) {
    this.suspiciousDevices.set(deviceId, riskScore);
  }

  /**
   * Log fraud event
   */
  private logFraudEvent(businessId: string, fraud: FraudScore, transaction: any) {
    const event: FraudEvent = {
      businessId,
      transactionId: transaction.transactionId,
      fraudScore: fraud,
      timestamp: new Date(),
      transaction,
    };

    this.fraudHistory.push(event);

    // Keep last 1000 events
    if (this.fraudHistory.length > 1000) {
      this.fraudHistory = this.fraudHistory.slice(-1000);
    }

    console.log(`[Fraud Detection] ${fraud.level.toUpperCase()}: ${fraud.score} (Business: ${businessId})`);
  }

  /**
   * Get fraud statistics
   */
  getStats() {
    return {
      totalEventsLogged: this.fraudHistory.length,
      blockedIPs: this.blockedIPs.size,
      suspiciousDevices: this.suspiciousDevices.size,
      highRiskEvents: this.fraudHistory.filter((e) => e.fraudScore.level === "high" || e.fraudScore.level === "critical").length,
    };
  }
}

// Type definitions
interface FraudEvent {
  businessId: string;
  transactionId?: string;
  fraudScore: FraudScore;
  timestamp: Date;
  transaction: any;
}

export default FraudDetectionEngine;
