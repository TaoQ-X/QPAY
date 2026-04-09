import crypto from "crypto";

/**
 * ALERT CONFIGURATION SERVICE
 */

export interface AlertConfiguration {
  id: string;
  merchantId: string;
  name: string;
  enabled: boolean;
  triggers: {
    type: "high_transaction" | "failed_transaction" | "terminal_offline" | "daily_threshold" | "low_battery";
    value?: number; // threshold amount or percentage
    frequency: "immediate" | "hourly" | "daily";
  }[];
  notificationChannels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    pushNotification: boolean;
  };
  recipients: {
    type: "owner" | "manager" | "custom";
    email?: string;
    phoneNumber?: string;
  }[];
  createdAt: Date;
  lastModified: Date;
}

export interface AlertNotification {
  id: string;
  alertConfigId: string;
  merchantId: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  data: Record<string, any>;
  status: "pending" | "sent" | "failed" | "delivered";
  channels: {
    email: { status: "pending" | "sent" | "failed"; timestamp?: Date };
    sms: { status: "pending" | "sent" | "failed"; timestamp?: Date };
    inApp: { status: "pending" | "sent" | "failed"; timestamp?: Date };
  };
  createdAt: Date;
}

/**
 * DIGITAL INVOICE SERVICE
 */

export interface DigitalInvoice {
  id: string;
  invoiceNumber: string;
  merchantId: string;
  terminalId: string;
  transactionId: string;
  amount: number;
  currency: string;
  date: Date;
  customerEmail?: string;
  customerPhone?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate?: number;
  }[];
  taxAmount: number;
  total: number;
  paymentMethod: string;
  cardLastFour?: string;
  status: "draft" | "issued" | "sent" | "viewed" | "paid";
  signature: string; // Digital signature
  signatureAlgorithm: "RSA-SHA256" | "ECDSA";
  sendMethods: {
    email: { sent: boolean; timestamp?: Date };
    sms: { sent: boolean; timestamp?: Date };
    printed: { sent: boolean; timestamp?: Date };
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  expiryDate?: Date;
}

class AlertAndInvoiceService {
  private alertConfigurations: Map<string, AlertConfiguration> = new Map();
  private alertNotifications: Map<string, AlertNotification> = new Map();
  private digitalInvoices: Map<string, DigitalInvoice> = new Map();
  private notificationLog: any[] = [];

  /**
   * Create alert configuration
   */
  createAlertConfiguration(
    merchantId: string,
    config: Omit<AlertConfiguration, "id" | "createdAt" | "lastModified">
  ): AlertConfiguration {
    const id = crypto.randomUUID();

    const newConfig: AlertConfiguration = {
      ...config,
      id,
      createdAt: new Date(),
      lastModified: new Date(),
    };

    this.alertConfigurations.set(id, newConfig);
    return newConfig;
  }

  /**
   * Get pre-configured alert templates
   */
  getAlertTemplates(): any[] {
    return [
      {
        name: "High Transaction Alert",
        description: "Alert when transaction exceeds threshold",
        triggers: [
          {
            type: "high_transaction",
            value: 5000,
            frequency: "immediate",
          },
        ],
        notificationChannels: {
          email: true,
          sms: true,
          inApp: true,
          pushNotification: false,
        },
      },
      {
        name: "Failed Transaction Alert",
        description: "Alert on declined transactions",
        triggers: [
          {
            type: "failed_transaction",
            frequency: "immediate",
          },
        ],
        notificationChannels: {
          email: true,
          sms: true,
          inApp: true,
          pushNotification: true,
        },
      },
      {
        name: "Terminal Health Alert",
        description: "Alert when terminal goes offline",
        triggers: [
          {
            type: "terminal_offline",
            frequency: "immediate",
          },
          {
            type: "low_battery",
            value: 20,
            frequency: "hourly",
          },
        ],
        notificationChannels: {
          email: true,
          sms: true,
          inApp: true,
          pushNotification: true,
        },
      },
      {
        name: "Daily Revenue Alert",
        description: "Daily summary of revenue and transactions",
        triggers: [
          {
            type: "daily_threshold",
            frequency: "daily",
          },
        ],
        notificationChannels: {
          email: true,
          sms: false,
          inApp: true,
          pushNotification: false,
        },
      },
    ];
  }

  /**
   * Trigger alert notification
   */
  async triggerAlert(
    alertConfigId: string,
    triggerType: string,
    data: Record<string, any>
  ): Promise<AlertNotification> {
    const config = this.alertConfigurations.get(alertConfigId);
    if (!config || !config.enabled) {
      throw new Error("Alert configuration not found or disabled");
    }

    // Check if trigger is configured
    const trigger = config.triggers.find(t => t.type === triggerType);
    if (!trigger) {
      throw new Error("Trigger not configured");
    }

    // Create notification
    const notification: AlertNotification = {
      id: crypto.randomUUID(),
      alertConfigId,
      merchantId: config.merchantId,
      type: triggerType,
      severity: this.calculateSeverity(triggerType, data),
      title: this.generateTitle(triggerType, data),
      message: this.generateMessage(triggerType, data),
      data,
      status: "pending",
      channels: {
        email: { status: "pending" },
        sms: { status: "pending" },
        inApp: { status: "pending" },
      },
      createdAt: new Date(),
    };

    this.alertNotifications.set(notification.id, notification);

    // Send notifications
    await this.sendNotifications(notification, config);

    return notification;
  }

