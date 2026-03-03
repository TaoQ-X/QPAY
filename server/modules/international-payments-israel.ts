/**
 * Q Pay - International Payments for Israeli Companies
 * Enables Israeli businesses to send international payments globally
 */

export type PaymentDestination = 
  | 'us' | 'eu' | 'uk' | 'asia' | 'international';

export interface InternationalRecipient {
  id: string;
  name: string;
  country: string;
  currency: string;
  bankDetails?: {
    accountNumber: string;
    swiftCode?: string;
    iban?: string;
    routingNumber?: string;
  };
  cryptoAddress?: {
    blockchain: string;
    address: string;
  };
  type: 'business' | 'individual';
  verified: boolean;
  createdAt: number;
}

export interface InternationalPaymentRequest {
  recipientId: string;
  amount: number; // In ILS
  destinationCurrency: string;
  paymentMethod: 'wire_transfer' | 'crypto' | 'local_method';
  description: string;
  companySize: 'small' | 'medium' | 'large';
  metadata?: Record<string, any>;
}

export interface InternationalPaymentResponse {
  id: string;
  recipientId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amountSent: number; // In ILS
  amountReceived: number; // In destination currency
  destinationCurrency: string;
  exchangeRate: number;
  fee: number;
  feeBreakdown: {
    isrFee: number;
    internationalFee: number;
    bankFee: number;
  };
  paymentMethod: string;
  destination: string;
  trackingNumber: string;
  createdAt: number;
  completedAt?: number;
  estimatedDelivery: number; // Timestamp
}

class InternationalPaymentService {
  private recipients: Map<string, InternationalRecipient> = new Map();
  private payments: Map<string, InternationalPaymentResponse> = new Map();

  // Exchange rates (in production, use real-time API)
  private exchangeRates: Record<string, number> = {
    'USD': 0.267,   // 1 ILS to USD
    'EUR': 0.248,   // 1 ILS to EUR
    'GBP': 0.215,   // 1 ILS to GBP
    'CHF': 0.235,   // 1 ILS to CHF
    'SGD': 0.357,   // 1 ILS to SGD
    'HKD': 2.09,    // 1 ILS to HKD
    'AUD': 0.407,   // 1 ILS to AUD
    'CAD': 0.363,   // 1 ILS to CAD
    'JPY': 39.5,    // 1 ILS to JPY
    'CNY': 1.94,    // 1 ILS to CNY
    'INR': 22.3,    // 1 ILS to INR
    'BRL': 1.33,    // 1 ILS to BRL
    'MXN': 4.53,    // 1 ILS to MXN
    'ZAR': 4.97,    // 1 ILS to ZAR
  };

  // Regional payment corridors (from Israel)
  private corridors: Record<string, { fee: number; settlementDays: number; methods: string[] }> = {
    'us': {
      fee: 25,
      settlementDays: 2,
      methods: ['wire_transfer', 'crypto', 'ach'],
    },
    'eu': {
      fee: 20,
      settlementDays: 2,
      methods: ['sepa', 'wire_transfer', 'crypto'],
    },
    'uk': {
      fee: 15,
      settlementDays: 1,
      methods: ['faster_payments', 'wire_transfer', 'crypto'],
    },
    'asia': {
      fee: 35,
      settlementDays: 3,
      methods: ['wire_transfer', 'crypto'],
    },
    'international': {
      fee: 45,
      settlementDays: 5,
      methods: ['wire_transfer', 'crypto'],
    },
  };

  /**
   * Add international recipient
   */
  addRecipient(
    name: string,
    country: string,
    currency: string,
    bankDetails?: any
  ): InternationalRecipient {
    const id = `intl_${Math.random().toString(36).substring(2, 9)}`;

    const recipient: InternationalRecipient = {
      id,
      name,
      country,
      currency,
      bankDetails,
      type: 'business',
      verified: false,
      createdAt: Math.floor(Date.now() / 1000),
    };

    this.recipients.set(id, recipient);
    return recipient;
  }

  /**
   * Verify recipient (KYC check)
   */
  async verifyRecipient(recipientId: string): Promise<boolean> {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return false;

    // In production, verify with:
    // - SWIFT/BIC validation
    // - IBAN validation
    // - Recipient country regulations
    // - International payment corridors

    recipient.verified = true;
    return true;
  }

