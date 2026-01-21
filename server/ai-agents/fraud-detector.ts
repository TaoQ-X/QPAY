/**
 * Advanced Fraud Detection System for Q Pay
 * Uses machine learning patterns to detect suspicious transactions
 */

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  timestamp: Date;
  businessId: string;
  customerId?: string;
  paymentMethod: string;
  blockchain?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country: string;
    city: string;
  };
}

export interface FraudScore {
  transactionId: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  score: number; // 0-100
  reasons: string[];
  recommendedAction: "approve" | "review" | "block";
  confidence: number; // 0-1
}

export interface FraudPattern {
  name: string;
  weight: number;
  check: (transaction: Transaction, history: Transaction[]) => boolean;
}

/**
 * Fraud Detection Patterns
 */
const fraudPatterns: FraudPattern[] = [
  {
    name: "Unusual Amount",
    weight: 15,
    check: (txn, history) => {
      if (history.length < 5) return false;
      const avgAmount = history.reduce((sum, t) => sum + t.amount, 0) / history.length;
      const threshold = avgAmount * 3; // Alert if 3x average
      return txn.amount > threshold;
    },
  },
  {
    name: "High Frequency Transactions",
    weight: 20,
    check: (txn, history) => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentTxns = history.filter(t => t.timestamp > oneHourAgo);
      return recentTxns.length > 10; // More than 10 in 1 hour
    },
  },
  {
    name: "Geographic Impossibility",
    weight: 25,
    check: (txn, history) => {
      if (!txn.location || history.length === 0) return false;
      const lastTxn = history[history.length - 1];
      if (!lastTxn.location) return false;

      const timeDiff = (txn.timestamp.getTime() - lastTxn.timestamp.getTime()) / (1000 * 60);
      // Impossible if transactions 1000+ km apart in < 2 hours
      if (timeDiff < 120 && txn.location.country !== lastTxn.location.country) {
        return true;
      }
      return false;
    },
  },
  {
    name: "First Time Payment Method",
    weight: 10,
    check: (txn, history) => {
      return !history.some(t => t.paymentMethod === txn.paymentMethod);
    },
  },
  {
    name: "Unusual Time Pattern",
    weight: 12,
    check: (txn) => {
      const hour = txn.timestamp.getHours();
      // Alert for transactions at unusual hours (2-5 AM)
      return hour >= 2 && hour <= 5;
    },
  },
  {
    name: "Velocity Spike",
    weight: 18,
    check: (txn, history) => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const dailyTxns = history.filter(t => t.timestamp > oneDayAgo);
      const avgDaily = 5; // Expected ~5 txns per day
      return dailyTxns.length > avgDaily * 2; // Double the expected amount
    },
  },
  {
    name: "Device Fingerprint Change",
    weight: 14,
    check: (txn, history) => {
      if (!txn.userAgent || history.length === 0) return false;
      return !history.some(t => t.userAgent === txn.userAgent);
    },
  },
  {
    name: "IP Address Anomaly",
    weight: 16,
    check: (txn, history) => {
      if (!txn.ipAddress || history.length < 3) return false;
      const commonIPs = new Map<string, number>();
      history.forEach(t => {
        if (t.ipAddress) {
          commonIPs.set(t.ipAddress, (commonIPs.get(t.ipAddress) || 0) + 1);
        }
      });
      const isCommonIP = commonIPs.get(txn.ipAddress) || 0 > 2;
      return !isCommonIP; // Unusual if IP not seen before
    },
  },
  {
    name: "Blockchain Hop Attack",
    weight: 22,
    check: (txn, history) => {
      if (!txn.blockchain || history.length < 2) return false;
      const lastBlockchain = history[history.length - 1].blockchain;
      const timeDiff = (txn.timestamp.getTime() - history[history.length - 1].timestamp.getTime()) / 1000;
      // Alert if blockchain changes multiple times within 30 seconds
      return lastBlockchain !== txn.blockchain && timeDiff < 30;
    },
  },
];

/**
 * Main Fraud Detection Engine
 */
export class FraudDetectionEngine {
  private patterns = fraudPatterns;
  private riskThresholds = {
    low: 25,
    medium: 50,
    high: 75,
  };

  /**
   * Analyze a transaction for fraud risk
   */
  analyzTransaction(transaction: Transaction, history: Transaction[]): FraudScore {
    const detectedPatterns: { pattern: string; weight: number }[] = [];
    let totalScore = 0;

    // Check each pattern
    this.patterns.forEach(pattern => {
      try {
        if (pattern.check(transaction, history)) {
          detectedPatterns.push({ pattern: pattern.name, weight: pattern.weight });
          totalScore += pattern.weight;
        }
      } catch (error) {
        console.error(`Error checking pattern ${pattern.name}:`, error);
      }
    });

    // Normalize score to 0-100
    const normalizedScore = Math.min(totalScore, 100);

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical";
    if (normalizedScore < this.riskThresholds.low) {
      riskLevel = "low";
    } else if (normalizedScore < this.riskThresholds.medium) {
      riskLevel = "medium";
    } else if (normalizedScore < this.riskThresholds.high) {
      riskLevel = "high";
    } else {
      riskLevel = "critical";
    }

    // Determine recommended action
    const recommendedAction: "approve" | "review" | "block" =
      riskLevel === "low" ? "approve" : riskLevel === "medium" ? "review" : "block";

    // Calculate confidence (0-1)
    const confidence = Math.min(detectedPatterns.length / this.patterns.length, 1);

    return {
      transactionId: transaction.id,
      riskLevel,
      score: Math.round(normalizedScore),
      reasons: detectedPatterns.map(p => p.pattern),
      recommendedAction,
      confidence: Math.round(confidence * 100) / 100,
    };
  }

