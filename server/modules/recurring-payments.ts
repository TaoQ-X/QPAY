/**
 * Recurring Payments & Subscription Management System
 * Handles automated billing for subscriptions and recurring charges
 */

export type BillingInterval = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "past_due" | "expired";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Subscription {
  id: string;
  businessId: string;
  customerId: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  paymentMethodId: string;
  startDate: Date;
  nextBillingDate: Date;
  endDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringPayment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  attemptCount: number;
  maxRetries: number;
  nextRetryDate?: Date;
  paymentDate: Date;
  error?: string;
  transactionHash?: string;
  metadata?: Record<string, any>;
}

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  billingInterval: BillingInterval;
  trialDays?: number;
  setupFee?: number;
  features: string[];
}

/**
 * Subscription Manager
 */
export class SubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private recurringPayments: Map<string, RecurringPayment> = new Map();

  /**
   * Create a new subscription
   */
  createSubscription(
    businessId: string,
    customerId: string,
    planId: string,
    planName: string,
    amount: number,
    currency: string,
    billingInterval: BillingInterval,
    paymentMethodId: string,
    metadata?: Record<string, any>
  ): Subscription {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate next billing date
    const startDate = new Date();
    const nextBillingDate = this.calculateNextBillingDate(startDate, billingInterval);

    const subscription: Subscription = {
      id: subscriptionId,
      businessId,
      customerId,
      planId,
      planName,
      amount,
      currency,
      billingInterval,
      status: "active",
      paymentMethodId,
      startDate,
      nextBillingDate,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    console.log(`✅ Subscription created: ${subscriptionId}`);
    return subscription;
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Update subscription status
   */
  updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.status = status;
    subscription.updatedAt = new Date();

    if (status === "cancelled" && !subscription.endDate) {
      subscription.endDate = new Date();
    }

    this.subscriptions.set(subscriptionId, subscription);
    console.log(`📝 Subscription ${subscriptionId} status updated to ${status}`);
    return true;
  }

  /**
   * Pause/Resume subscription
   */
  toggleSubscriptionPause(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    const newStatus: SubscriptionStatus = subscription.status === "active" ? "paused" : "active";
    return this.updateSubscriptionStatus(subscriptionId, newStatus);
  }

  /**
   * Process recurring payment
   */
  async processRecurringPayment(subscriptionId: string): Promise<RecurringPayment | null> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || subscription.status !== "active") return null;

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment: RecurringPayment = {
      id: paymentId,
      subscriptionId,
      amount: subscription.amount,
      currency: subscription.currency,
      status: "pending",
      attemptCount: 0,
      maxRetries: 3,
      paymentDate: new Date(),
      metadata: {
        planName: subscription.planName,
        billingCycle: subscription.billingInterval,
      },
    };

    // Simulate payment processing
    try {
      // In real system, would process actual payment
      await this.simulatePaymentProcessing();

      payment.status = "completed";
      payment.transactionHash = `0x${Math.random().toString(16).substr(2)}...`;
      payment.attemptCount = 1;

      // Update next billing date
      subscription.nextBillingDate = this.calculateNextBillingDate(
        new Date(),
        subscription.billingInterval
      );
      subscription.status = "active";

      console.log(`💰 Recurring payment processed: ${paymentId}`);
    } catch (error) {
      payment.status = "failed";
      payment.error = "Payment processing failed";
      payment.attemptCount = 1;
      payment.nextRetryDate = this.calculateRetryDate(1);

      // Mark subscription as past due after multiple failures
      if (payment.attemptCount >= payment.maxRetries) {
        subscription.status = "past_due";
      }

      console.error(`❌ Payment failed: ${paymentId}`, error);
    }

    this.recurringPayments.set(paymentId, payment);
    return payment;
  }

  /**
   * Retry failed payment
   */
  async retryFailedPayment(paymentId: string): Promise<boolean> {
    const payment = this.recurringPayments.get(paymentId);
    if (!payment || payment.status !== "failed") return false;

    if (payment.attemptCount >= payment.maxRetries) {
      console.log(`⚠️ Max retries reached for payment ${paymentId}`);
      return false;
    }

    payment.attemptCount++;

    try {
      await this.simulatePaymentProcessing();
      payment.status = "completed";
      payment.transactionHash = `0x${Math.random().toString(16).substr(2)}...`;

      // Resume subscription if payment succeeds
      const subscription = this.subscriptions.get(payment.subscriptionId);
      if (subscription && subscription.status === "past_due") {
        subscription.status = "active";
      }

      console.log(`✅ Payment retry successful: ${paymentId}`);
      return true;
    } catch (error) {
      payment.nextRetryDate = this.calculateRetryDate(payment.attemptCount);
      console.error(`❌ Retry failed for payment ${paymentId}`, error);
      return false;
    }
  }

  /**
   * Get upcoming payments
   */
  getUpcomingPayments(days: number = 7): RecurringPayment[] {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const active = Array.from(this.subscriptions.values()).filter(
      sub => sub.status === "active" && sub.nextBillingDate <= cutoffDate
    );

    return active.map(sub => ({
      id: `upcoming_${sub.id}`,
      subscriptionId: sub.id,
      amount: sub.amount,
      currency: sub.currency,
      status: "pending" as PaymentStatus,
      attemptCount: 0,
      maxRetries: 3,
      paymentDate: sub.nextBillingDate,
    }));
  }

  /**
   * Get dunning status (payment failures)
   */
  getDunningStatus(customerId: string) {
    const customerPayments = Array.from(this.recurringPayments.values()).filter(
      p => this.subscriptions.get(p.subscriptionId)?.customerId === customerId
    );

    const failedPayments = customerPayments.filter(p => p.status === "failed");
    const pendingRetries = failedPayments.filter(p => p.nextRetryDate && p.nextRetryDate <= new Date());

    return {
      customerId,
      failedPayments: failedPayments.length,
      pendingRetries: pendingRetries.length,
      pastDueSubscriptions: Array.from(this.subscriptions.values()).filter(
        s => s.customerId === customerId && s.status === "past_due"
      ).length,
    };
  }

  /**
   * Calculate next billing date
   */
  private calculateNextBillingDate(from: Date, interval: BillingInterval): Date {
    const next = new Date(from);

    switch (interval) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next;
  }

  /**
   * Calculate retry date (exponential backoff)
   */
  private calculateRetryDate(attemptCount: number): Date {
    // Retry after: 1 hour, 24 hours, 7 days
    const delays = [60 * 60 * 1000, 24 * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000];
    const delay = delays[Math.min(attemptCount - 1, delays.length - 1)];
    return new Date(Date.now() + delay);
  }

  /**
   * Simulate payment processing
   */
  private async simulatePaymentProcessing(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 95% success rate for demo
        Math.random() > 0.05 ? resolve() : reject(new Error("Payment failed"));
      }, 500);
    });
  }

  /**
   * Get subscription statistics
   */
  getStatistics(businessId: string) {
    const businessSubs = Array.from(this.subscriptions.values()).filter(s => s.businessId === businessId);

    return {
      totalSubscriptions: businessSubs.length,
      activeSubscriptions: businessSubs.filter(s => s.status === "active").length,
      pausedSubscriptions: businessSubs.filter(s => s.status === "paused").length,
      cancelledSubscriptions: businessSubs.filter(s => s.status === "cancelled").length,
      pastDueSubscriptions: businessSubs.filter(s => s.status === "past_due").length,
      monthlyRecurringRevenue: businessSubs
        .filter(s => s.status === "active" && s.billingInterval === "monthly")
        .reduce((sum, s) => sum + s.amount, 0),
      annualRecurringRevenue: businessSubs
        .filter(s => s.status === "active")
        .map(s => {
          const intervals: Record<BillingInterval, number> = {
            daily: 365,
            weekly: 52,
            monthly: 12,
            quarterly: 4,
            yearly: 1,
          };
          return s.amount * intervals[s.billingInterval];
        })
        .reduce((sum, amount) => sum + amount, 0),
    };
  }
}

/**
 * Default Payment Plans
 */
export const defaultPaymentPlans: PaymentPlan[] = [
  {
    id: "plan_starter",
    name: "Starter",
    description: "Perfect for testing",
    amount: 0,
    currency: "USD",
    billingInterval: "monthly",
    features: ["Up to $5,000/month", "All payment methods", "Email support"],
  },
  {
    id: "plan_professional",
    name: "Professional",
    description: "For growing businesses",
    amount: 299,
    currency: "USD",
    billingInterval: "monthly",
    trialDays: 14,
    features: ["Up to $100,000/month", "Advanced analytics", "Priority support"],
  },
  {
    id: "plan_enterprise",
    name: "Enterprise",
    description: "Unlimited everything",
    amount: 0, // Custom pricing
    currency: "USD",
    billingInterval: "yearly",
    setupFee: 5000,
    features: ["Unlimited volume", "Custom integrations", "24/7 dedicated support"],
  },
];
