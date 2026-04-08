import crypto from "crypto";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscriptionDate: Date;
  isActive: boolean;
  segments: string[];
  preferences: {
    frequency: "daily" | "weekly" | "monthly";
    categories: string[];
    marketing: boolean;
  };
  lastEmailSent?: Date;
  openRate: number;
  clickRate: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  htmlBody?: string;
  category: "marketing" | "transactional" | "newsletter" | "automation";
  variables: string[];
  previewText: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateId: string;
  recipients: string[];
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledFor?: Date;
  sentAt?: Date;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
  };
}

export interface AutomationSequence {
  id: string;
  name: string;
  trigger: "signup" | "purchase" | "abandoned_cart" | "inactivity" | "milestone";
  emails: {
    order: number;
    templateId: string;
    delayDays: number;
    subject: string;
  }[];
  status: "active" | "paused" | "archived";
  performance: {
    totalSent: number;
    openRate: number;
    conversionRate: number;
  };
}

class EmailMarketingService {
  private subscribers: Map<string, NewsletterSubscriber> = new Map();
  private emailTemplates: Map<string, EmailTemplate> = new Map();
  private campaigns: Map<string, EmailCampaign> = new Map();
  private sequences: Map<string, AutomationSequence> = new Map();
  private emailQueue: Array<any> = [];
  private analytics: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Subscribe user to newsletter
   */
  subscribe(email: string, name?: string, preferences?: any): NewsletterSubscriber {
    const id = crypto.randomUUID();
    
    const subscriber: NewsletterSubscriber = {
      id,
      email,
      name,
      subscriptionDate: new Date(),
      isActive: true,
      segments: [],
      preferences: {
        frequency: preferences?.frequency || "weekly",
        categories: preferences?.categories || ["all"],
        marketing: preferences?.marketing !== false,
      },
      openRate: 0,
      clickRate: 0,
    };

    this.subscribers.set(id, subscriber);

    // Send welcome email
    this.queueWelcomeEmail(subscriber);

    return subscriber;
  }

  /**
   * Unsubscribe user
   */
  unsubscribe(email: string): boolean {
    for (const [id, subscriber] of this.subscribers) {
      if (subscriber.email === email) {
        subscriber.isActive = false;
        return true;
      }
    }
    return false;
  }

  /**
   * Create email template
   */
  createTemplate(template: Omit<EmailTemplate, "id">): EmailTemplate {
    const id = crypto.randomUUID();
    const newTemplate: EmailTemplate = { ...template, id };
    this.emailTemplates.set(id, newTemplate);
    return newTemplate;
  }

  /**
   * Create and schedule email campaign
   */
  createCampaign(campaign: Omit<EmailCampaign, "id" | "metrics">): EmailCampaign {
    const id = crypto.randomUUID();
    
    const newCampaign: EmailCampaign = {
      ...campaign,
      id,
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        unsubscribed: 0,
        bounced: 0,
      },
    };

    this.campaigns.set(id, newCampaign);

    // Queue campaign for sending
    if (campaign.status === "scheduled" && campaign.scheduledFor) {
      this.scheduleEmailSending(newCampaign);
    }

