import { AIAgent, Task, AgentMemory } from "../services/ai-agent-framework";

interface CustomerContext {
  customerId: string;
  accountAge: number; // days
  totalRevenue: number;
  activationStatus: string;
  supportTickets: number;
  nps: number;
  lastInteraction: Date;
}

/**
 * Customer Success Agent - handles customer onboarding, support, and retention
 * Operates autonomously to:
 * - Onboard new customers
 * - Provide proactive support
 * - Identify at-risk customers
 * - Suggest improvements for customer success
 */
class CustomerSuccessAgent extends AIAgent {
  private customerDatabase: Map<string, CustomerContext> = new Map();
  private supportTickets: Map<string, any> = new Map();
  private successPlaybooks: Map<string, string[]> = new Map();

  constructor() {
    super(
      "Alex Success",
      "Customer Success Manager",
      [
        "customer_onboarding",
        "support_response",
        "retention_analysis",
        "success_planning",
        "issue_resolution",
      ]
    );
    this.initializePlaybooks();
  }

  /**
   * Initialize success playbooks (best practices learned over time)
   */
  private initializePlaybooks(): void {
    this.successPlaybooks.set("new_merchant_onboarding", [
      "Send welcome email within 1 hour",
      "Schedule onboarding call within 24 hours",
      "Provide sandbox credentials",
      "Review integration guide",
      "Set up first transaction",
      "Enable 2FA",
      "Configure webhooks",
      "Request feedback",
    ]);

    this.successPlaybooks.set("feature_adoption", [
      "Identify unused features",
      "Send targeted education",
      "Offer one-on-one training",
      "Share case studies",
      "Provide ROI analysis",
      "Enable advanced features",
      "Monitor adoption metrics",
    ]);

    this.successPlaybooks.set("at_risk_recovery", [
      "Identify churn signals",
      "Schedule recovery call",
      "Address pain points",
      "Offer special incentives",
      "Assign dedicated manager",
      "Increase touch frequency",
      "Provide executive briefing",
    ]);
  }

  /**
   * Handle onboarding task for new customer
   */
  protected async generateOptions(task: Task, context: any): Promise<string[]> {
    if (task.type === "customer_onboarding") {
      return [
        "fast_track_onboarding",
        "standard_onboarding",
        "white_glove_onboarding",
        "self_service_onboarding",
      ];
    }

    if (task.type === "support_resolution") {
      return [
        "self_service_help",
        "ai_chat_support",
        "email_support",
        "phone_support",
        "escalate_to_human",
      ];
    }

    if (task.type === "retention_intervention") {
      return [
        "proactive_outreach",
        "special_offer",
        "feature_enablement",
        "upgrade_incentive",
        "hands_on_support",
      ];
    }

    return ["default_response"];
  }

  /**
   * Execute decision based on task type
   */
  protected async executeDecision(task: Task, decision: string): Promise<any> {
    switch (task.type) {
      case "customer_onboarding":
        return await this.handleOnboarding(task, decision);

      case "support_resolution":
        return await this.handleSupportTicket(task, decision);

      case "retention_intervention":
        return await this.handleRetentionIntervention(task, decision);

      case "success_review":
        return await this.conductSuccessReview(task);

      case "feature_adoption":
        return await this.promoteFeatureAdoption(task);

      default:
        return { success: false, message: "Unknown task type" };
    }
  }

  /**
   * Handle customer onboarding with playbook
   */
  private async handleOnboarding(task: Task, strategy: string): Promise<any> {
    const playbook = this.successPlaybooks.get("new_merchant_onboarding") || [];

    const steps = strategy === "fast_track_onboarding" ? playbook.slice(0, 5) :
                  strategy === "white_glove_onboarding" ? playbook :
                  playbook.slice(0, 4);

    const executionPlan = {
      strategy,
      steps,
      timeline: this.createTimeline(steps),
      expectedOutcome: "Activated customer within 48 hours",
      successMetrics: [
        "First transaction within 24 hours",
        "All webhooks configured",
        "Customer satisfaction > 4.5/5",
      ],
    };

    // Simulate execution
    return {
      decision: "onboarding_initiated",
      executedAt: new Date(),
      plan: executionPlan,
      resourcesAssigned: ["onboarding_email", "training_video", "support_call"],
      status: "in_progress",
    };
  }

