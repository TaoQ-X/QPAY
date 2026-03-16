/**
 * AI-Powered Analytics & Smart Routing Engine
 * Machine learning for optimal payment routing and predictive analytics
 */

export interface PaymentPattern {
  averageAmount: number;
  frequency: "daily" | "weekly" | "monthly";
  successRate: number;
  preferredMethod: string;
  preferredCountry: string;
  bestTimeToProcess: string; // Hour of day
  seasonalityFactor: number;
}

export interface RoutingRecommendation {
  recommendedMethod: string;
  recommendedCorridor: string;
  estimatedTime: number; // minutes
  estimatedFee: number;
  successProbability: number;
  alternativeRoutes: RouteOption[];
}

export interface RouteOption {
  method: string;
  corridor: string;
  time: number;
  fee: number;
  probability: number;
}

export interface PredictiveAnalytics {
  expectedRevenue: number;
  expectedTransactions: number;
  expectedChurn: number;
  growthProjection: number; // percentage
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
}

export class AIAnalyticsEngine {
  private transactionHistory: any[] = [];
  private patterns: Map<string, PaymentPattern> = new Map();
  private routingRules: RoutingRule[] = [];

  /**
   * Analyze transaction patterns for a business
   */
  analyzePatterns(businessId: string, transactions: any[]): PaymentPattern {
    if (transactions.length === 0) {
      return this.getDefaultPattern();
    }

    // Calculate statistics
    const amounts = transactions.map((t) => t.amount);
    const averageAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Determine frequency
    const daysDiff = this.getDaysDifference(transactions);
    const frequency = this.determineFrequency(transactions.length, daysDiff);

    // Calculate success rate
    const successfulTxns = transactions.filter((t) => t.status === "confirmed").length;
    const successRate = successfulTxns / transactions.length;

    // Find preferred method
    const methods = this.groupBy(transactions, "paymentMethod");
    const preferredMethod = Object.keys(methods).reduce((a, b) =>
      methods[a].length > methods[b].length ? a : b
    );

    // Find preferred country
    const countries = this.groupBy(transactions, "destinationCountry");
    const preferredCountry = Object.keys(countries).reduce((a, b) =>
      countries[a].length > countries[b].length ? a : b
    );

    // Analyze best processing time
    const hourCounts = new Array(24).fill(0);
    transactions.forEach((t) => {
      const hour = new Date(t.created_at).getHours();
      hourCounts[hour]++;
    });
    const bestHour = hourCounts.indexOf(Math.max(...hourCounts));
    const bestTimeToProcess = `${bestHour}:00`;

    // Calculate seasonality
    const seasonalityFactor = this.calculateSeasonality(transactions);

    const pattern: PaymentPattern = {
      averageAmount,
      frequency,
      successRate,
      preferredMethod,
      preferredCountry,
      bestTimeToProcess,
      seasonalityFactor,
    };

    this.patterns.set(businessId, pattern);
    return pattern;
  }

  /**
   * Recommend optimal payment route
   */
  getRoutingRecommendation(
    businessId: string,
    amount: number,
    destinationCountry: string
  ): RoutingRecommendation {
    const pattern = this.patterns.get(businessId) || this.getDefaultPattern();

    // Score different methods
    const routeScores = this.scoreRoutes(
      amount,
      destinationCountry,
      pattern
    );

    // Get top recommendation
    const topRoute = routeScores[0];

    // Generate alternatives
    const alternativeRoutes: RouteOption[] = routeScores.slice(1, 3).map((r) => ({
      method: r.method,
      corridor: r.corridor,
      time: r.time,
      fee: r.fee,
      probability: r.probability,
    }));

    return {
      recommendedMethod: topRoute.method,
      recommendedCorridor: topRoute.corridor,
      estimatedTime: topRoute.time,
      estimatedFee: topRoute.fee,
      successProbability: topRoute.probability,
      alternativeRoutes,
    };
  }

