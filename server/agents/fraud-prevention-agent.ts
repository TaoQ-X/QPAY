import { AIAgent, Task, AgentMemory } from "../services/ai-agent-framework";
import { aiFraudAnalyzer } from "../services/ai-fraud-analyzer";

interface FraudAlert {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  description: string;
  detectedAt: Date;
  affectedTransactions: string[];
  recommendedAction: string;
  status: "new" | "investigating" | "mitigated" | "resolved";
}

interface ThreatProfile {
  profileId: string;
  threatType: string;
  indicators: string[];
  riskScore: number;
  firstDetected: Date;
  lastSeen: Date;
  occurrences: number;
  mitigation: string;
}

/**
 * Fraud Prevention Agent - autonomously detects and responds to fraud
 * Learns fraud patterns and improves detection accuracy over time
 */
class FraudPreventionAgent extends AIAgent {
  private activeAlerts: Map<string, FraudAlert> = new Map();
  private threatProfiles: Map<string, ThreatProfile> = new Map();
  private detectionRules: Map<string, any> = new Map();
  private blockedIPs: Set<string> = new Set();
  private suspiciousAccounts: Map<string, any> = new Map();
  private fraudPatterns: Map<string, any> = new Map();

  constructor() {
    super(
      "Guardian Shield",
      "Fraud Prevention Officer",
      [
        "fraud_detection",
        "threat_analysis",
        "account_protection",
        "transaction_blocking",
        "pattern_recognition",
      ]
    );
    this.initializeDetectionRules();
    this.initializeCommonFraudPatterns();
  }

  /**
   * Initialize fraud detection rules
   */
  private initializeDetectionRules(): void {
    // Card testing pattern detection
    this.detectionRules.set("card_testing", {
      description: "Multiple small transactions from same card",
      indicators: ["small_amount", "multiple_transactions", "short_timeframe"],
      threshold: 5, // 5+ transactions
      timeWindow: 3600000, // 1 hour
      severity: "high",
      autoBlock: true,
    });

    // Velocity abuse pattern
    this.detectionRules.set("velocity_abuse", {
      description: "Abnormal transaction frequency",
      indicators: ["high_frequency", "large_amount", "geographic_spread"],
      threshold: 10, // 10+ transactions
      timeWindow: 3600000,
      severity: "high",
      autoBlock: true,
    });

    // Account takeover detection
    this.detectionRules.set("account_takeover", {
      description: "Signs of compromised account",
      indicators: ["new_device", "different_location", "unusual_behavior"],
      threshold: 3, // 3+ indicators
      timeWindow: 86400000, // 24 hours
      severity: "critical",
      autoBlock: true,
    });

    // Chargeback fraud pattern
    this.detectionRules.set("chargeback_fraud", {
      description: "Pattern of disputed transactions",
      indicators: ["previous_chargebacks", "high_risk_category", "amount_spike"],
      threshold: 2,
      timeWindow: 2592000000, // 30 days
      severity: "high",
      autoBlock: true,
    });

    // Money laundering pattern
    this.detectionRules.set("money_laundering", {
      description: "Structuring or layering transactions",
      indicators: ["amount_just_below_threshold", "frequent_deposits", "unusual_withdrawals"],
      threshold: 10,
      timeWindow: 604800000, // 7 days
      severity: "critical",
      autoBlock: true,
    });
  }

  /**
   * Initialize common fraud patterns from historical data
   */
  private initializeCommonFraudPatterns(): void {
    this.fraudPatterns.set("high_risk_mcc", {
      categories: ["adult", "gambling", "cryptocurrency_exchange"],
      riskMultiplier: 2.5,
      requiresVerification: true,
    });

    this.fraudPatterns.set("international_card_not_present", {
      description: "Foreign card without AVV",
      riskScore: 75,
      requiresCVV: true,
      requires3DS: true,
    });

    this.fraudPatterns.set("bulk_refund_request", {
      description: "Multiple refund requests from same customer",
      threshold: 3,
      timeWindow: 604800000,
      action: "manual_review",
    });
  }

  /**
   * Generate detection options
   */
  protected async generateOptions(task: Task, context: any): Promise<string[]> {
    if (task.type === "detect_fraud") {
      return [
        "real_time_analysis",
        "behavioral_analysis",
        "network_analysis",
        "velocity_check",
        "machine_learning_scan",
      ];
    }

    if (task.type === "respond_to_fraud") {
      return [
        "block_transaction",
        "require_verification",
        "freeze_account",
        "alert_customer",
        "manual_review",
        "escalate_to_law_enforcement",
      ];
    }

    if (task.type === "threat_analysis") {
      return [
        "analyze_patterns",
        "identify_networks",
        "predict_evolution",
        "recommend_controls",
      ];
    }

    return ["default_detection"];
  }

