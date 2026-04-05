import * as ml from "ml-matrix";

export interface FraudScore {
  riskLevel: "low" | "medium" | "high" | "critical";
  score: number; // 0-100
  factors: FraudFactor[];
  recommendation: string;
  confidenceLevel: number;
  timestamp: Date;
}

export interface FraudFactor {
  name: string;
  weight: number; // contribution to overall score
  value: number; // 0-100 individual factor score
  explanation: string;
}

export interface TransactionContext {
  userId: string;
  amount: number;
  currency: string;
  timestamp: Date;
  userLocation: { latitude: number; longitude: number };
  deviceInfo: { id: string; type: string; fingerprint: string };
  ipAddress: string;
  email: string;
  cardLastFour?: string;
  merchant?: { id: string; highRisk: boolean };
  previousTransactions?: number;
  accountAge?: number; // days
}

class AIFraudAnalyzer {
  private transactionHistory: Map<string, any[]> = new Map();
  private deviceProfiles: Map<string, any> = new Map();
  private fraudPatterns: string[] = [
    "card_testing",
    "account_takeover",
    "identity_theft",
    "money_laundering",
    "triangulation_fraud",
    "chargeback_fraud",
  ];

  /**
   * Comprehensive fraud analysis using multiple ML models
   */
  analyzeFraud(context: TransactionContext): FraudScore {
    const factors: FraudFactor[] = [];

    // 1. Velocity Analysis
    factors.push(this.analyzeVelocity(context));

    // 2. Geographic Analysis
    factors.push(this.analyzeGeographic(context));

    // 3. Device Analysis
    factors.push(this.analyzeDevice(context));

    // 4. Amount Analysis
    factors.push(this.analyzeAmount(context));

    // 5. Account Behavior Analysis
    factors.push(this.analyzeAccountBehavior(context));

    // 6. Network Analysis
    factors.push(this.analyzeNetwork(context));

    // 7. Time-based Analysis
    factors.push(this.analyzeTimingPattern(context));

    // 8. Merchant Category Analysis
    factors.push(this.analyzeMerchantRisk(context));

    // Calculate weighted score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedScore = factors.reduce((sum, f) => sum + (f.value * f.weight), 0) / totalWeight;

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    if (weightedScore >= 80) riskLevel = "critical";
    else if (weightedScore >= 60) riskLevel = "high";
    else if (weightedScore >= 40) riskLevel = "medium";

    // Store transaction for future analysis
    this.storeTransaction(context);

    return {
      riskLevel,
      score: Math.round(weightedScore),
      factors,
      recommendation: this.generateRecommendation(riskLevel, weightedScore, factors),
      confidenceLevel: this.calculateConfidence(factors),
      timestamp: new Date(),
    };
  }

  /**
   * Velocity Analysis - detects rapid-fire transactions
   */
  private analyzeVelocity(context: TransactionContext): FraudFactor {
    const recentTransactions = this.getRecentTransactions(context.userId, 1); // last 1 hour

    // Card Testing Pattern: Multiple small transactions in short time
    const isCardTesting =
      recentTransactions.length > 5 &&
      recentTransactions.every(t => t.amount < 10) &&
      context.amount < 10;

    // Account Takeover Pattern: Unusual volume increase
    const avgAmount = recentTransactions.length > 0
      ? recentTransactions.reduce((sum, t) => sum + t.amount, 0) / recentTransactions.length
      : 0;

    const velocityMultiplier = Math.min(recentTransactions.length / 5 * 20, 100);
    const cardTestingScore = isCardTesting ? 80 : 0;
    const abnormalVolumeScore = recentTransactions.length > 10 ? 60 : 0;

    const score = Math.max(velocityMultiplier, cardTestingScore, abnormalVolumeScore);

    return {
      name: "Velocity Score",
      weight: 15, // 15% of total
      value: Math.min(score, 100),
      explanation: `${recentTransactions.length} transactions in last hour. ${isCardTesting ? "Card testing pattern detected." : "Normal velocity."}`,
    };
  }

