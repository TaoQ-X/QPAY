import crypto from "crypto";

export interface POSTerminal {
  id: string;
  merchantId: string;
  terminalId: string; // Physical terminal identifier
  name: string;
  status: "active" | "inactive" | "maintenance" | "offline";
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  emvCertification: {
    certified: boolean;
    certificationDate: Date;
    expiryDate: Date;
    level: "L1" | "L2" | "L3";
  };
  capabilities: string[];
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  };
  configuration: {
    transactionLimit: number;
    dailyLimit: number;
    requiresSignature: boolean;
    requiresPin: boolean;
    supportedPaymentMethods: string[];
  };
  lastHealthCheck: Date;
  activationDate: Date;
  deactivationDate?: Date;
  transactionCount: number;
  totalVolume: number;
}

export interface TerminalTransaction {
  id: string;
  terminalId: string;
  merchantId: string;
  amount: number;
  currency: string;
  paymentMethod: "card" | "contactless" | "chip" | "crypto";
  cardType?: "visa" | "mastercard" | "amex" | "discover";
  lastFourDigits?: string;
  transactionTime: Date;
  settlementDate: Date;
  status: "approved" | "declined" | "pending" | "refunded";
  receiptNumber: string;
  signatureCapture?: boolean;
  invoiceNumber?: string;
  notes?: string;
}

export interface TerminalConfiguration {
  terminalId: string;
  merchantId: string;
  configId: string;
  settings: {
    timezone: string;
    language: "en" | "he" | "ar";
    displayFormat: "receipt" | "digital";
    autoSettlementTime: string;
    idleTimeout: number; // seconds
    screenBrightness: number; // 0-100
  };
  security: {
    requiresPin: boolean;
    pinLength: number;
    sessionTimeout: number;
    encryptionLevel: "AES-128" | "AES-256";
  };
  features: {
    contactlessPayment: boolean;
    chipCardSupport: boolean;
    magneticStripeFallback: boolean;
    invoicePrinting: boolean;
    receiptEmail: boolean;
    receiptSms: boolean;
  };
  alerts: {
    lowBattery: boolean;
    networkDisconnect: boolean;
    highTransaction: boolean;
    systemError: boolean;
  };
  updatedAt: Date;
}

export interface TerminalHealthCheck {
  terminalId: string;
  timestamp: Date;
  status: "healthy" | "warning" | "critical";
  metrics: {
    connectivity: "online" | "offline";
    batteryLevel: number;
    storageUsage: number;
    memoryUsage: number;
    lastTransactionTime: Date;
    errorLog: string[];
  };
  firmwareUpdateAvailable: boolean;
  securityAlertsCount: number;
}

class POSTerminalService {
  private terminals: Map<string, POSTerminal> = new Map();
  private transactions: Map<string, TerminalTransaction> = new Map();
  private configurations: Map<string, TerminalConfiguration> = new Map();
  private healthChecks: Map<string, TerminalHealthCheck> = new Map();
  private terminalActivity: Map<string, any[]> = new Map();

  /**
   * Register new POS terminal
   */
  registerTerminal(
    merchantId: string,
    terminalData: Omit<POSTerminal, "id" | "transactionCount" | "totalVolume">
  ): POSTerminal {
    const id = crypto.randomUUID();

    const terminal: POSTerminal = {
      ...terminalData,
      id,
      merchantId,
      transactionCount: 0,
      totalVolume: 0,
      lastHealthCheck: new Date(),
      activationDate: new Date(),
    };

    this.terminals.set(id, terminal);

    // Create default configuration
    this.createDefaultConfiguration(id, merchantId);

    return terminal;
  }

  /**
   * Create default terminal configuration
   */
  private createDefaultConfiguration(terminalId: string, merchantId: string): void {
    const config: TerminalConfiguration = {
      terminalId,
      merchantId,
      configId: crypto.randomUUID(),
      settings: {
        timezone: "UTC",
        language: "en",
        displayFormat: "receipt",
        autoSettlementTime: "23:00",
        idleTimeout: 600,
        screenBrightness: 100,
      },
      security: {
        requiresPin: true,
        pinLength: 4,
        sessionTimeout: 900,
        encryptionLevel: "AES-256",
      },
      features: {
        contactlessPayment: true,
        chipCardSupport: true,
        magneticStripeFallback: true,
        invoicePrinting: true,
        receiptEmail: true,
        receiptSms: true,
      },
      alerts: {
        lowBattery: true,
        networkDisconnect: true,
        highTransaction: true,
        systemError: true,
      },
      updatedAt: new Date(),
    };

    this.configurations.set(terminalId, config);
  }

  /**
   * Process transaction on terminal
   */
  async processTransaction(
    terminalId: string,
    transactionData: Omit<TerminalTransaction, "id" | "transactionTime" | "receiptNumber">
  ): Promise<TerminalTransaction> {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      throw new Error("Terminal not found");
    }

