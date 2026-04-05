export interface MerchantMetrics {
  userId: string;
  totalRevenue: number;
  transactionCount: number;
  averageOrderValue: number;
  conversionRate: number;
  chargebackRate: number;
  refundRate: number;
  paymentMethodBreakdown: Record<string, number>;
  geographicBreakdown: Record<string, number>;
  topProducts: Array<{ id: string; name: string; revenue: number; count: number }>;
  peakTimes: Array<{ hour: number; transactions: number; revenue: number }>;
  customerRetention: number;
  accountAge: number;
}

export interface Recommendation {
  id: string;
  category: "growth" | "security" | "optimization" | "compliance" | "integration";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  potentialImpact: string; // e.g., "+15% revenue increase"
  actionItems: string[];
  estimatedEffort: "low" | "medium" | "high";
  timeframe: string; // e.g., "1-2 weeks"
  successMetrics: string[];
  relatedFeatures: string[];
  confidence: number; // 0-100
}

class AIRecommendationsEngine {
  private recommendationHistory: Map<string, Recommendation[]> = new Map();
  private feedbackScores: Map<string, number> = new Map(); // Track accuracy

  /**
   * Analyze merchant profile and generate AI-powered recommendations
   */
  generateRecommendations(metrics: MerchantMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Growth Recommendations
    recommendations.push(...this.analyzeGrowthOpportunities(metrics));

    // Security & Risk Recommendations
    recommendations.push(...this.analyzeSecurityRisks(metrics));

    // Optimization Recommendations
    recommendations.push(...this.analyzeOptimization(metrics));

    // Compliance Recommendations
    recommendations.push(...this.analyzeCompliance(metrics));

    // Integration Recommendations
    recommendations.push(...this.analyzeIntegrations(metrics));

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.confidence - a.confidence;
    });

    // Store history
    this.storeRecommendationHistory(metrics.userId, recommendations);

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  /**
   * Growth Opportunity Analysis
   */
  private analyzeGrowthOpportunities(metrics: MerchantMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. Untapped Payment Methods
    const cardShare = (metrics.paymentMethodBreakdown["card"] || 0) / metrics.transactionCount;
    if (cardShare > 0.7) {
      recommendations.push({
        id: "growth-1",
        category: "growth",
        priority: "high",
        title: "Diversify Payment Methods to Increase Conversion",
        description:
          `Your customers are heavily reliant on card payments (${(cardShare * 100).toFixed(0)}%). Adding alternative payment methods can reduce cart abandonment and increase conversion rates in specific regions.`,
        potentialImpact: "+8-12% revenue increase",
        actionItems: [
          "Enable Apple Pay and Google Pay (zero additional setup)",
          "Add local payment methods based on geographic breakdown",
          "Test wallet solutions in top markets",
        ],
        estimatedEffort: "low",
        timeframe: "1 week",
        successMetrics: [
          "Conversion rate increase",
          "Reduced cart abandonment",
          "New customer acquisition",
        ],
        relatedFeatures: ["payment_methods", "wallets", "regional_payments"],
        confidence: 85,
      });
    }

    // 2. Geographic Expansion
    const topCountries = Object.entries(metrics.geographicBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topCountries.length < 5) {
      recommendations.push({
        id: "growth-2",
        category: "growth",
        priority: "medium",
        title: "Expand to High-Growth Regions",
        description:
          `Your business is concentrated in ${topCountries.length} regions. Expanding to emerging markets with high payment growth can unlock significant revenue opportunities.`,
        potentialImpact: "+20-30% revenue growth annually",
        actionItems: [
          "Enable payments in Southeast Asia (India, Indonesia, Philippines)",
          "Add local payment methods per region (UPI, GCash, etc)",
          "Localize pricing and currencies",
          "Set up regional support channels",
        ],
        estimatedEffort: "medium",
        timeframe: "3-4 weeks",
        successMetrics: [
          "New region transaction volume",
          "Regional conversion rates",
          "Customer acquisition cost by region",
        ],
        relatedFeatures: ["multi_currency", "local_payments", "regional_support"],
        confidence: 78,
      });
    }

    // 3. Subscription/Recurring Revenue
    const isHighVolume = metrics.transactionCount > 100;
    const hasRecurring = (metrics.paymentMethodBreakdown["subscription"] || 0) > 0;

    if (isHighVolume && !hasRecurring) {
      recommendations.push({
        id: "growth-3",
        category: "growth",
        priority: "medium",
        title: "Launch Subscription Model for Predictable Revenue",
        description:
          `Your high transaction volume (${metrics.transactionCount} transactions) indicates strong market fit. A subscription model can provide predictable recurring revenue and improve customer lifetime value.`,
        potentialImpact: "+25-40% LTV increase",
        actionItems: [
          "Identify 20-30% of customers suited for subscriptions",
          "Set up recurring billing with flexible plans",
          "Implement dunning management for failed payments",
          "Create loyalty rewards program",
        ],
        estimatedEffort: "medium",
        timeframe: "2-3 weeks",
        successMetrics: [
          "Monthly recurring revenue (MRR)",
          "Customer lifetime value",
          "Churn rate",
          "Subscription adoption rate",
        ],
        relatedFeatures: ["recurring_billing", "subscriptions", "webhooks"],
        confidence: 72,
      });
    }

    // 4. Premium Tier Upsell
    const avgOrderValue = metrics.averageOrderValue;
    if (avgOrderValue > 0 && avgOrderValue < 100) {
      recommendations.push({
        id: "growth-4",
        category: "growth",
        priority: "low",
        title: "Implement Premium Tier Strategy",
        description:
          `Your current AOV of $${avgOrderValue.toFixed(2)} has room for upselling. Introducing premium tiers or bundled offerings can increase revenue per transaction.`,
        potentialImpact: "+15-20% AOV increase",
        actionItems: [
          "Create premium product bundles",
          "Implement smart upsell at checkout",
          "A/B test different pricing strategies",
          "Use customer segmentation for targeted offers",
        ],
        estimatedEffort: "medium",
        timeframe: "2-3 weeks",
        successMetrics: [
          "Average order value",
          "Premium tier adoption",
          "Revenue per customer",
        ],
        relatedFeatures: ["checkout", "analytics", "recommendations"],
        confidence: 65,
      });
    }

    return recommendations;
  }

  /**
   * Security & Risk Analysis
   */
  private analyzeSecurityRisks(metrics: MerchantMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. High Chargeback Rate
    if (metrics.chargebackRate > 0.01) {
      // > 1%
      recommendations.push({
        id: "security-1",
        category: "security",
        priority: "high",
        title: "Reduce Chargebacks to Protect Account",
        description:
          `Your chargeback rate (${(metrics.chargebackRate * 100).toFixed(2)}%) is above industry average (0.5%). High chargebacks risk payment processor termination.`,
        potentialImpact: "Prevent account suspension, save processing costs",
        actionItems: [
          "Enable 3D Secure authentication for high-risk transactions",
          "Implement AI fraud detection and velocity limits",
          "Improve order confirmations and shipping notifications",
          "Set up customer support for dispute resolution",
        ],
        estimatedEffort: "low",
        timeframe: "Immediate - 2 weeks",
        successMetrics: [
          "Chargeback rate < 0.5%",
          "Dispute win rate > 50%",
          "Customer satisfaction increase",
        ],
        relatedFeatures: ["fraud_detection", "3d_secure", "dispute_management"],
        confidence: 92,
      });
    }

    // 2. High Refund Rate
    if (metrics.refundRate > 0.05) {
      // > 5%
      recommendations.push({
        id: "security-2",
        category: "security",
        priority: "medium",
        title: "Investigate High Refund Rate",
        description:
          `Your refund rate (${(metrics.refundRate * 100).toFixed(2)}%) is elevated. This can indicate product quality issues, customer satisfaction problems, or fraud.`,
        potentialImpact: "Recover 10-15% of refunded revenue",
        actionItems: [
          "Analyze refund reasons and patterns",
          "Implement fraud detection for suspicious refund requests",
          "Improve product descriptions to match expectations",
          "Create clear return policies",
          "Collect customer feedback on returns",
        ],
        estimatedEffort: "medium",
        timeframe: "2-4 weeks",
        successMetrics: [
          "Refund rate < 3%",
          "Customer satisfaction scores",
          "Return reason categorization",
        ],
        relatedFeatures: ["analytics", "customer_feedback", "fraud_detection"],
        confidence: 80,
      });
    }

    // 3. Enable 2FA for Account Security
    recommendations.push({
      id: "security-3",
      category: "security",
      priority: "high",
      title: "Enable 2FA to Protect Your Account",
      description:
        `Two-factor authentication protects against account takeover attacks. Critical for merchants handling high volumes of payments.`,
      potentialImpact: "99.9% reduction in account compromise risk",
      actionItems: [
        "Enable 2FA on merchant account immediately",
        "Set up authenticator app or SMS backup codes",
        "Create API key rotation schedule",
        "Review recent account activity",
      ],
      estimatedEffort: "low",
      timeframe: "15 minutes",
      successMetrics: [
        "2FA enabled",
        "Recovery codes secured",
        "API keys rotated quarterly",
      ],
      relatedFeatures: ["2fa", "api_security", "account_protection"],
      confidence: 95,
    });

    return recommendations;
  }

  /**
   * Optimization Recommendations
   */
  private analyzeOptimization(metrics: MerchantMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. Peak Time Optimization
    if (metrics.peakTimes && metrics.peakTimes.length > 0) {
      const peakHour = metrics.peakTimes.sort((a, b) => b.transactions - a.transactions)[0];
      const offPeakAvg =
        metrics.peakTimes
          .filter((_, i) => i > 0)
          .reduce((sum, t) => sum + t.transactions, 0) / (metrics.peakTimes.length - 1);

      if (peakHour.transactions > offPeakAvg * 3) {
        recommendations.push({
          id: "optimization-1",
          category: "optimization",
          priority: "medium",
          title: "Optimize Peak Time Performance",
          description:
            `Transactions peak at ${peakHour.hour}:00 with ${peakHour.transactions} transactions. Ensure infrastructure handles peak load to prevent transaction failures.`,
          potentialImpact: "Prevent revenue loss, improve user experience",
          actionItems: [
            "Review server capacity and auto-scaling settings",
            "Test load handling at 2x peak volume",
            "Implement caching for high-volume times",
            "Set up monitoring and alerting",
          ],
          estimatedEffort: "low",
          timeframe: "1 week",
          successMetrics: [
            "99.99% uptime during peak hours",
            "Sub-100ms API response times",
            "Zero transaction failures",
          ],
          relatedFeatures: ["infrastructure", "monitoring", "api_performance"],
          confidence: 75,
        });
      }
    }

    // 2. Conversion Rate Optimization
    if (metrics.conversionRate > 0 && metrics.conversionRate < 0.05) {
      recommendations.push({
        id: "optimization-2",
        category: "optimization",
        priority: "medium",
        title: "Improve Checkout Conversion Rate",
        description:
          `Your conversion rate (${(metrics.conversionRate * 100).toFixed(2)}%) has optimization potential. Industry average is 2-3%.`,
        potentialImpact: "+20-40% conversion improvement",
        actionItems: [
          "Simplify checkout form (< 3 fields)",
          "Enable Express Checkout (Apple Pay, Google Pay)",
          "Add guest checkout option",
          "Implement one-click repeat purchase",
          "A/B test checkout layouts",
          "Reduce checkout page load time",
        ],
        estimatedEffort: "medium",
        timeframe: "3-4 weeks",
        successMetrics: [
          "Conversion rate increase",
          "Cart abandonment rate decrease",
          "Checkout completion time",
          "Revenue per session",
        ],
        relatedFeatures: ["checkout", "express_payment", "analytics"],
        confidence: 88,
      });
    }

    // 3. API Usage Optimization
    recommendations.push({
      id: "optimization-3",
      category: "optimization",
      priority: "low",
      title: "Optimize API Usage Patterns",
      description: `Analyze and optimize your API calls to reduce latency and improve throughput.`,
      potentialImpact: "30-50% faster response times",
      actionItems: [
        "Implement request batching for bulk operations",
        "Use webhooks instead of polling",
        "Cache frequently accessed data",
        "Monitor API rate limits and optimize accordingly",
      ],
      estimatedEffort: "medium",
      timeframe: "2-3 weeks",
      successMetrics: [
        "API response time < 100ms",
        "Webhook latency < 500ms",
        "Cache hit rate > 70%",
      ],
      relatedFeatures: ["api", "webhooks", "caching"],
      confidence: 70,
    });

    return recommendations;
  }

  /**
   * Compliance Recommendations
   */
  private analyzeCompliance(metrics: MerchantMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // All merchants need compliance basics
    recommendations.push({
      id: "compliance-1",
      category: "compliance",
      priority: "high",
      title: "Ensure PCI-DSS Compliance",
      description: `Maintain PCI-DSS Level 1 compliance to protect customer payment data and avoid penalties.`,
      potentialImpact: "Avoid $5K-$100K fines, maintain payment processor approval",
      actionItems: [
        "Review PCI-DSS requirements quarterly",
        "Never store full card numbers",
        "Use QPay's tokenization service",
        "Implement SSL/TLS encryption",
        "Conduct annual security audit",
      ],
      estimatedEffort: "low",
      timeframe: "Ongoing",
      successMetrics: [
        "PCI-DSS compliance maintained",
        "Zero data breaches",
        "Security audit passed",
      ],
      relatedFeatures: ["security", "encryption", "compliance"],
      confidence: 99,
    });

    // GDPR for EU merchants
    if (metrics.geographicBreakdown["EU"] || metrics.geographicBreakdown["DE"]) {
      recommendations.push({
        id: "compliance-2",
        category: "compliance",
        priority: "high",
        title: "Implement GDPR Compliance Measures",
        description: `Operating in EU requires GDPR compliance. Ensure data protection and customer rights are handled properly.`,
        potentialImpact: "Avoid €20M fines, protect customer trust",
        actionItems: [
          "Create and publish Privacy Policy",
          "Implement data access/deletion features",
          "Set up DPA with QPay",
          "Train staff on data protection",
          "Document data processing activities",
        ],
        estimatedEffort: "medium",
        timeframe: "2-4 weeks",
        successMetrics: [
          "Privacy Policy published",
          "Data access feature working",
          "DPA signed",
          "GDPR audit passed",
        ],
        relatedFeatures: ["privacy", "data_protection", "compliance"],
        confidence: 92,
      });
    }

    return recommendations;
  }

  /**
   * Integration Recommendations
   */
  private analyzeIntegrations(metrics: MerchantMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Webhook integration for scalability
    recommendations.push({
      id: "integration-1",
      category: "integration",
      priority: "medium",
      title: "Implement Webhook Integration",
      description: `Webhooks enable real-time updates and eliminate polling overhead. Essential for scaling to high volumes.`,
      potentialImpact: "Real-time updates, 50% reduction in API calls",
      actionItems: [
        "Review Webhook Management documentation",
        "Set up webhook endpoints for all events",
        "Implement signature verification",
        "Add retry handling and monitoring",
        "Test in sandbox before production",
      ],
      estimatedEffort: "medium",
      timeframe: "1-2 weeks",
      successMetrics: [
        "Webhook delivery success > 99%",
        "Real-time transaction updates",
        "API call reduction",
      ],
      relatedFeatures: ["webhooks", "api", "integrations"],
      confidence: 85,
    });

    // Advanced analytics
    if (metrics.transactionCount > 1000) {
      recommendations.push({
        id: "integration-2",
        category: "integration",
        priority: "medium",
        title: "Set Up Advanced Analytics Dashboard",
        description: `Deep analytics help identify trends and optimize operations. Critical for high-volume merchants.`,
        potentialImpact: "Data-driven decision making, +10-15% efficiency",
        actionItems: [
          "Enable comprehensive reporting",
          "Set up custom dashboards",
          "Create automated reports",
          "Integrate with BI tools (Tableau, Looker)",
          "Track KPIs and trends",
        ],
        estimatedEffort: "low",
        timeframe: "1 week",
        successMetrics: [
          "Dashboard created",
          "Weekly reports generated",
          "Decision latency reduced",
        ],
        relatedFeatures: ["analytics", "reporting", "dashboards"],
        confidence: 78,
      });
    }

    return recommendations;
  }

  /**
   * Get actionable next steps
   */
  getQuickWins(metrics: MerchantMetrics): Recommendation[] {
    const allRecommendations = this.generateRecommendations(metrics);
    return allRecommendations
      .filter(r => r.estimatedEffort === "low")
      .slice(0, 5);
  }

  /**
   * Store recommendation history for tracking
   */
  private storeRecommendationHistory(userId: string, recommendations: Recommendation[]) {
    this.recommendationHistory.set(userId, recommendations);
  }

  /**
   * Track recommendation effectiveness
   */
  recordFeedback(userId: string, recommendationId: string, applied: boolean, impact: number) {
    const key = `${userId}:${recommendationId}`;
    const weightedScore = applied ? impact : 0;
    this.feedbackScores.set(key, weightedScore);
  }

  /**
   * Get personalized insights
   */
  getInsights(metrics: MerchantMetrics): string[] {
    const insights: string[] = [];

    if (metrics.conversionRate > 0.03) {
      insights.push("✓ Excellent conversion rate - consider scaling marketing spend");
    }

    if (metrics.chargebackRate < 0.005) {
      insights.push("✓ Strong fraud prevention - consider adding express checkout");
    }

    if (metrics.customerRetention > 0.7) {
      insights.push("✓ High customer retention - ideal for subscription model");
    }

    if (metrics.accountAge > 90 && metrics.transactionCount > 1000) {
      insights.push("⚠ Time for Enterprise plan - unlock advanced features");
    }

    if (metrics.refundRate < 0.03) {
      insights.push("✓ Low refund rate indicates customer satisfaction");
    }

    return insights;
  }
}

export const aiRecommendationsEngine = new AIRecommendationsEngine();