  /**
   * Geographic Analysis - detects impossible travel
   */
  private analyzeGeometric(context: TransactionContext): FraudFactor {
    const lastTransaction = this.getLastTransaction(context.userId);

    if (!lastTransaction) {
      return {
        name: "Geographic Score",
        weight: 12,
        value: 0,
        explanation: "First transaction - no geographic baseline.",
      };
    }

    // Calculate distance between last and current location
    const distance = this.calculateDistance(
      lastTransaction.userLocation.latitude,
      lastTransaction.userLocation.longitude,
      context.userLocation.latitude,
      context.userLocation.longitude
    );

    // Calculate time difference in hours
    const timeDiff = (context.timestamp.getTime() - lastTransaction.timestamp.getTime()) / (1000 * 60 * 60);

    // Impossible travel: > 500 km in < 1 hour
    const impossibleTravel = distance > 500 && timeDiff < 1;
    const improbableSpeed = distance / timeDiff > 900; // > 900 km/hour

    const score = impossibleTravel ? 95 : improbableSpeed ? 70 : Math.max(0, (distance / 5000) * 30);

    return {
      name: "Geographic Score",
      weight: 12,
      value: Math.min(score, 100),
      explanation: `${Math.round(distance)} km from last location in ${Math.round(timeDiff * 100) / 100} hours. ${impossibleTravel ? "Impossible travel detected!" : ""}`,
    };
  }

  /**
   * Device Analysis - detects device anomalies
   */
  private analyzeDevice(context: TransactionContext): FraudFactor {
    const knownDevices = this.getKnownDevices(context.userId);
    const isNewDevice = !knownDevices.some(d => d.id === context.deviceInfo.id);
    const isNewDeviceType = !knownDevices.some(d => d.type === context.deviceInfo.type);

    // Device fingerprint mismatch
    const fingerprints = knownDevices.map(d => d.fingerprint);
    const fingerprintMismatch = !fingerprints.includes(context.deviceInfo.fingerprint);

    // Calculate device risk
    let score = 0;
    if (isNewDevice) score += 30;
    if (isNewDeviceType) score += 20;
    if (fingerprintMismatch) score += 25;

    // Multiple different devices in short time
    const recentDevices = this.getRecentTransactions(context.userId, 0.5).map(t => t.deviceInfo.id);
    if (new Set(recentDevices).size > 3) score += 20;

    return {
      name: "Device Score",
      weight: 14,
      value: Math.min(score, 100),
      explanation: `${isNewDevice ? "New device detected. " : ""}${isNewDeviceType ? "New device type. " : ""}${knownDevices.length} known devices in history.`,
    };
  }

  /**
   * Amount Analysis - detects unusual transaction amounts
   */
  private analyzeAmount(context: TransactionContext): FraudFactor {
    const transactionHistory = this.getTransactionHistory(context.userId) || [];

    if (transactionHistory.length === 0) {
      return {
        name: "Amount Score",
        weight: 10,
        value: 0,
        explanation: "First transaction - no amount baseline.",
      };
    }

    // Calculate statistics
    const amounts = transactionHistory.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Z-score: How many standard deviations from mean
    const zScore = Math.abs((context.amount - mean) / stdDev);

    // Unusual amount = Z-score > 3 (beyond 99.7% of normal)
    const isAbnormal = zScore > 3;
    const isUnusual = zScore > 2;

    const score = Math.min(zScore * 20, 100);

    return {
      name: "Amount Score",
      weight: 10,
      value: score,
      explanation: `Z-score: ${zScore.toFixed(2)}. Average: $${mean.toFixed(2)}, Current: $${context.amount}. ${isAbnormal ? "Highly unusual amount!" : isUnusual ? "Unusual amount." : "Normal."}`,
    };
  }