    return newCampaign;
  }

  /**
   * Send immediate campaign
   */
  sendCampaignImmediately(campaignId: string): { success: boolean; sent: number } {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return { success: false, sent: 0 };

    let sent = 0;
    for (const email of campaign.recipients) {
      this.queueEmail({
        to: email,
        templateId: campaign.templateId,
        campaignId,
      });
      sent++;
    }

    campaign.status = "sent";
    campaign.sentAt = new Date();
    campaign.metrics.sent = sent;

    return { success: true, sent };
  }

  /**
   * Create automation sequence
   */
  createAutomationSequence(sequence: Omit<AutomationSequence, "id" | "performance">): AutomationSequence {
    const id = crypto.randomUUID();

    const newSequence: AutomationSequence = {
      ...sequence,
      id,
      performance: {
        totalSent: 0,
        openRate: 0,
        conversionRate: 0,
      },
    };

    this.sequences.set(id, newSequence);
    return newSequence;
  }

  /**
   * Trigger automation sequence for a subscriber
   */
  triggerSequence(email: string, triggerType: string): boolean {
    const subscriber = Array.from(this.subscribers.values()).find(s => s.email === email);
    if (!subscriber) return false;

    for (const [, sequence] of this.sequences) {
      if (sequence.trigger === triggerType && sequence.status === "active") {
        // Queue all emails in the sequence with proper delays
        sequence.emails.forEach(email => {
          this.queueSequenceEmail(subscriber, email, sequence.id);
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Get pre-built automation sequences
   */
  getDefaultSequences(): Omit<AutomationSequence, "id" | "performance">[] {
    return [
      {
        name: "Welcome Series",
        trigger: "signup",
        status: "active",
        emails: [
          {
            order: 1,
            templateId: "welcome-1",
            delayDays: 0,
            subject: "Welcome to QPay!",
          },
          {
            order: 2,
            templateId: "welcome-2",
            delayDays: 2,
            subject: "Getting Started with QPay",
          },
          {
            order: 3,
            templateId: "welcome-3",
            delayDays: 5,
            subject: "Pro Tips to Maximize Your Sales",
          },
        ],
      },
      {
        name: "Abandoned Cart Recovery",
        trigger: "abandoned_cart",
        status: "active",
        emails: [
          {
            order: 1,
            templateId: "cart-1",
            delayDays: 0,
            subject: "You left something behind",
          },
          {
            order: 2,
            templateId: "cart-2",
            delayDays: 1,
            subject: "Your cart is waiting",
          },
          {
            order: 3,
            templateId: "cart-3",
            delayDays: 3,
            subject: "Final reminder - 20% off your order",
          },
        ],
      },
      {
        name: "Post-Purchase",
        trigger: "purchase",
        status: "active",
        emails: [
          {
            order: 1,
            templateId: "purchase-1",
            delayDays: 0,
            subject: "Order Confirmed!",
          },
          {
            order: 2,
            templateId: "purchase-2",
            delayDays: 3,
            subject: "How's your purchase?",
          },
          {
            order: 3,
            templateId: "purchase-3",
            delayDays: 7,
            subject: "You might also like...",
          },
        ],
      },
      {
        name: "Winback Campaign",
        trigger: "inactivity",
        status: "active",
        emails: [
          {
            order: 1,
            templateId: "winback-1",
            delayDays: 0,
            subject: "We miss you!",
          },
          {
            order: 2,
            templateId: "winback-2",
            delayDays: 3,
            subject: "Here's what's new",
          },
          {
            order: 3,
            templateId: "winback-3",
            delayDays: 7,
            subject: "Last chance - 30% off exclusive offer",
          },
        ],
      },
    ];
  }

  /**
   * Email template personalization
   */
  personalizeTemplate(template: EmailTemplate, variables: Record<string, string>): string {
    let content = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, "g"), value);
    }

    return content;
  }

  /**
   * Get email analytics
   */
  getAnalytics(campaignId?: string) {
    if (campaignId) {
      return this.analytics.get(campaignId) || {};
    }

    // Return aggregate analytics
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalUnsubscribed = 0;

    for (const campaign of this.campaigns.values()) {
      totalSent += campaign.metrics.sent;
      totalOpened += campaign.metrics.opened;
      totalClicked += campaign.metrics.clicked;
      totalUnsubscribed += campaign.metrics.unsubscribed;
    }

    return {
      totalCampaigns: this.campaigns.size,
      totalEmails: totalSent,
      totalOpened,
      totalClicked,
      averageOpenRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      averageClickRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
      unsubscribeRate: totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0,
      activeSubscribers: Array.from(this.subscribers.values()).filter(s => s.isActive).length,
    };
  }

  /**
   * A/B testing for email campaigns
   */
  createABTest(
    campaignId: string,
    variantA: { subject: string; body: string },
    variantB: { subject: string; body: string },
    splitPercentage: number = 50
  ) {
    return {
      campaignId,
      testId: crypto.randomUUID(),
      variants: {
        A: variantA,
        B: variantB,
      },
      splitPercentage,
      startDate: new Date(),
      status: "running",
      results: {
        variantA: { sent: 0, opened: 0, clicked: 0 },
        variantB: { sent: 0, opened: 0, clicked: 0 },
      },
    };
  }

  /**
   * Email list segmentation
   */
  segmentSubscribers(criteria: Record<string, any>) {
    const segments: NewsletterSubscriber[] = [];

    for (const subscriber of this.subscribers.values()) {
      let matches = true;

      for (const [key, value] of Object.entries(criteria)) {
        if (key === "active" && subscriber.isActive !== value) matches = false;
        if (key === "frequency" && subscriber.preferences.frequency !== value) matches = false;
        if (key === "category" && !subscriber.preferences.categories.includes(value)) matches = false;
      }

      if (matches) segments.push(subscriber);
    }

    return segments;
  }

  /**
   * Send test email
   */
  sendTestEmail(email: string, templateId: string, variables?: Record<string, string>): boolean {
    const template = this.emailTemplates.get(templateId);
    if (!template) return false;

    this.queueEmail({
      to: email,
      templateId,
      variables,
      isTest: true,
    });

    return true;
  }

  /**
   * Get email deliverability insights
   */
  getDeliverabilityInsights() {
    let totalSent = 0;
    let totalDelivered = 0;
    let totalBounced = 0;

    for (const campaign of this.campaigns.values()) {
      totalSent += campaign.metrics.sent;
      totalDelivered += campaign.metrics.delivered;
      totalBounced += campaign.metrics.bounced;
    }

    return {
      totalEmails: totalSent,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      recommendations:
        totalBounced / totalSent > 0.05
          ? ["Clean your email list", "Verify email addresses before import"]
          : ["Excellent deliverability - maintain current practices"],
    };
  }

  // Private helper methods
  private initializeDefaultTemplates() {
    const templates = [
      {
        name: "Welcome Email",
        subject: "Welcome to QPay",
        body: "Hi {{name}}, welcome to QPay! Get started here: {{actionUrl}}",
        htmlBody: "<p>Hi {{name}}, welcome to QPay!</p>",
        category: "transactional" as const,
        variables: ["name", "actionUrl"],
        previewText: "Get started with QPay",
      },
      {
        name: "Newsletter",
        subject: "Your {{date}} QPay Newsletter",
        body: "This week's updates and tips...",
        htmlBody: "<p>This week's updates and tips...</p>",
        category: "newsletter" as const,
        variables: ["date"],
        previewText: "Weekly newsletter from QPay",
      },
      {
        name: "Abandoned Cart",
        subject: "You left something behind",
        body: "Your cart is waiting: {{cartUrl}}",
        htmlBody: "<p>Your cart is waiting</p>",
        category: "marketing" as const,
        variables: ["cartUrl"],
        previewText: "Complete your purchase",
      },
    ];

    templates.forEach(template => {
      this.createTemplate(template);
    });
  }

  private queueWelcomeEmail(subscriber: NewsletterSubscriber) {
    this.queueEmail({
      to: subscriber.email,
      templateId: "welcome-1",
      variables: { name: subscriber.name || subscriber.email },
    });
  }

  private queueEmail(email: any) {
    this.emailQueue.push({
      ...email,
      queuedAt: new Date(),
      status: "queued",
    });
  }

  private scheduleEmailSending(campaign: EmailCampaign) {
    // In production, this would use a job queue
    console.log(`Campaign ${campaign.id} scheduled for ${campaign.scheduledFor}`);
  }

  private queueSequenceEmail(subscriber: NewsletterSubscriber, email: any, sequenceId: string) {
    const delayMs = email.delayDays * 24 * 60 * 60 * 1000;
    const sendAt = new Date(Date.now() + delayMs);

    this.queueEmail({
      to: subscriber.email,
      templateId: email.templateId,
      sequenceId,
      sendAt,
    });
  }

  /**
   * Get subscriber count by segment
   */
  getSubscriberStats() {
    const total = this.subscribers.size;
    const active = Array.from(this.subscribers.values()).filter(s => s.isActive).length;
    const inactive = total - active;

    const byFrequency = {
      daily: 0,
      weekly: 0,
      monthly: 0,
    };

    for (const subscriber of this.subscribers.values()) {
      byFrequency[subscriber.preferences.frequency]++;
    }

    return {
      total,
      active,
      inactive,
      byFrequency,
      avgOpenRate: Array.from(this.subscribers.values()).reduce((sum, s) => sum + s.openRate, 0) / total,
    };
  }
}

export const emailMarketingService = new EmailMarketingService();