  /**
   * Predict future metrics
   */
  predictMetrics(businessId: string, transactions: any[]): PredictiveAnalytics {
    if (transactions.length === 0) {
      return this.getDefaultPrediction();
    }

    const pattern = this.analyzePatterns(businessId, transactions);

    // Revenue projection (based on last 30 days)
    const lastMonth = transactions.filter(
      (t) => new Date(t.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const currentMonthlyRevenue = lastMonth.reduce((sum, t) => sum + t.amount, 0);
    const expectedRevenue = currentMonthlyRevenue * (1 + pattern.seasonalityFactor);

    // Transaction count projection
    const expectedTransactions = Math.ceil(lastMonth.length * (1 + pattern.seasonalityFactor));

    // Churn prediction
    const expectedChurn = this.predictChurn(transactions);

    // Growth projection (ML-based trend)
    const growthProjection = this.calculateGrowthProjection(transactions);

    // Risk assessment
    const riskLevel = this.assessRisk(pattern, transactions);

    // Recommendations
    const recommendations = this.generateRecommendations(
      pattern,
      riskLevel,
      growthProjection
    );

    return {
      expectedRevenue: Math.round(expectedRevenue),
      expectedTransactions,
      expectedChurn,
      growthProjection,
      riskLevel,
      recommendations,
    };
  }

  /**
   * Score routes based on multiple factors
   */
  private scoreRoutes(
    amount: number,
    country: string,
    pattern: PaymentPattern
  ): RouteScoreResult[] {
    const routes: RouteScoreResult[] = [
      {
        method: "card",
        corridor: "Credit Card Network",
        time: 5,
        fee: Math.ceil(amount * 0.025),
        probability: 0.96,
        score: 0,
      },
      {
        method: "bank",
        corridor: "Bank Transfer",
        time: 24,
        fee: Math.ceil(amount * 0.015),
        probability: 0.98,
        score: 0,
      },
      {
        method: "crypto",
        corridor: "Blockchain",
        time: 10,
        fee: Math.ceil(amount * 0.001),
        probability: 0.85,
        score: 0,
      },
      {
        method: "wallet",
        corridor: "Digital Wallet",
        time: 2,
        fee: Math.ceil(amount * 0.02),
        probability: 0.94,
        score: 0,
      },
    ];

    // Score each route
    routes.forEach((route) => {
      let score = 0;

      // Preference factor
      if (route.method === pattern.preferredMethod) score += 30;

      // Success probability factor
      score += route.probability * 25;

      // Fee efficiency (lower is better)
      score += (1 - route.fee / amount) * 20;

      // Speed factor (faster is better)
      score += Math.max(0, 1 - route.time / 100) * 15;

      // Country-specific bonuses
      if (country === "IL" && route.corridor === "Bank Transfer") score += 10;
      if (country === "US" && route.method === "card") score += 5;
      if (country === "GB" && route.method === "bank") score += 5;

      route.score = score;
    });

    // Sort by score
    return routes.sort((a, b) => b.score - a.score);
  }

  /**
   * Predict churn probability
   */
  private predictChurn(transactions: any[]): number {
    if (transactions.length < 10) return 0;

    // Check activity trend
    const recentTxns = transactions.slice(-5);
    const olderTxns = transactions.slice(-10, -5);

    const recentRate = recentTxns.length / 5;
    const olderRate = olderTxns.length / 5;

    // Decreasing activity = higher churn risk
    const churnScore = Math.max(0, 1 - recentRate / olderRate) * 100;

    return Math.min(100, churnScore);
  }

  /**
   * Calculate growth projection
   */
  private calculateGrowthProjection(transactions: any[]): number {
    if (transactions.length < 20) return 5; // Default 5% for new merchants

    // Calculate month-over-month growth
    const lastMonth = transactions.filter(
      (t) => new Date(t.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const previousMonth = transactions.filter((t) => {
      const date = new Date(t.created_at);
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      return date > cutoff && date <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    });

    if (previousMonth.length === 0) return 10;

    const growth = ((lastMonth.length - previousMonth.length) / previousMonth.length) * 100;
    return Math.min(100, Math.max(-50, growth)); // Cap between -50% and 100%
  }

  /**
   * Assess business risk
   */
  private assessRisk(
    pattern: PaymentPattern,
    transactions: any[]
  ): "low" | "medium" | "high" {
    let riskScore = 0;

    // Low success rate = higher risk
    if (pattern.successRate < 0.95) riskScore += 30;

    // High transaction variance = risk
    const amounts = transactions.map((t) => t.amount);
    const variance = this.calculateVariance(amounts);
    if (variance > 1000000) riskScore += 20;

    // Check for fraud flags
    const fraudTxns = transactions.filter((t) => t.fraud_detected);
    if (fraudTxns.length > 0) riskScore += 40;

    if (riskScore > 60) return "high";
    if (riskScore > 30) return "medium";
    return "low";
  }

  /**
   * Generate AI recommendations
   */
  private generateRecommendations(
    pattern: PaymentPattern,
    riskLevel: string,
    growth: number
  ): string[] {
    const recommendations: string[] = [];

    if (pattern.successRate < 0.95) {
      recommendations.push("Improve payment method diversification");
    }

    if (riskLevel === "high") {
      recommendations.push("Enable stricter KYC verification");
    }

    if (growth > 20) {
      recommendations.push("Optimize settlement frequency for growth");
    }

    if (pattern.averageAmount > 50000) {
      recommendations.push("Consider dedicated account manager");
    }

    if (!recommendations.length) {
      recommendations.push("Continue current payment strategy");
    }

    return recommendations;
  }

  /**
   * Helper methods
   */

  private getDefaultPattern(): PaymentPattern {
    return {
      averageAmount: 1000,
      frequency: "weekly",
      successRate: 0.95,
      preferredMethod: "card",
      preferredCountry: "US",
      bestTimeToProcess: "14:00",
      seasonalityFactor: 0.1,
    };
  }

  private getDefaultPrediction(): PredictiveAnalytics {
    return {
      expectedRevenue: 10000,
      expectedTransactions: 10,
      expectedChurn: 5,
      growthProjection: 10,
      riskLevel: "low",
      recommendations: ["Monitor payment patterns"],
    };
  }

  private determineFrequency(
    count: number,
    days: number
  ): "daily" | "weekly" | "monthly" {
    const perDay = count / days;
    if (perDay > 1) return "daily";
    if (perDay > 0.15) return "weekly";
    return "monthly";
  }

  private getDaysDifference(transactions: any[]): number {
    if (transactions.length < 2) return 1;
    const first = new Date(transactions[0].created_at);
    const last = new Date(transactions[transactions.length - 1].created_at);
    return Math.max(1, Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private calculateSeasonality(transactions: any[]): number {
    const months = new Array(12).fill(0);
    transactions.forEach((t) => {
      const month = new Date(t.created_at).getMonth();
      months[month]++;
    });

    const avg = months.reduce((a, b) => a + b, 0) / 12;
    const variance = months.reduce((sum, m) => sum + Math.pow(m - avg, 2), 0) / 12;
    return Math.sqrt(variance) / avg;
  }

  private calculateVariance(values: number[]): number {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  }

  private groupBy<T>(arr: T[], key: string): Record<string, T[]> {
    return arr.reduce(
      (result, item) => {
        const groupKey = (item as any)[key];
        if (!result[groupKey]) result[groupKey] = [];
        result[groupKey].push(item);
        return result;
      },
      {} as Record<string, T[]>
    );
  }
}

// Type definitions
interface RouteScoreResult {
  method: string;
  corridor: string;
  time: number;
  fee: number;
  probability: number;
  score: number;
}

interface RoutingRule {
  condition: (txn: any) => boolean;
  method: string;
  priority: number;
}

export default AIAnalyticsEngine;
