/**
 * Enterprise Email Service
 * Transactional emails with templates and delivery tracking
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface EmailMessage {
  id: string;
  to: string;
  templateId: string;
  variables: Record<string, string>;
  status: "pending" | "sent" | "failed" | "bounced";
  sentAt?: Date;
  errorMessage?: string;
  retries: number;
  maxRetries: number;
}

export class EmailService {
  private templates: Map<string, EmailTemplate> = new Map();
  private messageQueue: EmailMessage[] = [];
  private sentMessages: EmailMessage[] = [];

  constructor() {
    this.initializeTemplates();
    this.startQueue();
  }

  /**
   * Initialize email templates
   */
  private initializeTemplates() {
    const templates: EmailTemplate[] = [
      {
        id: "payment_confirmation",
        name: "Payment Confirmation",
        subject: "Payment Confirmation - {{transaction_id}}",
        htmlContent: `<h2>Payment Confirmed</h2>
<p>Your payment of <strong>{{amount}} {{currency}}</strong> has been confirmed.</p>
<p><strong>Transaction ID:</strong> {{transaction_id}}</p>
<p><strong>Date:</strong> {{date}}</p>
<p><strong>Status:</strong> {{status}}</p>`,
        textContent: `Payment Confirmed\n\nYour payment of {{amount}} {{currency}} has been confirmed.\n\nTransaction ID: {{transaction_id}}\nDate: {{date}}\nStatus: {{status}}`,
        variables: ["amount", "currency", "transaction_id", "date", "status"],
      },
      {
        id: "settlement_notification",
        name: "Settlement Notification",
        subject: "Settlement Processed - {{settlement_id}}",
        htmlContent: `<h2>Settlement Completed</h2>
<p>Your settlement of <strong>{{amount}} {{currency}}</strong> has been processed.</p>
<p><strong>Settlement ID:</strong> {{settlement_id}}</p>
<p><strong>Transactions:</strong> {{transaction_count}}</p>
<p><strong>Expected Date:</strong> {{expected_date}}</p>`,
        textContent: `Settlement Completed\n\nYour settlement of {{amount}} {{currency}} has been processed.\n\nSettlement ID: {{settlement_id}}\nTransactions: {{transaction_count}}\nExpected Date: {{expected_date}}`,
        variables: [
          "amount",
          "currency",
          "settlement_id",
          "transaction_count",
          "expected_date",
        ],
      },
      {
        id: "kyc_verification",
        name: "KYC Verification Status",
        subject: "KYC Verification {{status}}",
        htmlContent: `<h2>KYC Verification {{status}}</h2>
<p>Your KYC verification has been {{status}}.</p>
{{#if status == 'rejected'}}<p><strong>Reason:</strong> {{reason}}</p>{{/if}}
<p>If you have questions, please contact support.</p>`,
        textContent: `KYC Verification {{status}}\n\nYour KYC verification has been {{status}}.\n\nIf you have questions, please contact support.`,
        variables: ["status"],
      },
      {
        id: "dispute_notification",
        name: "Dispute Notification",
        subject: "Dispute Filed - {{dispute_id}}",
        htmlContent: `<h2>Dispute Filed</h2>
<p>A dispute has been filed for transaction <strong>{{transaction_id}}</strong>.</p>
<p><strong>Amount:</strong> {{amount}} {{currency}}</p>
<p><strong>Reason:</strong> {{reason}}</p>
<p><strong>Due Date:</strong> {{due_date}}</p>
<p>Please submit evidence within 10 days.</p>`,
        textContent: `Dispute Filed\n\nA dispute has been filed for transaction {{transaction_id}}.\n\nAmount: {{amount}} {{currency}}\nReason: {{reason}}\nDue Date: {{due_date}}\n\nPlease submit evidence within 10 days.`,
        variables: ["transaction_id", "amount", "currency", "reason", "due_date"],
      },
      {
        id: "two_fa_code",
        name: "2FA Code",
        subject: "Your verification code",
        htmlContent: `<h2>Verification Code</h2>
<p>Your verification code is: <strong style="font-size: 24px; letter-spacing: 2px;">{{code}}</strong></p>
<p>This code expires in 10 minutes.</p>
<p>If you didn't request this, please ignore this email.</p>`,
        textContent: `Verification Code\n\nYour verification code is: {{code}}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
        variables: ["code"],
      },
    ];

    templates.forEach((t) => this.templates.set(t.id, t));
  }

  /**
   * Send email
   */
  async sendEmail(to: string, templateId: string, variables: Record<string, string>): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: EmailMessage = {
      id: messageId,
      to,
      templateId,
      variables,
      status: "pending",
      retries: 0,
      maxRetries: 3,
    };

    this.messageQueue.push(message);

    console.log(`[Email] Queued: ${messageId} to ${to}`);
    return messageId;
  }

  /**
   * Render template
   */
  renderTemplate(
    templateId: string,
    variables: Record<string, string>
  ): { subject: string; html: string; text: string } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    let subject = template.subject;
    let html = template.htmlContent;
    let text = template.textContent;

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, value);
      html = html.replace(regex, value);
      text = text.replace(regex, value);
    });

    return { subject, html, text };
  }

  /**
   * Start email queue processing
   */
  private startQueue() {
    setInterval(() => this.processQueue(), 5000); // Process every 5 seconds
  }

  /**
   * Process email queue
   */
  private async processQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (!message) break;

      try {
        await this.sendEmailMessage(message);
      } catch (error) {
        message.retries++;

        if (message.retries < message.maxRetries) {
          // Re-queue for retry
          this.messageQueue.push(message);
        } else {
          message.status = "failed";
          message.errorMessage = error instanceof Error ? error.message : String(error);
          this.sentMessages.push(message);
        }
      }
    }
  }

  /**
   * Actually send email (in production: call email provider)
   */
  private async sendEmailMessage(message: EmailMessage) {
    const template = this.templates.get(message.templateId);
    if (!template) throw new Error("Template not found");

    const rendered = this.renderTemplate(message.templateId, message.variables);
    if (!rendered) throw new Error("Failed to render template");

    // In production: Call SendGrid, AWS SES, Mailgun, etc.
    // For now: Simulate sending
    console.log(`[Email] Sending to ${message.to} using template ${message.templateId}`);

    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
      throw new Error("SMTP connection failed");
    }

    message.status = "sent";
    message.sentAt = new Date();
    this.sentMessages.push(message);

    console.log(`[Email] Sent: ${message.id}`);
  }

  /**
   * Get message status
   */
  getMessageStatus(messageId: string): EmailMessage | null {
    return (
      this.sentMessages.find((m) => m.id === messageId) ||
      this.messageQueue.find((m) => m.id === messageId) ||
      null
    );
  }

  /**
   * Add custom template
   */
  addTemplate(template: EmailTemplate) {
    this.templates.set(template.id, template);
    console.log(`[Email] Template added: ${template.id}`);
  }

  /**
   * Get statistics
   */
  getStats() {
    const allMessages = [...this.sentMessages, ...this.messageQueue];
    const sent = allMessages.filter((m) => m.status === "sent").length;
    const failed = allMessages.filter((m) => m.status === "failed").length;

    return {
      totalMessages: allMessages.length,
      sentMessages: sent,
      failedMessages: failed,
      pendingMessages: this.messageQueue.length,
      successRate: allMessages.length > 0 ? ((sent / allMessages.length) * 100).toFixed(1) + "%" : "N/A",
    };
  }
}

export default EmailService;