  /**
   * Send notifications through configured channels
   */
  private async sendNotifications(
    notification: AlertNotification,
    config: AlertConfiguration
  ): Promise<void> {
    for (const recipient of config.recipients) {
      const contactInfo = this.getRecipientContactInfo(recipient);

      if (config.notificationChannels.email && contactInfo.email) {
        await this.sendEmailNotification(
          notification,
          contactInfo.email
        );
        notification.channels.email.status = "sent";
        notification.channels.email.timestamp = new Date();
      }

      if (config.notificationChannels.sms && contactInfo.phoneNumber) {
        await this.sendSmsNotification(
          notification,
          contactInfo.phoneNumber
        );
        notification.channels.sms.status = "sent";
        notification.channels.sms.timestamp = new Date();
      }

      if (config.notificationChannels.inApp) {
        await this.createInAppNotification(notification);
        notification.channels.inApp.status = "sent";
        notification.channels.inApp.timestamp = new Date();
      }
    }

    notification.status = "sent";
    this.logNotification(notification);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    notification: AlertNotification,
    email: string
  ): Promise<void> {
    // Simulate email sending
    console.log(`[EMAIL] To: ${email}, Subject: ${notification.title}`);
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(
    notification: AlertNotification,
    phoneNumber: string
  ): Promise<void> {
    // Simulate SMS sending
    console.log(`[SMS] To: ${phoneNumber}, Message: ${notification.message}`);
  }

  /**
   * Create in-app notification
   */
  private async createInAppNotification(
    notification: AlertNotification
  ): Promise<void> {
    // Store for in-app display
    console.log(`[IN-APP] Notification created: ${notification.title}`);
  }

  /**
   * Generate alert title
   */
  private generateTitle(type: string, data: Record<string, any>): string {
    const titles: Record<string, string> = {
      high_transaction: `High Transaction Alert: $${data.amount}`,
      failed_transaction: `Transaction Failed: ${data.terminalId}`,
      terminal_offline: `Terminal Offline: ${data.terminalId}`,
      daily_threshold: `Daily Revenue: $${data.totalAmount}`,
      low_battery: `Low Battery Warning: ${data.terminalId}`,
    };
    return titles[type] || "System Alert";
  }

  /**
   * Generate alert message
   */
  private generateMessage(type: string, data: Record<string, any>): string {
    const messages: Record<string, string> = {
      high_transaction: `A transaction of $${data.amount} has exceeded the alert threshold`,
      failed_transaction: `Transaction ${data.transactionId} was declined`,
      terminal_offline: `Terminal ${data.terminalId} has gone offline`,
      daily_threshold: `Your daily revenue is $${data.totalAmount} from ${data.transactionCount} transactions`,
      low_battery: `Battery level at ${data.batteryLevel}% on terminal ${data.terminalId}`,
    };
    return messages[type] || "An alert has been triggered";
  }

  /**
   * Calculate alert severity
   */
  private calculateSeverity(
    type: string,
    data: Record<string, any>
  ): "info" | "warning" | "critical" {
    if (type === "terminal_offline") return "critical";
    if (type === "high_transaction" && data.amount > 10000) return "critical";
    if (type === "failed_transaction") return "warning";
    return "info";
  }

  /**
   * Get recipient contact info
   */
  private getRecipientContactInfo(recipient: any): { email?: string; phoneNumber?: string } {
    if (recipient.type === "custom") {
      return {
        email: recipient.email,
        phoneNumber: recipient.phoneNumber,
      };
    }
    // In production, lookup owner/manager info from database
    return {};
  }

  /**
   * Log notification
   */
  private logNotification(notification: AlertNotification): void {
    this.notificationLog.push({
      id: notification.id,
      type: notification.type,
      severity: notification.severity,
      timestamp: new Date(),
      status: notification.status,
    });
  }

  /**
   * CREATE DIGITAL INVOICE
   */

  createDigitalInvoice(
    merchantId: string,
    invoiceData: Omit<DigitalInvoice, "id" | "invoiceNumber" | "signature" | "signatureAlgorithm" | "status" | "createdAt">
  ): DigitalInvoice {
    const id = crypto.randomUUID();
    const invoiceNumber = this.generateInvoiceNumber(merchantId);

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;

    const items = invoiceData.items.map(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = item.taxRate ? itemTotal * (item.taxRate / 100) : 0;
      subtotal += itemTotal;
      totalTax += itemTax;
      return {
        ...item,
        total: itemTotal,
      };
    });

    // Generate digital signature
    const signature = this.generateDigitalSignature(invoiceData);

    const invoice: DigitalInvoice = {
      ...invoiceData,
      id,
      invoiceNumber,
      items,
      taxAmount: totalTax,
      total: subtotal + totalTax,
      signature,
      signatureAlgorithm: "RSA-SHA256",
      status: "issued",
      createdAt: new Date(),
    };

    this.digitalInvoices.set(id, invoice);
    return invoice;
  }