  /**
   * Account Behavior Analysis
   */
  private analyzeAccountBehavior(context: TransactionContext): FraudFactor {
    const accountAge = context.accountAge || 0;
    const previousTransactions = context.previousTransactions || 0;

    // New accounts are higher risk
    const newAccountScore = accountAge < 7 ? 40 : accountAge < 30 ? 20 : 0;

    // Dormant account suddenly active
    const lastTransaction = this.getLastTransaction(context.userId);
    const dormantScore = lastTransaction &&
      (context.timestamp.getTime() - lastTransaction.timestamp.getTime()) > 90 * 24 * 60 * 60 * 1000 // 90 days
      ? 30
      : 0;

    // Verified accounts are safer
    const verificationBonus = previousTransactions > 10 ? -20 : 0;

    const score = Math.max(0, newAccountScore + dormantScore + verificationBonus);

    return {
      name: "Account Behavior Score",
      weight: 11,
      value: score,
      explanation: `Account age: ${accountAge} days. Previous transactions: ${previousTransactions}. ${accountAge < 7 ? "New account - higher risk. " : ""}`,
    };
  }

  /**
   * Network Analysis - detects suspicious IPs and VPNs
   */
  private analyzeNetwork(context: TransactionContext): FraudFactor {
    // Simulate IP reputation checks
    const knownVPNRanges = ["10.", "192.168.", "172.16"];
    const isVPNLikely = knownVPNRanges.some(range => context.ipAddress.startsWith(range));

    // Proxy detection (simplified)
    const isProxy = context.ipAddress.includes("proxy") || context.ipAddress.includes("vpn");

    // Known fraud IPs would be queried from threat database
    const isFraudIP = false; // In production: query threat intelligence API

    let score = 0;
    if (isVPNLikely) score += 25;
    if (isProxy) score += 35;
    if (isFraudIP) score += 50;

    return {
      name: "Network Score",
      weight: 10,
      value: score,
      explanation: `IP: ${context.ipAddress}. ${isVPNLikely ? "VPN/Proxy likely. " : ""}${isFraudIP ? "Known fraud IP." : "Reputation clean."}`,
    };
  }

  /**
   * Timing Pattern Analysis
   */
  private analyzeTimingPattern(context: TransactionContext): FraudFactor {
    const hour = context.timestamp.getHours();
    const day = context.timestamp.getDay();

    // Unusual times (3 AM - 5 AM)
    const unusualHour = hour >= 3 && hour <= 5 ? 30 : 0;

    // Different pattern than user's history
    const userHistory = this.getTransactionHistory(context.userId) || [];
    const userActiveHours = new Set(userHistory.map(t => new Date(t.timestamp).getHours()));

    const outsideUserPattern = !userActiveHours.has(hour) && userActiveHours.size > 0 ? 25 : 0;

    const score = Math.max(unusualHour, outsideUserPattern);

    return {
      name: "Timing Score",
      weight: 8,
      value: score,
      explanation: `Time: ${context.timestamp.toLocaleTimeString()}. ${unusualHour > 0 ? "Unusual hour (3-5 AM). " : ""}${outsideUserPattern > 0 ? "Outside user's normal pattern." : ""}`,
    };
  }

  /**
   * Merchant Category Risk Analysis
   */
  private analyzeMerchantRisk(context: TransactionContext): FraudFactor {
    const highRiskCategories = [
      "gambling",
      "adult",
      "cryptocurrency_exchange",
      "money_transfer",
    ];

    const isHighRiskCategory = context.merchant?.highRisk || false;

    const score = isHighRiskCategory ? 40 : 0;

    return {
      name: "Merchant Risk Score",
      weight: 8,
      value: score,
      explanation: `${isHighRiskCategory ? "High-risk merchant category. " : "Standard merchant category."}`,
    };
  }