  /**
   * Execute fraud detection and response
   */
  protected async executeDecision(task: Task, decision: string): Promise<any> {
    switch (task.type) {
      case "detect_fraud":
        return await this.performFraudDetection(task, decision);

      case "respond_to_fraud":
        return await this.respondToFraud(task, decision);

      case "threat_analysis":
        return await this.analyzeThreat(task);

      case "account_monitoring":
        return await this.monitorAccount(task);

      case "pattern_update":
        return await this.updateFraudPatterns(task);

      default:
        return { success: false };
    }
  }

  /**
   * Perform comprehensive fraud detection
   */
  private async performFraudDetection(task: Task, method: string): Promise<any> {
    const txData = JSON.parse(task.description);

    // Use AI fraud analyzer
    const fraudScore = aiFraudAnalyzer.analyzeFraud({
      userId: txData.userId,
      amount: txData.amount,
      currency: txData.currency,
      timestamp: new Date(),
      userLocation: txData.location,
      deviceInfo: txData.device,
      ipAddress: txData.ipAddress,
      email: txData.email,
      cardLastFour: txData.cardLastFour,
    });

    // Check against known fraud patterns
    const patternMatches = this.checkAgainstPatterns(txData);

    // Apply learned fraud rules
    const ruleMatches = this.applyLearningRules(txData);

    const result = {
      transactionId: txData.id,
      method,
      fraudScore,
      patternMatches,
      ruleMatches,
      detectionTime: new Date(),
      recommendation:
        fraudScore.riskLevel === "critical"
          ? "block_transaction"
          : fraudScore.riskLevel === "high"
          ? "require_verification"
          : "approve",
    };

    // Create alert if fraud detected
    if (fraudScore.riskLevel === "high" || fraudScore.riskLevel === "critical") {
      this.createFraudAlert(
        fraudScore.riskLevel,
        txData,
        fraudScore
      );
    }

    return result;
  }

  /**
   * Respond to detected fraud
   */
  private async respondToFraud(task: Task, action: string): Promise<any> {
    const fraudData = JSON.parse(task.description);

    const response = {
      fraudId: fraudData.fraudId,
      action,
      executedAt: new Date(),
      details: {},
    };

    switch (action) {
      case "block_transaction":
        response.details = {
          blocked: true,
          notification: "Transaction blocked due to fraud detection",
          refundInitiated: true,
          estimatedRefundTime: "1-2 business days",
        };
        break;

      case "require_verification":
        response.details = {
          challengeMethod: "email_verification",
          timeLimit: 3600000, // 1 hour
          maxAttempts: 3,
          description: "Please verify this transaction",
        };
        break;

      case "freeze_account":
        response.details = {
          accountFrozen: true,
          notificationSent: true,
          manualReviewScheduled: true,
          estimatedReviewTime: "< 2 hours",
        };
        break;

      case "alert_customer":
        response.details = {
          alertSent: true,
          channels: ["email", "sms", "in_app"],
          message: "Suspicious activity detected on your account",
          actionUrl: "/account/security",
        };
        break;

      case "manual_review":
        response.details = {
          assignedTo: "fraud_analyst",
          priority: "high",
          estimatedTime: "< 30 minutes",
          reviewProcess: [
            "Analyze transaction details",
            "Contact customer if needed",
            "Make decision",
            "Update fraud patterns",
          ],
        };
        break;

      case "escalate_to_law_enforcement":
        response.details = {
          escalated: true,
          agency: "FBI IC3",
          reportNumber: `FBI-${Date.now()}`,
          caseManager: "law_enforcement",
        };
        break;
    }

    return response;
  }

  /**
   * Analyze threat and predict evolution
   */
  private async analyzeThreat(task: Task): Promise<any> {
    const threatData = JSON.parse(task.description);

    // Identify threat type
    const threatType = this.identifyThreatType(threatData);

    // Check if it matches known patterns
    const matchingProfile = this.findMatchingThreatProfile(threatType);

    const analysis = {
      threatId: threatData.threatId,
      type: threatType,
      detectedAt: new Date(),
      severity: this.calculateThreatSeverity(threatData, threatType),
      indicators: this.extractIndicators(threatData),
      evolution: this.predictThreatEvolution(matchingProfile),
      recommendations: this.generateCountermeasures(threatType),
      networkAnalysis: this.analyzeAttackerNetwork(threatData),
    };

    // Update threat profile if new pattern
    if (!matchingProfile) {
      this.createNewThreatProfile(threatType, analysis);
    }

    return analysis;
  }