  /**
   * Process international payment
   */
  async processPayment(
    request: InternationalPaymentRequest
  ): Promise<InternationalPaymentResponse> {
    const recipient = this.recipients.get(request.recipientId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    if (!recipient.verified) {
      throw new Error('Recipient must be verified first');
    }

    // Get corridor info
    const corridor = this.getDestinationCorridor(recipient.country);
    const exchangeRate = this.exchangeRates[request.destinationCurrency] || 0;

    if (exchangeRate === 0) {
      throw new Error(`Currency ${request.destinationCurrency} not supported`);
    }

    // Calculate fees
    const { fee, feeBreakdown } = this.calculateInternationalFee(
      request.amount,
      corridor,
      request.companySize
    );

    // Calculate received amount
    const amountReceived = (request.amount - fee) * exchangeRate;

    // Create payment
    const paymentId = `intl_pay_${Math.random().toString(36).substring(2, 9)}`;
    const trackingNumber = this.generateTrackingNumber(recipient.country);

    const payment: InternationalPaymentResponse = {
      id: paymentId,
      recipientId: request.recipientId,
      status: 'processing',
      amountSent: request.amount,
      amountReceived: Math.round(amountReceived * 100) / 100,
      destinationCurrency: request.destinationCurrency,
      exchangeRate,
      fee,
      feeBreakdown,
      paymentMethod: request.paymentMethod,
      destination: recipient.country,
      trackingNumber,
      createdAt: Math.floor(Date.now() / 1000),
      estimatedDelivery: Math.floor(Date.now() / 1000) + (corridor.settlementDays * 86400),
    };

    this.payments.set(paymentId, payment);

    // Process payment based on method
    await this.processPaymentMethod(payment, request, recipient);

    return payment;
  }

  /**
   * Process payment by method
   */
  private async processPaymentMethod(
    payment: InternationalPaymentResponse,
    request: InternationalPaymentRequest,
    recipient: InternationalRecipient
  ): Promise<void> {
    switch (request.paymentMethod) {
      case 'wire_transfer':
        await this.processWireTransfer(payment, recipient);
        break;
      case 'crypto':
        await this.processCryptoPayment(payment, recipient);
        break;
      case 'local_method':
        await this.processLocalPaymentMethod(payment, recipient);
        break;
    }
  }

  /**
   * Process SWIFT wire transfer
   */
  private async processWireTransfer(
    payment: InternationalPaymentResponse,
    recipient: InternationalRecipient
  ): Promise<void> {
    if (!recipient.bankDetails) {
      throw new Error('Bank details required for wire transfer');
    }

    // Simulate wire transfer processing
    const processingTime = 5000; // 5 seconds for simulation
    setTimeout(() => {
      payment.status = 'completed';
      payment.completedAt = Math.floor(Date.now() / 1000);
    }, processingTime);
  }

  /**
   * Process crypto payment
   */
  private async processCryptoPayment(
    payment: InternationalPaymentResponse,
    recipient: InternationalRecipient
  ): Promise<void> {
    if (!recipient.cryptoAddress) {
      throw new Error('Crypto address required for crypto payment');
    }

    // Crypto payments settle faster
    const processingTime = 3000; // 3 seconds for simulation
    setTimeout(() => {
      payment.status = 'completed';
      payment.completedAt = Math.floor(Date.now() / 1000);
      payment.estimatedDelivery = Math.floor(Date.now() / 1000) + 600; // 10 minutes for blockchain confirmation
    }, processingTime);
  }

  /**
   * Process local payment method (varies by country)
   */
  private async processLocalPaymentMethod(
    payment: InternationalPaymentResponse,
    recipient: InternationalRecipient
  ): Promise<void> {
    // Use country-specific payment methods:
    // US: ACH, Wire Transfer
    // EU: SEPA, Wire Transfer
    // UK: Faster Payments, Chaps
    // Asia: Local payment systems

    const localMethods: Record<string, string> = {
      'US': 'ACH or Domestic Wire',
      'UK': 'Faster Payments',
      'EU': 'SEPA Credit Transfer',
      'DE': 'SEPA',
      'FR': 'SEPA',
      'AU': 'BECS Direct Debit',
      'JP': 'Japan Bank Transfer',
      'CN': 'China UnionPay',
    };

    payment.paymentMethod = localMethods[recipient.country] || 'Wire Transfer';

    // Settlement time varies
    const processingTime = 4000; // 4 seconds for simulation
    setTimeout(() => {
      payment.status = 'completed';
      payment.completedAt = Math.floor(Date.now() / 1000);
    }, processingTime);
  }

  /**
   * Calculate international payment fee
   */
  private calculateInternationalFee(
    amount: number,
    corridor: any,
    companySize: 'small' | 'medium' | 'large'
  ): { fee: number; feeBreakdown: any } {
    // Base corridor fee
    let corridorFee = corridor.fee;

    // Apply company size discount
    const discounts: Record<string, number> = {
      'small': 0, // No discount
      'medium': 10, // 10% discount
      'large': 25, // 25% discount
    };

    corridorFee = corridorFee - (corridorFee * discounts[companySize] / 100);

    // Calculate percentage fee (0.5% - 2%)
    const percentageFee = Math.round((amount * 0.01) * 100) / 100; // 1% for exchange

    const bankFee = corridorFee;
    const internationalFee = percentageFee;
    const isrFee = Math.round(amount * 0.002 * 100) / 100; // 0.2% from Israel

    const totalFee = Math.round((bankFee + internationalFee + isrFee) * 100) / 100;

    return {
      fee: totalFee,
      feeBreakdown: {
        isrFee,
        internationalFee,
        bankFee,
      },
    };
  }

  /**
   * Determine destination corridor
   */
  private getDestinationCorridor(country: string): any {
    const corridorMap: Record<string, string> = {
      'US': 'us',
      'CA': 'us',
      'MX': 'us',
      'DE': 'eu',
      'FR': 'eu',
      'IT': 'eu',
      'ES': 'eu',
      'NL': 'eu',
      'UK': 'uk',
      'GB': 'uk',
      'JP': 'asia',
      'CN': 'asia',
      'SG': 'asia',
      'IN': 'asia',
      'AU': 'asia',
      'NZ': 'asia',
    };

    const corridorKey = corridorMap[country] || 'international';
    return this.corridors[corridorKey];
  }

  /**
   * Generate tracking number
   */
  private generateTrackingNumber(country: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INTL-${country.toUpperCase()}-${timestamp}-${random}`;
  }

  /**
   * Get payment status
   */
  getPaymentStatus(paymentId: string): InternationalPaymentResponse | null {
    return this.payments.get(paymentId) || null;
  }

  /**
   * List recipients
   */
  listRecipients(): InternationalRecipient[] {
    return Array.from(this.recipients.values());
  }

  /**
   * Get supported corridors
   */
  getSupportedCorridors() {
    return Object.entries(this.corridors).map(([key, value]) => ({
      corridor: key,
      ...value,
    }));
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): Array<{ code: string; rate: number }> {
    return Object.entries(this.exchangeRates).map(([code, rate]) => ({
      code,
      rate,
    }));
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const allPayments = Array.from(this.payments.values());
    const completedPayments = allPayments.filter(p => p.status === 'completed');

    return {
      totalPayments: allPayments.length,
      completedPayments: completedPayments.length,
      totalVolumeSent: allPayments.reduce((sum, p) => sum + p.amountSent, 0),
      totalVolumeReceived: allPayments.reduce((sum, p) => sum + p.amountReceived, 0),
      totalFees: allPayments.reduce((sum, p) => sum + p.fee, 0),
      averageProcessingTime: this.getAverageProcessingTime(completedPayments),
      destinationBreakdown: this.getDestinationBreakdown(allPayments),
      methodBreakdown: this.getMethodBreakdown(allPayments),
    };
  }

  private getAverageProcessingTime(payments: InternationalPaymentResponse[]): number {
    if (payments.length === 0) return 0;

    const totalTime = payments.reduce((sum, p) => {
      return sum + (p.completedAt! - p.createdAt);
    }, 0);

    return Math.round(totalTime / payments.length);
  }

  private getDestinationBreakdown(payments: InternationalPaymentResponse[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    payments.forEach(payment => {
      breakdown[payment.destination] = (breakdown[payment.destination] || 0) + 1;
    });

    return breakdown;
  }

  private getMethodBreakdown(payments: InternationalPaymentResponse[]): Record<string, number> {
    const breakdown: Record<string, number> = {};

    payments.forEach(payment => {
      breakdown[payment.paymentMethod] = (breakdown[payment.paymentMethod] || 0) + 1;
    });

    return breakdown;
  }
}

export const internationalPaymentService = new InternationalPaymentService();