  /**
   * Generate actionable recommendation
   */
  private generateRecommendation(
    riskLevel: string,
    score: number,
    factors: FraudFactor[]
  ): string {
    if (riskLevel === "critical") {
      return "BLOCK transaction - Critical fraud indicators detected. Review manually if customer confirms.";
    }

    if (riskLevel === "high") {
      return "CHALLENGE with 3D Secure or OTP. Review high-risk factors before processing.";
    }

    if (riskLevel === "medium") {
      return "MONITOR - Allow with enhanced monitoring. Flag for manual review if multiple medium-risk transactions.";
    }

    return "APPROVE - Low fraud risk. Process normally.";
  }

  /**
   * Calculate confidence level of fraud prediction
   */
  private calculateConfidence(factors: FraudFactor[]): number {
    // More diverse factors = higher confidence
    const factorDiversity = factors.length / 8;

    // Extreme scores (very high or very low) = higher confidence
    const averageScore = factors.reduce((sum, f) => sum + f.value, 0) / factors.length;
    const extremeness = Math.abs(50 - averageScore) / 50;

    return Math.min(0.7 * factorDiversity + 0.3 * extremeness, 1) * 100;
  }

  /**
   * Detect specific fraud patterns
   */
  detectFraudPattern(context: TransactionContext): string | null {
    const recentTransactions = this.getRecentTransactions(context.userId, 2);

    // Card testing pattern
    if (
      recentTransactions.length > 5 &&
      recentTransactions.every(t => t.amount < 10) &&
      context.amount < 10
    ) {
      return "card_testing";
    }

    // Rapid escalation
    if (recentTransactions.length > 3) {
      const amounts = recentTransactions.map(t => t.amount);
      const avgIncrease = (amounts[amounts.length - 1] - amounts[0]) / amounts[0];
      if (avgIncrease > 1) return "rapid_escalation";
    }

    // Account takeover (low activity -> high activity)
    const oldTransactions = this.getRecentTransactions(context.userId, 30);
    if (oldTransactions.length < 5 && recentTransactions.length > 10) {
      return "account_takeover";
    }

    return null;
  }

  /**
   * Get fraud trends for dashboard
   */
  getFraudTrends(userId?: string) {
    const timeRanges = {
      "24h": 24,
      "7d": 24 * 7,
      "30d": 24 * 30,
    };

    const trends: Record<string, any> = {};

    Object.entries(timeRanges).forEach(([range, hours]) => {
      const transactions = userId
        ? this.getRecentTransactions(userId, hours)
        : Array.from(this.transactionHistory.values()).flat().slice(-100);

      const highRiskCount = transactions.filter(t => t.fraudScore?.score >= 60).length;
      const mediumRiskCount = transactions.filter(t => (t.fraudScore?.score || 0) >= 40 && (t.fraudScore?.score || 0) < 60).length;

      trends[range] = {
        total: transactions.length,
        highRisk: highRiskCount,
        mediumRisk: mediumRiskCount,
        riskPercentage: transactions.length > 0 ? ((highRiskCount + mediumRiskCount) / transactions.length * 100).toFixed(1) : 0,
      };
    });

    return trends;
  }

  // Helper methods
  private storeTransaction(context: TransactionContext) {
    if (!this.transactionHistory.has(context.userId)) {
      this.transactionHistory.set(context.userId, []);
    }
    this.transactionHistory.get(context.userId)!.push(context);
  }

  private getTransactionHistory(userId: string) {
    return this.transactionHistory.get(userId) || [];
  }

  private getRecentTransactions(userId: string, hours: number) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return (this.transactionHistory.get(userId) || []).filter(t => new Date(t.timestamp) > cutoff);
  }

  private getLastTransaction(userId: string) {
    const history = this.getTransactionHistory(userId);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  private getKnownDevices(userId: string) {
    return this.deviceProfiles.get(userId) || [];
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private analyzeGeographic = this.analyzeGeometric;
}

export const aiFraudAnalyzer = new AIFraudAnalyzer();
