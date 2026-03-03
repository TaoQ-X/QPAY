/**
 * Q Pay - Israel Payment Module
 * Handles Israeli payment methods, local banks, and compliance
 */

export type IsraeliPaymentMethod = 
  | 'bank_transfer'
  | 'bit'
  | 'credit_card'
  | 'crypto';

export interface IsraeliBank {
  id: string;
  name: string;
  hebrewName: string;
  code: string;
  swiftCode: string;
  supportedMethods: IsraeliPaymentMethod[];
  settlementTime: number; // In minutes
  processingFee: number; // Percentage
}

export interface BitPayment {
  id: string;
  phoneNumber: string;
  amount: number;
  description: string;
  status: 'pending' | 'confirmed' | 'failed';
  transactionId?: string;
  createdAt: number;
  processedAt?: number;
}

export interface IsraeliComplianceInfo {
  businessId: string; // Mispar Zihuy Yishuv
  idNumber: string;
  businessType: 'yachid' | 'partnership' | 'company'; // Individual, Partnership, Company
  registeredName: string;
  taxApproval: boolean;
  kyb_verified: boolean;
}

export interface IsraeliPaymentRequest {
  amount: number; // In ILS or converted to ILS
  currency: string; // Original currency
  method: IsraeliPaymentMethod;
  bankId?: string;
  description: string;
  companySize: 'small' | 'medium' | 'large';
  metadata?: Record<string, any>;
}

export interface IsraeliPaymentResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: number;
  currency: string;
  method: IsraeliPaymentMethod;
  bank?: string;
  fee: number;
  netAmount: number;
  createdAt: number;
  processedAt?: number;
  settlementDate?: number;
  referenceNumber: string;
  bankTransactionId?: string;
}

class IsraelPaymentProcessor {
  // Israeli Banks Registry
  private banks: Map<string, IsraeliBank> = new Map([
    ['bank_of_israel', {
      id: 'bank_of_israel',
      name: 'Bank of Israel',
      hebrewName: 'בנק ישראל',
      code: '790',
      swiftCode: 'BKISIL23',
      supportedMethods: ['bank_transfer', 'crypto'],
      settlementTime: 120,
      processingFee: 0.5,
    }],
    ['leumi', {
      id: 'leumi',
      name: 'Bank Leumi',
      hebrewName: 'בנק לאומי',
      code: '010',
      swiftCode: 'LOISLLIT',
      supportedMethods: ['bank_transfer', 'credit_card', 'bit'],
      settlementTime: 180,
      processingFee: 0.75,
    }],
    ['hapoalim', {
      id: 'hapoalim',
      name: 'Bank Hapoalim',
      hebrewName: 'בנק הפועלים',
      code: '012',
      swiftCode: 'POALILTA',
      supportedMethods: ['bank_transfer', 'credit_card', 'bit'],
      settlementTime: 180,
      processingFee: 0.75,
    }],
    ['mizrahi', {
      id: 'mizrahi',
      name: 'Mizrahi Tefahot Bank',
      hebrewName: 'בנק מזרחי טפחות',
      code: '020',
      swiftCode: 'MISRIL22',
      supportedMethods: ['bank_transfer', 'credit_card'],
      settlementTime: 240,
      processingFee: 1.0,
    }],
    ['discount_bank', {
      id: 'discount_bank',
      name: 'Discount Bank',
      hebrewName: 'בנק דיסקונט',
      code: '011',
      swiftCode: 'DISCIL22',
      supportedMethods: ['bank_transfer', 'credit_card'],
      settlementTime: 240,
      processingFee: 1.0,
    }],
  ]);

  private payments: Map<string, IsraeliPaymentResponse> = new Map();
  private complianceRecords: Map<string, IsraeliComplianceInfo> = new Map();
  private bitPayments: Map<string, BitPayment> = new Map();