  /**
   * Monitor account for suspicious activity
   */
  private async monitorAccount(task: Task): Promise<any> {
    const accountData = JSON.parse(task.description);

    const monitoring = {
      accountId: accountData.accountId,
      monitoringStarted: new Date(),
      alerts: [] as any[],
      riskIndicators: [] as string[],
      recommendedActions: [] as string[],
    };

    // Check for multiple risk indicators
    if (accountData.newDevice && accountData.differentLocation) {
      monitoring.riskIndicators.push("Potential account takeover");
      monitoring.recommendedActions.push("Enable 2FA immediately");
      monitoring.alerts.push(
        this.createAlert("high", "account_takeover", accountData)
      );
    }

    if (accountData.unusualTransactionPattern) {
      monitoring.riskIndicators.push("Unusual transaction behavior");
      monitoring.recommendedActions.push("Review recent transactions");
    }

    if (accountData.failedLoginAttempts > 5) {
      monitoring.riskIndicators.push("Multiple failed login attempts");
      monitoring.recommendedActions.push("Reset password");
      monitoring.alerts.push(
        this.createAlert("high", "brute_force_attempt", accountData)
      );
    }

    return monitoring;
  }

  /**
   * Update fraud patterns based on new learnings
   */
  private async updateFraudPatterns(task: Task): Promise<any> {
    const patternData = JSON.parse(task.description);

    // Create or update fraud pattern memory
    const pattern: AgentMemory = {
      id: `pattern_${Date.now()}`,
      agentId: this.id,
      type: "pattern",
      content: `Fraud Pattern: ${patternData.type} - ${patternData.description}`,
      dataPoints: [patternData],
      successRate: patternData.successRate || 0.8,
      timestamp: new Date(),
      appliedCount: 0,
    };

    this.memory.set(pattern.id, pattern);

    // Update fraud patterns database
    this.fraudPatterns.set(patternData.id, {
      ...patternData,
      discovered: new Date(),
      occurrences: 1,
    });

    return {
      patternId: patternData.id,
      status: "learned",
      applicableToFutureDetections: true,
      successRate: pattern.successRate,
    };
  }

  /**
   * Check transaction against known patterns
   */
  private checkAgainstPatterns(txData: any): any[] {
    const matches: any[] = [];

    for (const [patternId, pattern] of this.fraudPatterns) {
      if (this.matchesPattern(txData, pattern)) {
        matches.push({
          patternId,
          type: pattern.type,
          riskMultiplier: pattern.riskMultiplier || 1,
        });
      }
    }

    return matches;
  }