  /**
   * Generate invoice number
   */
  private generateInvoiceNumber(merchantId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `INV-${merchantId.substr(0, 4)}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate digital signature (RSA-SHA256)
   */
  private generateDigitalSignature(invoiceData: any): string {
    // Simulate digital signature generation
    const dataString = JSON.stringify(invoiceData);
    return crypto
      .createHash("sha256")
      .update(dataString)
      .digest("hex")
      .substr(0, 64);
  }

  /**
   * Send digital invoice to customer
   */
  async sendInvoice(
    invoiceId: string,
    channels: ("email" | "sms" | "print")[] = ["email"]
  ): Promise<DigitalInvoice> {
    const invoice = this.digitalInvoices.get(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    for (const channel of channels) {
      if (channel === "email" && invoice.customerEmail) {
        await this.sendInvoiceByEmail(invoice);
        invoice.sendMethods.email.sent = true;
        invoice.sendMethods.email.timestamp = new Date();
      } else if (channel === "sms" && invoice.customerPhone) {
        await this.sendInvoiceBySms(invoice);
        invoice.sendMethods.sms.sent = true;
        invoice.sendMethods.sms.timestamp = new Date();
      } else if (channel === "print") {
        await this.printInvoice(invoice);
        invoice.sendMethods.printed.sent = true;
        invoice.sendMethods.printed.timestamp = new Date();
      }
    }

    invoice.status = "sent";
    return invoice;
  }

  /**
   * Send invoice by email
   */
  private async sendInvoiceByEmail(invoice: DigitalInvoice): Promise<void> {
    // Simulate email with invoice attachment
    console.log(`[EMAIL INVOICE] Sent to ${invoice.customerEmail}`);
    console.log(`Invoice #${invoice.invoiceNumber}, Amount: $${invoice.total}`);
  }

  /**
   * Send invoice by SMS
   */
  private async sendInvoiceBySms(invoice: DigitalInvoice): Promise<void> {
    // Send link to invoice
    console.log(`[SMS INVOICE] Sent to ${invoice.customerPhone}`);
    console.log(`Invoice #${invoice.invoiceNumber} - Download: https://qpay.io/invoice/${invoice.id}`);
  }

  /**
   * Print invoice from terminal
   */
  private async printInvoice(invoice: DigitalInvoice): Promise<void> {
    // Send to terminal printer
    console.log(`[PRINT] Printing invoice #${invoice.invoiceNumber}`);
  }

  /**
   * Get invoice
   */
  getInvoice(invoiceId: string): DigitalInvoice | null {
    return this.digitalInvoices.get(invoiceId) || null;
  }

  /**
   * Verify invoice signature
   */
  verifyInvoiceSignature(invoiceId: string): boolean {
    const invoice = this.digitalInvoices.get(invoiceId);
    if (!invoice) return false;

    // In production, verify using public key
    // For now, just check if signature exists
    return !!invoice.signature;
  }

  /**
   * Get invoice statistics
   */
  getInvoiceStats(merchantId: string): any {
    const invoices = Array.from(this.digitalInvoices.values()).filter(
      i => i.merchantId === merchantId
    );

    return {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, i) => sum + i.total, 0),
      byStatus: {
        draft: invoices.filter(i => i.status === "draft").length,
        issued: invoices.filter(i => i.status === "issued").length,
        sent: invoices.filter(i => i.status === "sent").length,
        viewed: invoices.filter(i => i.status === "viewed").length,
        paid: invoices.filter(i => i.status === "paid").length,
      },
      bySendMethod: {
        email: invoices.filter(i => i.sendMethods.email.sent).length,
        sms: invoices.filter(i => i.sendMethods.sms.sent).length,
        printed: invoices.filter(i => i.sendMethods.printed.sent).length,
      },
    };
  }

  /**
   * Get notification log
   */
  getNotificationLog(merchantId?: string, limit: number = 100): any[] {
    let logs = this.notificationLog;

    if (merchantId) {
      logs = logs.filter(
        log =>
          Array.from(this.alertNotifications.values()).find(
            n => n.id === log.id && n.merchantId === merchantId
          )
      );
    }

    return logs.slice(-limit).reverse();
  }
}

export const alertAndInvoiceService = new AlertAndInvoiceService();