  /**
   * Process an Israeli payment
   */
  async processPayment(
    request: IsraeliPaymentRequest
  ): Promise<IsraeliPaymentResponse> {
    // Validate amount
    if (request.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Convert to ILS if needed
    const ilsAmount = await this.convertToILS(request.amount, request.currency);

    // Calculate fee based on company size
    const fee = this.calculateFee(ilsAmount, request.method, request.companySize);

    // Create payment record
    const paymentId = `isr_${Math.random().toString(36).substring(2, 9)}`;
    const referenceNumber = this.generateReferenceNumber();

    const payment: IsraeliPaymentResponse = {
      id: paymentId,
      status: 'pending',
      amount: ilsAmount,
      currency: 'ILS',
      method: request.method,
      fee,
      netAmount: ilsAmount - fee,
      createdAt: Math.floor(Date.now() / 1000),
      referenceNumber,
    };

    // Process based on payment method
    switch (request.method) {
      case 'bank_transfer':
        await this.processBankTransfer(payment, request);
        break;
      case 'bit':
        await this.processBitPayment(payment, request);
        break;
      case 'credit_card':
        await this.processCreditCard(payment, request);
        break;
      case 'crypto':
        await this.processCryptoPayment(payment, request);
        break;
    }

    this.payments.set(paymentId, payment);
    return payment;
  }

  /**
   * Process bank transfer (wire transfer)
   */
  private async processBankTransfer(
    payment: IsraeliPaymentResponse,
    request: IsraeliPaymentRequest
  ): Promise<void> {
    const bank = this.banks.get(request.bankId || 'leumi');
    if (!bank) {
      throw new Error('Invalid bank selection');
    }

    payment.bank = bank.name;
    payment.status = 'processing';

    // Set settlement date based on bank
    const settlementMinutes = bank.settlementTime;
    payment.settlementDate = Math.floor(Date.now() / 1000) + (settlementMinutes * 60);

    // Simulate processing
    setTimeout(() => {
      payment.status = 'completed';
      payment.processedAt = Math.floor(Date.now() / 1000);
      payment.bankTransactionId = this.generateBankTransactionId();
    }, settlementMinutes * 1000);
  }

  /**
   * Process Bit payment (Israeli mobile payment system)
   */
  private async processBitPayment(
    payment: IsraeliPaymentResponse,
    request: IsraeliPaymentRequest
  ): Promise<void> {
    const bitPaymentId = `bit_${Math.random().toString(36).substring(2, 9)}`;

    const bitPayment: BitPayment = {
      id: bitPaymentId,
      phoneNumber: request.metadata?.phoneNumber || '+972-XX-XXX-XXXX',
      amount: payment.amount,
      description: request.description,
      status: 'pending',
      createdAt: Math.floor(Date.now() / 1000),
    };

    this.bitPayments.set(bitPaymentId, bitPayment);
    payment.status = 'processing';

    // Bit payments are typically settled within 1-2 minutes
    setTimeout(() => {
      bitPayment.status = 'confirmed';
      bitPayment.transactionId = this.generateBitTransactionId();
      bitPayment.processedAt = Math.floor(Date.now() / 1000);

      payment.status = 'completed';
      payment.processedAt = Math.floor(Date.now() / 1000);
      payment.settlementDate = Math.floor(Date.now() / 1000) + 60; // Settle in 1 minute
    }, 2000);
  }

  /**
   * Process credit card payment
   */
  private async processCreditCard(
    payment: IsraeliPaymentResponse,
    request: IsraeliPaymentRequest
  ): Promise<void> {
    payment.bank = 'Credit Card Processing';
    payment.status = 'processing';

    // Credit card processing typically immediate or within minutes
    payment.settlementDate = Math.floor(Date.now() / 1000) + 300; // 5 minutes

    setTimeout(() => {
      payment.status = 'completed';
      payment.processedAt = Math.floor(Date.now() / 1000);
      payment.bankTransactionId = this.generateBankTransactionId();
    }, 5000);
  }

  /**
   * Process crypto payment
   */
  private async processCryptoPayment(
    payment: IsraeliPaymentResponse,
    request: IsraeliPaymentRequest
  ): Promise<void> {
    payment.bank = 'Blockchain Network';
    payment.status = 'processing';

    // Crypto settlement depends on blockchain confirmation
    payment.settlementDate = Math.floor(Date.now() / 1000) + 1800; // 30 minutes average

    setTimeout(() => {
      payment.status = 'completed';
      payment.processedAt = Math.floor(Date.now() / 1000);
      payment.bankTransactionId = `0x${Math.random().toString(16).substring(2)}`; // Blockchain hash
    }, 30000);
  }

  /**
   * Calculate payment fee based on method and company size
   */
  private calculateFee(
    amount: number,
    method: IsraeliPaymentMethod,
    companySize: 'small' | 'medium' | 'large'
  ): number {
    const baseFees: Record<IsraeliPaymentMethod, number> = {
      bank_transfer: 0.5, // 0.5%
      bit: 0.3, // 0.3% (Israeli payment system)
      credit_card: 2.0, // 2.0%
      crypto: 0.0, // 0% - no fees for crypto
    };

    const companyDiscounts: Record<string, number> = {
      small: 1.0, // No discount
      medium: 0.8, // 20% discount
      large: 0.6, // 40% discount
    };

    const basePercentage = baseFees[method];
    const discount = companyDiscounts[companySize];
    const feePercentage = basePercentage * discount;

    return Math.ceil((amount * feePercentage) / 100);
  }

  /**
   * Convert currency to ILS
   */
  private async convertToILS(amount: number, currency: string): Promise<number> {
    // Mock exchange rates (in production, use real-time rates)
    const exchangeRates: Record<string, number> = {
      'ILS': 1.0,
      'USD': 3.75, // Approximate
      'EUR': 4.15,
      'GBP': 4.80,
      'BTC': 156250, // Very approximate
      'ETH': 9375,
      'USDC': 3.75,
    };

    const rate = exchangeRates[currency] || 1.0;
    return Math.round(amount * rate * 100) / 100;
  }

  /**
   * Verify KYB (Know Your Business) for Israeli companies
   */
  async verifyKYB(complianceInfo: IsraeliComplianceInfo): Promise<boolean> {
    // In production, integrate with:
    // - Israel Tax Authority (Misrad HaMisim)
    // - Companies Registrar (Teum HaTaasukim)
    // - Bank of Israel

    const isValid = 
      complianceInfo.businessId.length >= 8 &&
      complianceInfo.idNumber.length >= 9 &&
      ['yachid', 'partnership', 'company'].includes(complianceInfo.businessType);

    if (isValid) {
      complianceInfo.kyb_verified = true;
      this.complianceRecords.set(complianceInfo.businessId, complianceInfo);
    }

    return isValid;
  }

  /**
   * Get available banks for Israeli businesses
   */
  getAvailableBanks(): Omit<IsraeliBank, 'swiftCode'>[] {
    return Array.from(this.banks.values()).map(({ swiftCode, ...rest }) => rest);
  }

  /**
   * Get payment status
   */
  getPaymentStatus(paymentId: string): IsraeliPaymentResponse | null {
    return this.payments.get(paymentId) || null;
  }

  /**
   * Generate reference number for audit
   */
  private generateReferenceNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ISR-${timestamp}-${random}`;
  }

  /**
   * Generate bank transaction ID
   */
  private generateBankTransactionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate Bit transaction ID
   */
  private generateBitTransactionId(): string {
    return `BIT${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
  }

  /**
   * Get statistics for Israeli operations
   */
  getStatistics() {
    const allPayments = Array.from(this.payments.values());

    return {
      totalPayments: allPayments.length,
      completedPayments: allPayments.filter(p => p.status === 'completed').length,
      totalVolume: allPayments.reduce((sum, p) => sum + p.amount, 0),
      totalFees: allPayments.reduce((sum, p) => sum + p.fee, 0),
      averageProcessingTime: this.calculateAverageProcessingTime(),
      methodBreakdown: this.getMethodBreakdown(),
      bankBreakdown: this.getBankBreakdown(),
    };
  }

  private calculateAverageProcessingTime(): number {
    const completedPayments = Array.from(this.payments.values()).filter(
      p => p.status === 'completed' && p.processedAt
    );

    if (completedPayments.length === 0) return 0;

    const totalTime = completedPayments.reduce((sum, p) => {
      return sum + (p.processedAt! - p.createdAt);
    }, 0);

    return Math.round(totalTime / completedPayments.length);
  }

  private getMethodBreakdown(): Record<IsraeliPaymentMethod, number> {
    const breakdown: Record<IsraeliPaymentMethod, number> = {
      bank_transfer: 0,
      bit: 0,
      credit_card: 0,
      crypto: 0,
    };

    this.payments.forEach(payment => {
      breakdown[payment.method]++;
    });

    return breakdown;
  }

  private getBankBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    this.payments.forEach(payment => {
      if (payment.bank) {
        breakdown[payment.bank] = (breakdown[payment.bank] || 0) + 1;
      }
    });

    return breakdown;
  }
}

export const israelPaymentProcessor = new IsraelPaymentProcessor();