  /**
   * Check if transaction matches a fraud pattern
   */
  private matchesPattern(txData: any, pattern: any): boolean {
    // Check merchant category
    if (
      pattern.categories &&
      pattern.categories.includes(txData.mcc)
    ) {
      return true;
    }

    // Check amount pattern
    if (pattern.amountThreshold && txData.amount > pattern.amountThreshold) {
      return true;
    }

    // Check velocity
    if (pattern.frequencyThreshold && txData.frequency > pattern.frequencyThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Apply learned fraud detection rules
   */
  private applyLearningRules(txData: any): any[] {
    const matches: any[] = [];

    // Check learned patterns from memory
    for (const [, memory] of this.memory) {
      if (
        memory.type === "rule" &&
        memory.successRate > 0.7 &&
        this.ruleMatches(txData, memory.content)
      ) {
        matches.push({
          ruleId: memory.id,
          rule: memory.content,
          confidence: memory.successRate,
        });
      }
    }

    return matches;
  }

  /**
   * Check if transaction matches a rule
   */
  private ruleMatches(txData: any, rule: string): boolean {
    // Simple rule matching - in production would be more sophisticated
    const highRiskIndicators = [
      "adult",
      "gambling",
      "cryptocurrency",
    ];

    return highRiskIndicators.some(indicator =>
      rule.toLowerCase().includes(indicator)
    );
  }

  /**
   * Create fraud alert
   */
  private createFraudAlert(
    severity: string,
    txData: any,
    fraudScore: any
  ): FraudAlert {
    const alert: FraudAlert = {
      id: `alert_${Date.now()}`,
      severity: severity as any,
      type: fraudScore.riskLevel,
      description: fraudScore.recommendation,
      detectedAt: new Date(),
      affectedTransactions: [txData.id],
      recommendedAction: fraudScore.recommendation,
      status: "new",
    };

    this.activeAlerts.set(alert.id, alert);
    return alert;
  }

  /**
   * Identify threat type
   */
  private identifyThreatType(threatData: any): string {
    if (threatData.indicators.includes("card_testing")) {
      return "card_testing";
    }
    if (threatData.indicators.includes("account_takeover")) {
      return "account_takeover";
    }
    if (threatData.indicators.includes("money_laundering")) {
      return "money_laundering";
    }
    return "unknown_threat";
  }

  /**
   * Find matching threat profile
   */
  private findMatchingThreatProfile(threatType: string): ThreatProfile | null {
    for (const [, profile] of this.threatProfiles) {
      if (profile.threatType === threatType) {
        return profile;
      }
    }
    return null;
  }

  /**
   * Calculate threat severity
   */
  private calculateThreatSeverity(threatData: any, threatType: string): string {
    let score = 0;

    if (threatData.indicators.length > 3) score += 40;
    if (threatType === "account_takeover") score += 50;
    if (threatData.affectedAmount > 50000) score += 30;

    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  /**
   * Extract threat indicators
   */
  private extractIndicators(threatData: any): string[] {
    return threatData.indicators || [];
  }

  /**
   * Predict threat evolution
   */
  private predictThreatEvolution(profile: ThreatProfile | null): string {
    if (!profile) return "Unknown evolution pattern";

    if (profile.occurrences > 10) {
      return "Threat escalating - frequency increasing";
    }
    if (profile.occurrences > 5) {
      return "Threat stable - monitoring required";
    }
    return "Threat contained";
  }

  /**
   * Generate countermeasures
   */
  private generateCountermeasures(threatType: string): string[] {
    const measures: Record<string, string[]> = {
      card_testing: [
        "Block multiple small transactions",
        "Require 3D Secure",
        "Enable velocity limits",
      ],
      account_takeover: [
        "Force password reset",
        "Enable 2FA",
        "Freeze account temporarily",
      ],
      money_laundering: [
        "Report to FinCEN",
        "Implement transaction monitoring",
        "Request source of funds documentation",
      ],
    };

    return measures[threatType] || ["Manual review recommended"];
  }

  /**
   * Analyze attacker network
   */
  private analyzeAttackerNetwork(threatData: any): any {
    return {
      knownAttackers: this.blockedIPs.size,
      relatedIncidents: this.activeAlerts.size,
      networkThreatLevel: "medium",
      recommendation: "Monitor for related activities",
    };
  }

  /**
   * Create new threat profile
   */
  private createNewThreatProfile(
    threatType: string,
    analysis: any
  ): void {
    const profile: ThreatProfile = {
      profileId: `threat_${Date.now()}`,
      threatType,
      indicators: analysis.indicators,
      riskScore: 70,
      firstDetected: new Date(),
      lastSeen: new Date(),
      occurrences: 1,
      mitigation: analysis.recommendations.join("; "),
    };

    this.threatProfiles.set(profile.profileId, profile);
  }

  /**
   * Create alert helper
   */
  private createAlert(severity: string, type: string, data: any): FraudAlert {
    return {
      id: `alert_${Date.now()}`,
      severity: severity as any,
      type,
      description: `${type} detected`,
      detectedAt: new Date(),
      affectedTransactions: [data.transactionId || data.accountId],
      recommendedAction: "manual_review",
      status: "new",
    };
  }

  /**
   * Get fraud detection status
   */
  getFraudStatus(): any {
    return {
      activeAlerts: this.activeAlerts.size,
      threatProfiles: this.threatProfiles.size,
      blockedIPs: this.blockedIPs.size,
      fraudPatternsLearned: this.memory.size,
      detectionAccuracy: `${this.performanceMetrics.qualityScore.toFixed(1)}%`,
      lastDetection: Array.from(this.activeAlerts.values())[0]?.detectedAt,
    };
  }

  /**
   * Block suspicious IP
   */
  blockIP(ipAddress: string): void {
    this.blockedIPs.add(ipAddress);
  }

  /**
   * Get blocked IPs list
   */
  getBlockedIPs(): string[] {
    return Array.from(this.blockedIPs);
  }
}

export const fraudPreventionAgent = new FraudPreventionAgent();