  /**
   * Handle support tickets
   */
  private async handleSupportTicket(task: Task, resolution: string): Promise<any> {
    const ticketData = task.description;

    // Check if similar issue was resolved before
    const precedent = this.findResolutionPrecedent(ticketData);

    const response = {
      decision: resolution,
      executedAt: new Date(),
      solution: precedent ? precedent.content : `Resolving: ${ticketData}`,
      responseTime: "< 15 minutes",
      escalationPath: resolution === "escalate_to_human" ? "Engineering team" : "None",
      customerSatisfactionTarget: 4.8,
    };

    // Track this resolution for future learning
    if (precedent) {
      precedent.appliedCount++;
    }

    return response;
  }

  /**
   * Proactive retention intervention for at-risk customers
   */
  private async handleRetentionIntervention(task: Task, action: string): Promise<any> {
    const playbook = this.successPlaybooks.get("at_risk_recovery") || [];

    return {
      decision: action,
      executedAt: new Date(),
      intervention: {
        type: action,
        steps: action === "proactive_outreach"
          ? [
              "Send personalized check-in email",
              "Schedule executive call",
              "Review account usage",
              "Identify pain points",
              "Present solutions",
            ]
          : action === "special_offer"
          ? [
              "Analyze customer LTV",
              "Calculate max discount",
              "Present limited-time offer",
              "Track acceptance rate",
            ]
          : playbook.slice(0, 3),
        timeline: "48 hours",
        expectedImpact: "Recover 60% of at-risk customers",
      },
      riskScore: 8.5,
      retentionProbability: 0.65,
    };
  }

  /**
   * Conduct quarterly success review
   */
  private async conductSuccessReview(task: Task): Promise<any> {
    const customerId = task.description;
    const context = this.customerDatabase.get(customerId);

    if (!context) {
      return { success: false, message: "Customer not found" };
    }

    const review = {
      customerId,
      reviewDate: new Date(),
      accountAge: context.accountAge,
      metrics: {
        revenue: context.totalRevenue,
        netPromoterScore: context.nps,
        supportTickets: context.supportTickets,
        activationStatus: context.activationStatus,
      },
      assessment: this.assessCustomerHealth(context),
      recommendations: this.generateSuccessRecommendations(context),
      nextSteps: ["Implement recommendations", "Schedule 30-min sync", "Track metrics"],
    };

    return review;
  }

  /**
   * Promote adoption of underutilized features
   */
  private async promoteFeatureAdoption(task: Task): Promise<any> {
    const playbook = this.successPlaybooks.get("feature_adoption") || [];

    return {
      decision: "feature_adoption_campaign",
      executedAt: new Date(),
      campaign: {
        features: ["webhooks", "2fa", "settlements", "reporting"],
        strategy: playbook,
        timeline: "4 weeks",
        expectedAdoptionRate: 0.75,
        methods: [
          "Educational email series",
          "In-app tutorials",
          "One-on-one training",
          "Webinar",
          "Blog post",
        ],
      },
      expectedImpact: {
        revenueIncrease: 0.15,
        customerSatisfaction: 0.2,
        supportTicketReduction: 0.25,
      },
    };
  }

  /**
   * Assess customer health
   */
  private assessCustomerHealth(context: CustomerContext): string {
    if (context.nps >= 70 && context.totalRevenue > 50000) return "Excellent";
    if (context.nps >= 50 && context.totalRevenue > 10000) return "Healthy";
    if (context.supportTickets > 10) return "At Risk";
    return "Needs Attention";
  }

  /**
   * Generate personalized success recommendations
   */
  private generateSuccessRecommendations(context: CustomerContext): string[] {
    const recommendations: string[] = [];

    if (context.accountAge > 90 && context.totalRevenue < 50000) {
      recommendations.push("Increase marketing spend - proven ROI");
      recommendations.push("Enable advanced analytics for insights");
    }

    if (context.supportTickets > 5) {
      recommendations.push("Schedule proactive training session");
      recommendations.push("Assign dedicated support manager");
    }

    if (context.nps < 50) {
      recommendations.push("Conduct satisfaction survey");
      recommendations.push("Address pain points immediately");
    }

    if (!context.activationStatus.includes("2fa")) {
      recommendations.push("Enable 2FA for enhanced security");
    }

    return recommendations;
  }