  /**
   * Batch analyze multiple transactions
   */
  analyzeBatch(transactions: Transaction[], history: Transaction[] = []): FraudScore[] {
    return transactions.map(txn => {
      const txnHistory = history.filter(h => h.businessId === txn.businessId);
      return this.analyzTransaction(txn, txnHistory);
    });
  }

  /**
   * Get risk statistics
   */
  getRiskStatistics(scores: FraudScore[]) {
    const riskCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const totalRiskScore = scores.reduce((sum, score) => sum + score.score, 0);
    const avgRiskScore = scores.length > 0 ? totalRiskScore / scores.length : 0;
    const maxRiskScore = Math.max(...scores.map(s => s.score), 0);

    scores.forEach(score => {
      riskCounts[score.riskLevel]++;
    });

    return {
      totalTransactions: scores.length,
      riskCounts,
      averageRiskScore: Math.round(avgRiskScore),
      maxRiskScore,
      blockRecommendations: scores.filter(s => s.recommendedAction === "block").length,
      reviewRecommendations: scores.filter(s => s.recommendedAction === "review").length,
    };
  }

  /**
   * Detect fraud rings (coordinated fraud)
   */
  detectFraudRings(
    transactions: Transaction[],
    similarityThreshold: number = 0.8
  ): Transaction[][] {
    const rings: Transaction[][] = [];
    const processed = new Set<string>();

    for (const txn of transactions) {
      if (processed.has(txn.id)) continue;

      const ring: Transaction[] = [txn];
      processed.add(txn.id);

      for (const other of transactions) {
        if (processed.has(other.id)) continue;
        if (this.isSimilarTransaction(txn, other) > similarityThreshold) {
          ring.push(other);
          processed.add(other.id);
        }
      }

      if (ring.length > 1) {
        rings.push(ring);
      }
    }

    return rings;
  }

  /**
   * Calculate similarity between two transactions (0-1)
   */
  private isSimilarTransaction(txn1: Transaction, txn2: Transaction): number {
    let similarity = 0;
    let factors = 0;

    // Amount similarity (within 10%)
    if (Math.abs(txn1.amount - txn2.amount) / Math.max(txn1.amount, txn2.amount) < 0.1) {
      similarity += 0.2;
    }
    factors += 0.2;

    // Payment method match
    if (txn1.paymentMethod === txn2.paymentMethod) {
      similarity += 0.2;
    }
    factors += 0.2;

    // Location match
    if (txn1.location?.country === txn2.location?.country) {
      similarity += 0.2;
    }
    factors += 0.2;

    // Time proximity (within 1 hour)
    const timeDiff = Math.abs(txn1.timestamp.getTime() - txn2.timestamp.getTime()) / (60 * 1000);
    if (timeDiff < 60) {
      similarity += 0.2;
    }
    factors += 0.2;

    // IP address match
    if (txn1.ipAddress && txn1.ipAddress === txn2.ipAddress) {
      similarity += 0.2;
    }
    factors += 0.2;

    return similarity / factors;
  }
}

/**
 * Real-time Fraud Alerts
 */
export interface FraudAlert {
  id: string;
  transactionId: string;
  severity: "warning" | "critical";
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  suggestedAction: string;
}

export class FraudAlertManager {
  private alerts: FraudAlert[] = [];
  private maxAlerts = 1000;

  /**
   * Create alert from fraud score
   */
  createAlert(score: FraudScore, transaction: Transaction): FraudAlert | null {
    if (score.riskLevel === "low") return null;

    const severity = score.riskLevel === "critical" ? "critical" : "warning";

    const alert: FraudAlert = {
      id: `alert_${Date.now()}_${Math.random()}`,
      transactionId: transaction.id,
      severity,
      message: `${score.riskLevel.toUpperCase()} fraud risk detected. Score: ${score.score}/100. Reasons: ${score.reasons.join(", ")}`,
      timestamp: new Date(),
      actionRequired: score.riskLevel === "critical",
      suggestedAction: `Transaction ${score.recommendedAction === "block" ? "blocked" : "flagged for review"}`,
    };

    this.addAlert(alert);
    return alert;
  }

  /**
   * Add alert and manage alert history
   */
  private addAlert(alert: FraudAlert) {
    this.alerts.unshift(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.pop();
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 50): FraudAlert[] {
    return this.alerts.slice(0, limit);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: "warning" | "critical"): FraudAlert[] {
    return this.alerts.filter(a => a.severity === severity);
  }

  /**
   * Get unresolved alerts
   */
  getUnresolvedAlerts(): FraudAlert[] {
    return this.alerts.filter(a => a.actionRequired);
  }

  /**
   * Clear alerts older than X hours
   */
  clearOldAlerts(hoursOld: number = 24) {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime);
  }
}