    // Validate transaction against terminal limits
    this.validateTransaction(terminal, transactionData);

    // Create transaction
    const transaction: TerminalTransaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      transactionTime: new Date(),
      receiptNumber: this.generateReceiptNumber(terminalId),
    };

    this.transactions.set(transaction.id, transaction);

    // Update terminal stats
    terminal.transactionCount++;
    terminal.totalVolume += transactionData.amount;

    // Log activity
    this.logActivity(terminalId, {
      type: "transaction_processed",
      transactionId: transaction.id,
      amount: transactionData.amount,
      timestamp: new Date(),
    });

    return transaction;
  }

  /**
   * Validate transaction against terminal limits
   */
  private validateTransaction(
    terminal: POSTerminal,
    transactionData: any
  ): void {
    // Check transaction limit
    if (transactionData.amount > terminal.configuration.transactionLimit) {
      throw new Error("Transaction exceeds limit");
    }

    // Check daily limit
    const todayTotal = this.calculateDailyTotal(terminal.id);
    if (
      todayTotal + transactionData.amount >
      terminal.configuration.dailyLimit
    ) {
      throw new Error("Daily limit exceeded");
    }

    // Check terminal status
    if (terminal.status !== "active") {
      throw new Error("Terminal is not active");
    }
  }

  /**
   * Calculate daily total for terminal
   */
  private calculateDailyTotal(terminalId: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let total = 0;
    for (const tx of this.transactions.values()) {
      if (
        tx.terminalId === terminalId &&
        new Date(tx.transactionTime) >= today
      ) {
        total += tx.amount;
      }
    }

    return total;
  }

  /**
   * Generate receipt number
   */
  private generateReceiptNumber(terminalId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `RCP-${terminalId.substr(0, 4)}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Log terminal activity
   */
  private logActivity(terminalId: string, activity: any): void {
    if (!this.terminalActivity.has(terminalId)) {
      this.terminalActivity.set(terminalId, []);
    }
    this.terminalActivity.get(terminalId)!.push({
      ...activity,
      timestamp: new Date(),
    });
  }

  /**
   * Perform terminal health check
   */
  async healthCheck(terminalId: string): Promise<TerminalHealthCheck> {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      throw new Error("Terminal not found");
    }

    // Simulate health check
    const metrics = {
      connectivity: Math.random() > 0.1 ? ("online" as const) : ("offline" as const),
      batteryLevel: Math.floor(Math.random() * 100),
      storageUsage: Math.floor(Math.random() * 80),
      memoryUsage: Math.floor(Math.random() * 70),
      lastTransactionTime: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
      errorLog: [] as string[],
    };

    // Check for issues
    if (metrics.batteryLevel < 20) {
      metrics.errorLog.push("Low battery warning");
    }
    if (metrics.storageUsage > 90) {
      metrics.errorLog.push("Storage capacity critical");
    }

    // Determine health status
    let status: "healthy" | "warning" | "critical" = "healthy";
    if (metrics.errorLog.length > 0) status = "warning";
    if (metrics.connectivity === "offline") status = "critical";

    const healthCheck: TerminalHealthCheck = {
      terminalId,
      timestamp: new Date(),
      status,
      metrics,
      firmwareUpdateAvailable: Math.random() > 0.8,
      securityAlertsCount: metrics.errorLog.length,
    };

    // Update terminal health check
    terminal.lastHealthCheck = new Date();
    this.healthChecks.set(terminalId, healthCheck);

    return healthCheck;
  }

  /**
   * Update terminal configuration
   */
  updateConfiguration(
    terminalId: string,
    updates: Partial<TerminalConfiguration>
  ): TerminalConfiguration {
    const config = this.configurations.get(terminalId);
    if (!config) {
      throw new Error("Configuration not found");
    }

    const updated: TerminalConfiguration = {
      ...config,
      ...updates,
      updatedAt: new Date(),
    };

    this.configurations.set(terminalId, updated);

    // Log activity
    this.logActivity(terminalId, {
      type: "configuration_updated",
      changes: updates,
    });

    return updated;
  }

  /**
   * Get terminal transactions
   */
  getTerminalTransactions(
    terminalId: string,
    limit: number = 50
  ): TerminalTransaction[] {
    const txs: TerminalTransaction[] = [];

    for (const tx of this.transactions.values()) {
      if (tx.terminalId === terminalId) {
        txs.push(tx);
      }
    }

    return txs
      .sort((a, b) => b.transactionTime.getTime() - a.transactionTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get merchant terminals
   */
  getMerchantTerminals(merchantId: string): POSTerminal[] {
    const merchantTerminals: POSTerminal[] = [];

    for (const terminal of this.terminals.values()) {
      if (terminal.merchantId === merchantId) {
        merchantTerminals.push(terminal);
      }
    }

    return merchantTerminals;
  }

  /**
   * Get terminal statistics
   */
  getTerminalStats(terminalId: string): any {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) return null;

    const transactions = this.getTerminalTransactions(terminalId, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = transactions.filter(
      tx => new Date(tx.transactionTime) >= today
    );

    return {
      terminalId,
      status: terminal.status,
      totalTransactions: transactions.length,
      totalVolume: terminal.totalVolume,
      todayTransactions: todayTransactions.length,
      todayVolume: todayTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      approvedCount: transactions.filter(tx => tx.status === "approved").length,
      declinedCount: transactions.filter(tx => tx.status === "declined").length,
      averageTransaction:
        transactions.length > 0
          ? terminal.totalVolume / transactions.length
          : 0,
      lastHealthCheck: terminal.lastHealthCheck,
      uptime: this.calculateUptime(terminalId),
    };
  }

  /**
   * Calculate terminal uptime
   */
  private calculateUptime(terminalId: string): number {
    const healthChecks = Array.from(this.healthChecks.values()).filter(
      h => h.terminalId === terminalId
    );

    if (healthChecks.length === 0) return 100;

    const healthy = healthChecks.filter(h => h.status === "healthy").length;
    return (healthy / healthChecks.length) * 100;
  }

  /**
   * Generate EMV compliance report
   */
  getEMVComplianceReport(merchantId: string): any {
    const terminals = this.getMerchantTerminals(merchantId);

    const certified = terminals.filter(t => t.emvCertification.certified).length;
    const certifiedExpiring = terminals.filter(
      t =>
        t.emvCertification.certified &&
        new Date(t.emvCertification.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    ).length;

    return {
      merchantId,
      totalTerminals: terminals.length,
      certifiedTerminals: certified,
      certificationPercentage: (certified / terminals.length) * 100,
      certificationsExpiringSoon: certifiedExpiring,
      certificationLevels: {
        L1: terminals.filter(t => t.emvCertification.level === "L1").length,
        L2: terminals.filter(t => t.emvCertification.level === "L2").length,
        L3: terminals.filter(t => t.emvCertification.level === "L3").length,
      },
      recommendations: this.getEMVRecommendations(terminals),
    };
  }

  /**
   * Get EMV compliance recommendations
   */
  private getEMVRecommendations(terminals: POSTerminal[]): string[] {
    const recommendations: string[] = [];

    const uncertified = terminals.filter(t => !t.emvCertification.certified);
    if (uncertified.length > 0) {
      recommendations.push(
        `Update EMV certification for ${uncertified.length} terminals`
      );
    }

    const expiring = terminals.filter(
      t =>
        t.emvCertification.certified &&
        new Date(t.emvCertification.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    );
    if (expiring.length > 0) {
      recommendations.push(`Renew EMV certification for ${expiring.length} terminals`);
    }

    const outdatedFirmware = terminals.filter(
      t =>
        parseFloat(t.firmwareVersion) <
        parseFloat(terminals[0]?.firmwareVersion || "0")
    );
    if (outdatedFirmware.length > 0) {
      recommendations.push(`Update firmware for ${outdatedFirmware.length} terminals`);
    }

    return recommendations;
  }

  /**
   * Batch update terminals
   */
  batchUpdateTerminals(
    merchantId: string,
    updates: Partial<POSTerminal>
  ): POSTerminal[] {
    const updated: POSTerminal[] = [];

    for (const terminal of this.terminals.values()) {
      if (terminal.merchantId === merchantId) {
        Object.assign(terminal, updates);
        updated.push(terminal);
      }
    }

    return updated;
  }

  /**
   * Get terminal activity log
   */
  getActivityLog(terminalId: string, limit: number = 100): any[] {
    const activity = this.terminalActivity.get(terminalId) || [];
    return activity.slice(-limit).reverse();
  }

  /**
   * Remote terminal reboot
   */
  async remoteReboot(terminalId: string): Promise<{ success: boolean; message: string }> {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      return { success: false, message: "Terminal not found" };
    }

    // Simulate reboot
    this.logActivity(terminalId, {
      type: "remote_reboot",
      initiatedAt: new Date(),
    });

    return {
      success: true,
      message: "Reboot command sent successfully",
    };
  }

  /**
   * Push firmware update
   */
  async pushFirmwareUpdate(
    terminalId: string,
    firmwareVersion: string
  ): Promise<{ success: boolean; updateId: string }> {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) {
      throw new Error("Terminal not found");
    }

    const updateId = crypto.randomUUID();

    this.logActivity(terminalId, {
      type: "firmware_update_pushed",
      fromVersion: terminal.firmwareVersion,
      toVersion: firmwareVersion,
      updateId,
    });

    // Schedule update
    setTimeout(() => {
      terminal.firmwareVersion = firmwareVersion;
    }, 5000); // Simulate 5-second update

    return { success: true, updateId };
  }
}

export const posTerminalService = new POSTerminalService();