  /**
   * Create implementation timeline
   */
  private createTimeline(steps: string[]): any[] {
    const timeline: any[] = [];
    const now = new Date();

    steps.forEach((step, index) => {
      timeline.push({
        step: index + 1,
        action: step,
        scheduledFor: new Date(now.getTime() + index * 24 * 60 * 60 * 1000),
        estimatedDuration: "1-2 hours",
      });
    });

    return timeline;
  }

  /**
   * Find resolution precedent for similar issues
   */
  private findResolutionPrecedent(issue: string): AgentMemory | null {
    const relevant = Array.from(this.memory.values())
      .filter(m => m.type === "experience" && m.successRate > 0.8)
      .sort((a, b) => b.successRate - a.successRate);

    return relevant.length > 0 ? relevant[0] : null;
  }

  /**
   * Update customer context
   */
  updateCustomerContext(customerId: string, context: Partial<CustomerContext>): void {
    const existing = this.customerDatabase.get(customerId);
    if (existing) {
      this.customerDatabase.set(customerId, { ...existing, ...context });
    } else {
      this.customerDatabase.set(customerId, {
        customerId,
        accountAge: 0,
        totalRevenue: 0,
        activationStatus: "new",
        supportTickets: 0,
        nps: 0,
        lastInteraction: new Date(),
        ...context,
      });
    }
  }

  /**
   * Get customer success status
   */
  getCustomerStatus(customerId: string): any {
    const context = this.customerDatabase.get(customerId);
    if (!context) return null;

    return {
      customerId,
      health: this.assessCustomerHealth(context),
      context,
      recommendations: this.generateSuccessRecommendations(context),
      agentAssigned: this.name,
    };
  }

  /**
   * Identify high-value customers for VIP treatment
   */
  identifyVIPCustomers(): string[] {
    const vips: string[] = [];

    for (const [customerId, context] of this.customerDatabase) {
      if (context.totalRevenue > 100000 && context.nps > 70) {
        vips.push(customerId);
      }
    }

    return vips;
  }

  /**
   * Bulk customer health check
   */
  async healthCheckAllCustomers(): Promise<any[]> {
    const results: any[] = [];

    for (const [customerId, context] of this.customerDatabase) {
      results.push({
        customerId,
        health: this.assessCustomerHealth(context),
        lastUpdated: new Date(),
        actionRequired: context.supportTickets > 5 || context.nps < 50,
      });
    }

    return results;
  }

  /**
   * Generate customer journey map
   */
  generateCustomerJourney(customerId: string): any {
    const decisions = Array.from(this.decisionHistory.values())
      .filter(d => d.taskId.includes(customerId))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      customerId,
      journey: decisions.map(d => ({
        date: d.timestamp,
        action: d.decision,
        confidence: d.confidence,
      })),
      totalInteractions: decisions.length,
      successRate: this.calculateSuccessRate(decisions),
    };
  }

  /**
   * Calculate success rate for a set of decisions
   */
  private calculateSuccessRate(decisions: any[]): number {
    if (decisions.length === 0) return 0;
    const successCount = decisions.filter(d => d.confidence > 0.7).length;
    return (successCount / decisions.length) * 100;
  }

  /**
   * Learn customer preferences and patterns
   */
  async learnCustomerPatterns(customerId: string): Promise<void> {
    const journey = this.generateCustomerJourney(customerId);

    if (journey.successRate > 80) {
      const memory: AgentMemory = {
        id: `cust_${customerId}`,
        agentId: this.id,
        type: "pattern",
        content: `Successful engagement pattern for ${customerId}`,
        dataPoints: [journey],
        successRate: journey.successRate / 100,
        timestamp: new Date(),
        appliedCount: 0,
      };

      this.memory.set(memory.id, memory);
    }
  }
}

export const customerSuccessAgent = new CustomerSuccessAgent();
