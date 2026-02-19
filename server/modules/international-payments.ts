// International Payment Methods & Multi-Currency Support for Q Pay
// Supports global payment processing like American Express, Visa, Mastercard, and regional methods

import crypto from "crypto";

// ============= Types & Interfaces =============

export type CardNetwork =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb";
export type RegionalPaymentMethod =
  | "sepa_debit"
  | "ideal"
  | "giropay"
  | "eps"
  | "bancontact"
  | "wechat_pay"
  | "alipay"
  | "promptpay"
  | "paynow"
  | "fpx"
  | "upi"
  | "boleto"
  | "pix"
  | "mercadopago"
  | "bang_kwang"
  | "truemoney";

export type CurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CHF"
  | "CAD"
  | "AUD"
  | "NZD"
  | "CNY"
  | "INR"
  | "BRL"
  | "MXN"
  | "SGD"
  | "HKD"
  | "NOK"
  | "SEK"
  | "DKK"
  | "PLN"
  | "CZK"
  | "HUF"
  | "RON"
  | "BGN"
  | "HRK"
  | "ILS"
  | "AED"
  | "SAR"
  | "QAR"
  | "KWD"
  | "BHD"
  | "OMR"
  | "JOD"
  | "EGP"
  | "TRY"
  | "RUB"
  | "UAH"
  | "KZT"
  | "ZAR"
  | "NGN"
  | "KES"
  | "GHS"
  | "IDR"
  | "MYR"
  | "THB"
  | "VND"
  | "PKR";

export interface AmexCard {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  businessName?: string;
  cardType: "personal" | "corporate";
}

export interface InternationalCard {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  network: CardNetwork;
  country: string;
}

export interface RegionalPayment {
  method: RegionalPaymentMethod;
  currency: CurrencyCode;
  amount: number;
  customerId: string;
  country: string;
  bankCode?: string;
  accountNumber?: string;
  mobileNumber?: string;
}

export interface ExchangeRate {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  timestamp: Date;
  source: "live" | "cached";
  expiresAt: Date;
}

export interface MultiCurrencyTransaction {
  id: string;
  businessId: string;
  originalAmount: number;
  originalCurrency: CurrencyCode;
  settlementAmount: number;
  settlementCurrency: CurrencyCode;
  exchangeRate: number;
  cardNetwork: CardNetwork | RegionalPaymentMethod;
  processingFee: number;
  internationalFee: number;
  totalFee: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

export interface CardNetworkConfig {
  network: CardNetwork;
  minAmount: number;
  maxAmount: number;
  processingFeePercent: number;
  internationalFeePercent: number;
  supportedCurrencies: CurrencyCode[];
  requiresAVS: boolean;
  requiresCSC: boolean;
  supportsRecurring: boolean;
  supportsDispute: boolean;
  disputeWindow: number; // days
  chargebackProtection: boolean;
  fraudToolsLevel: "basic" | "advanced" | "premium";
}

export interface RegionalMethodConfig {
  method: RegionalPaymentMethod;
  countries: string[];
  currencies: CurrencyCode[];
  processingFeePercent: number;
  minimumAmount: number;
  maximumAmount: number;
  settlementTime: number; // days
  supportsRecurring: boolean;
  requiresVerification: boolean;
  verificationDetails?: string;
}

// ============= Multi-Currency & Exchange Rate Service =============

export class MultiCurrencyService {
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private rateCache: Map<string, { rate: number; expiresAt: Date }> =
    new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Simulated real-time exchange rates (in production, use API like XE, Fixer, etc.)
  private baseRates: Record<CurrencyCode, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    CHF: 0.88,
    CAD: 1.36,
    AUD: 1.53,
    NZD: 1.65,
    CNY: 7.24,
    INR: 83.12,
    BRL: 4.97,
    MXN: 17.05,
    SGD: 1.34,
    HKD: 7.81,
    NOK: 10.45,
    SEK: 10.53,
    DKK: 6.87,
    PLN: 3.97,
    CZK: 24.35,
    HUF: 360.5,
    RON: 4.58,
    BGN: 1.8,
    HRK: 6.85,
    ILS: 3.65,
    AED: 3.67,
    SAR: 3.75,
    QAR: 3.64,
    KWD: 0.31,
    BHD: 0.38,
    OMR: 0.38,
    JOD: 0.71,
    EGP: 30.65,
    TRY: 33.5,
    RUB: 101.2,
    UAH: 40.35,
    KZT: 444.5,
    ZAR: 18.95,
    NGN: 1545.5,
    KES: 130.5,
    GHS: 13.2,
    IDR: 16000,
    MYR: 4.75,
    THB: 36.5,
    VND: 24400,
    PKR: 278.5,
  };

  getExchangeRate(
    from: CurrencyCode,
    to: CurrencyCode
  ): { rate: number; fromBase: number; toBase: number } {
    if (from === to) return { rate: 1, fromBase: 1, toBase: 1 };

    const cacheKey = `${from}_${to}`;
    const cached = this.rateCache.get(cacheKey);

    if (cached && cached.expiresAt > new Date()) {
      return { rate: cached.rate, fromBase: this.baseRates[from], toBase: this.baseRates[to] };
    }

    const fromRate = this.baseRates[from] || 1;
    const toRate = this.baseRates[to] || 1;
    const rate = toRate / fromRate;

    // Add small variance to simulate real market movement
    const variance = (Math.random() - 0.5) * 0.002;
    const finalRate = rate * (1 + variance);

    this.rateCache.set(cacheKey, {
      rate: finalRate,
      expiresAt: new Date(Date.now() + this.CACHE_DURATION),
    });

    return { rate: finalRate, fromBase: fromRate, toBase: toRate };
  }

  convertCurrency(
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode
  ): { amount: number; rate: number; timestamp: Date } {
    const { rate } = this.getExchangeRate(from, to);
    return {
      amount: Math.round(amount * rate * 100) / 100,
      rate,
      timestamp: new Date(),
    };
  }

  calculateTotalWithFees(
    amount: number,
    currency: CurrencyCode,
    processingFeePercent: number,
    internationalFeePercent: number
  ): { subtotal: number; processingFee: number; internationalFee: number; total: number } {
    const processingFee = Math.round(amount * (processingFeePercent / 100));
    const internationalFee = Math.round(amount * (internationalFeePercent / 100));
    const total = amount + processingFee + internationalFee;

    return {
      subtotal: amount,
      processingFee,
      internationalFee,
      total,
    };
  }
}

// ============= International Card Processing =============

export class InternationalCardProcessor {
  private cardConfigs: Map<CardNetwork, CardNetworkConfig> = new Map();
  private tokenizedCards: Map<string, InternationalCard> = new Map();

  constructor() {
    this.initializeCardNetworks();
  }

  private initializeCardNetworks(): void {
    const configs: CardNetworkConfig[] = [
      {
        network: "visa",
        minAmount: 1,
        maxAmount: 999999999,
        processingFeePercent: 1.29,
        internationalFeePercent: 2.5,
        supportedCurrencies: [
          "USD",
          "EUR",
          "GBP",
          "JPY",
          "CHF",
          "CAD",
          "AUD",
          "CNY",
          "INR",
          "BRL",
          "MXN",
          "SGD",
          "HKD",
        ],
        requiresAVS: true,
        requiresCSC: true,
        supportsRecurring: true,
        supportsDispute: true,
        disputeWindow: 120,
        chargebackProtection: true,
        fraudToolsLevel: "advanced",
      },
      {
        network: "mastercard",
        minAmount: 1,
        maxAmount: 999999999,
        processingFeePercent: 1.35,
        internationalFeePercent: 2.5,
        supportedCurrencies: [
          "USD",
          "EUR",
          "GBP",
          "JPY",
          "CHF",
          "CAD",
          "AUD",
          "CNY",
          "INR",
          "BRL",
          "MXN",
          "SGD",
          "HKD",
        ],
        requiresAVS: true,
        requiresCSC: true,
        supportsRecurring: true,
        supportsDispute: true,
        disputeWindow: 120,
        chargebackProtection: true,
        fraudToolsLevel: "advanced",
      },
      {
        network: "amex",
        minAmount: 100,
        maxAmount: 999999999,
        processingFeePercent: 2.9,
        internationalFeePercent: 2.0,
        supportedCurrencies: ["USD", "EUR", "GBP", "CHF", "AUD"],
        requiresAVS: true,
        requiresCSC: true,
        supportsRecurring: true,
        supportsDispute: true,
        disputeWindow: 180,
        chargebackProtection: true,
        fraudToolsLevel: "premium",
      },
      {
        network: "discover",
        minAmount: 1,
        maxAmount: 999999999,
        processingFeePercent: 1.56,
        internationalFeePercent: 2.7,
        supportedCurrencies: ["USD", "EUR", "GBP", "CHF", "CAD", "AUD"],
        requiresAVS: true,
        requiresCSC: true,
        supportsRecurring: false,
        supportsDispute: true,
        disputeWindow: 120,
        chargebackProtection: true,
        fraudToolsLevel: "advanced",
      },
      {
        network: "diners",
        minAmount: 50,
        maxAmount: 999999999,
        processingFeePercent: 2.0,
        internationalFeePercent: 3.0,
        supportedCurrencies: ["USD", "EUR", "GBP", "CHF", "AUD"],
        requiresAVS: true,
        requiresCSC: true,
        supportsRecurring: true,
        supportsDispute: true,
        disputeWindow: 120,
        chargebackProtection: false,
        fraudToolsLevel: "basic",
      },
      {
        network: "jcb",
        minAmount: 1,
        maxAmount: 999999999,
        processingFeePercent: 1.79,
        internationalFeePercent: 2.5,
        supportedCurrencies: ["USD", "EUR", "JPY", "CNY", "HKD", "SGD"],
        requiresAVS: false,
        requiresCSC: true,
        supportsRecurring: true,
        supportsDispute: true,
        disputeWindow: 120,
        chargebackProtection: true,
        fraudToolsLevel: "advanced",
      },
    ];

    configs.forEach((config) => this.cardConfigs.set(config.network, config));
  }

  processAmexCard(amexCard: AmexCard): {
    token: string;
    cardType: "corporate" | "personal";
    benefits: string[];
  } {
    const token = `tok_amex_${crypto.randomBytes(16).toString("hex")}`;
    this.tokenizedCards.set(token, {
      cardNumber: amexCard.cardNumber,
      expiryDate: amexCard.expiryDate,
      cvv: amexCard.cvv,
      cardholderName: amexCard.cardholderName,
      network: "amex",
      country: "US",
    });

    const benefits =
      amexCard.cardType === "corporate"
        ? [
            "Expense Management",
            "Multi-User Access",
            "Earnings Multiplier",
            "Extended Payment Terms",
            "Concierge Services",
          ]
        : [
            "Cashback Rewards",
            "Travel Insurance",
            "Purchase Protection",
            "Extended Warranty",
          ];

    return {
      token,
      cardType: amexCard.cardType,
      benefits,
    };
  }

  getCardNetworkInfo(network: CardNetwork): CardNetworkConfig | null {
    return this.cardConfigs.get(network) || null;
  }

  validateCard(
    cardNumber: string,
    network: CardNetwork
  ): { valid: boolean; reason?: string } {
    // Luhn algorithm
    const digits = cardNumber.replace(/\D/g, "");
    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    const valid = sum % 10 === 0;

    // Check length based on network
    const lengths: Record<CardNetwork, number[]> = {
      visa: [13, 16, 19],
      mastercard: [16],
      amex: [15],
      discover: [16],
      diners: [14],
      jcb: [16],
    };

    if (
      !lengths[network].includes(digits.length) ||
      !valid
    ) {
      return {
        valid: false,
        reason: "Invalid card number for network",
      };
    }

    return { valid: true };
  }

  calculateProcessingCost(
    amount: number,
    network: CardNetwork,
    isInternational: boolean
  ): {
    processingFee: number;
    internationalFee: number;
    totalCost: number;
  } | null {
    const config = this.cardConfigs.get(network);
    if (!config) return null;

    const processingFee = Math.round(
      amount * (config.processingFeePercent / 100)
    );
    const internationalFee = isInternational
      ? Math.round(amount * (config.internationalFeePercent / 100))
      : 0;

    return {
      processingFee,
      internationalFee,
      totalCost: processingFee + internationalFee,
    };
  }
}

// ============= Regional Payment Methods =============

export class RegionalPaymentMethodManager {
  private methodConfigs: Map<RegionalPaymentMethod, RegionalMethodConfig> =
    new Map();

  constructor() {
    this.initializeRegionalMethods();
  }

  private initializeRegionalMethods(): void {
    const configs: RegionalMethodConfig[] = [
      {
        method: "sepa_debit",
        countries: ["AT", "BE", "DE", "ES", "FR", "IT", "NL", "PT"],
        currencies: ["EUR"],
        processingFeePercent: 0.5,
        minimumAmount: 100,
        maximumAmount: 999999999,
        settlementTime: 1,
        supportsRecurring: true,
        requiresVerification: true,
        verificationDetails: "Bank account verification required",
      },
      {
        method: "ideal",
        countries: ["NL"],
        currencies: ["EUR"],
        processingFeePercent: 0.8,
        minimumAmount: 100,
        maximumAmount: 100000,
        settlementTime: 0,
        supportsRecurring: false,
        requiresVerification: false,
      },
      {
        method: "giropay",
        countries: ["DE", "AT"],
        currencies: ["EUR"],
        processingFeePercent: 0.7,
        minimumAmount: 100,
        maximumAmount: 999999,
        settlementTime: 1,
        supportsRecurring: false,
        requiresVerification: false,
      },
      {
        method: "wechat_pay",
        countries: ["CN", "HK", "TW", "MO"],
        currencies: ["CNY", "HKD"],
        processingFeePercent: 1.5,
        minimumAmount: 100,
        maximumAmount: 500000,
        settlementTime: 1,
        supportsRecurring: true,
        requiresVerification: true,
        verificationDetails: "WeChat account verification",
      },
      {
        method: "alipay",
        countries: ["CN", "HK", "SG", "MY", "TH", "PH"],
        currencies: ["CNY", "HKD", "SGD", "MYR", "THB", "PHP"],
        processingFeePercent: 1.5,
        minimumAmount: 100,
        maximumAmount: 500000,
        settlementTime: 1,
        supportsRecurring: true,
        requiresVerification: true,
        verificationDetails: "Alipay account verification",
      },
      {
        method: "promptpay",
        countries: ["TH"],
        currencies: ["THB"],
        processingFeePercent: 1.0,
        minimumAmount: 100,
        maximumAmount: 999999,
        settlementTime: 0,
        supportsRecurring: true,
        requiresVerification: true,
        verificationDetails: "Thai mobile number verification",
      },
      {
        method: "paynow",
        countries: ["SG"],
        currencies: ["SGD"],
        processingFeePercent: 0.5,
        minimumAmount: 100,
        maximumAmount: 999999,
        settlementTime: 0,
        supportsRecurring: false,
        requiresVerification: false,
      },
      {
        method: "fpx",
        countries: ["MY"],
        currencies: ["MYR"],
        processingFeePercent: 0.8,
        minimumAmount: 100,
        maximumAmount: 999999,
        settlementTime: 1,
        supportsRecurring: true,
        requiresVerification: false,
      },
      {
        method: "upi",
        countries: ["IN"],
        currencies: ["INR"],
        processingFeePercent: 1.0,
        minimumAmount: 100,
        maximumAmount: 999999,
        settlementTime: 0,
        supportsRecurring: false,
        requiresVerification: true,
        verificationDetails: "UPI ID verification",
      },
      {
        method: "boleto",
        countries: ["BR"],
        currencies: ["BRL"],
        processingFeePercent: 1.5,
        minimumAmount: 100,
        maximumAmount: 999999,
        settlementTime: 3,
        supportsRecurring: false,
        requiresVerification: false,
      },
      {
        method: "pix",
        countries: ["BR"],
        currencies: ["BRL"],
        processingFeePercent: 1.0,
        minimumAmount: 100,
        maximumAmount: 999999,
        settlementTime: 0,
        supportsRecurring: true,
        requiresVerification: true,
        verificationDetails: "CPF/CNPJ verification",
      },
      {
        method: "mercadopago",
        countries: ["AR", "BR", "CL", "CO", "MX", "PE", "UY", "VE"],
        currencies: ["ARS", "BRL", "CLP", "COP", "MXN", "PEN", "UYU", "VEF"],
        processingFeePercent: 2.0,
        minimumAmount: 100,
        maximumAmount: 999999,
        settlementTime: 1,
        supportsRecurring: true,
        requiresVerification: true,
        verificationDetails: "MercadoPago account verification",
      },
    ];

    configs.forEach((config) => this.methodConfigs.set(config.method, config));
  }

  getMethodConfig(
    method: RegionalPaymentMethod
  ): RegionalMethodConfig | null {
    return this.methodConfigs.get(method) || null;
  }

  getAvailableMethodsForCountry(
    country: string
  ): RegionalPaymentMethod[] {
    const available: RegionalPaymentMethod[] = [];
    this.methodConfigs.forEach((config, method) => {
      if (config.countries.includes(country)) {
        available.push(method);
      }
    });
    return available;
  }

  getAvailableMethodsForCurrency(
    currency: CurrencyCode
  ): RegionalPaymentMethod[] {
    const available: RegionalPaymentMethod[] = [];
    this.methodConfigs.forEach((config, method) => {
      if (config.currencies.includes(currency)) {
        available.push(method);
      }
    });
    return available;
  }

  processRegionalPayment(
    payment: RegionalPayment
  ): { transactionId: string; status: "pending" | "completed"; estimatedSettlement: Date } | null {
    const config = this.getMethodConfig(payment.method);
    if (!config) return null;

    if (!config.countries.includes(payment.country)) {
      return null;
    }

    const transactionId = `txn_${payment.method}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const estimatedSettlement = new Date(
      Date.now() + config.settlementTime * 24 * 60 * 60 * 1000
    );

    return {
      transactionId,
      status: config.settlementTime === 0 ? "completed" : "pending",
      estimatedSettlement,
    };
  }
}

// ============= Smart Transaction Router =============

export class TransactionRouter {
  private internationalCardProcessor: InternationalCardProcessor;
  private regionalMethodManager: RegionalPaymentMethodManager;
  private multiCurrencyService: MultiCurrencyService;

  constructor() {
    this.internationalCardProcessor = new InternationalCardProcessor();
    this.regionalMethodManager = new RegionalPaymentMethodManager();
    this.multiCurrencyService = new MultiCurrencyService();
  }

  recommendPaymentMethod(
    amount: number,
    merchantCountry: string,
    customerCountry: string,
    customerCurrency: CurrencyCode,
    preferredMethods?: (CardNetwork | RegionalPaymentMethod)[]
  ): {
    method: CardNetwork | RegionalPaymentMethod;
    estimatedFee: number;
    settlementTime: number;
    reason: string;
  }[] {
    const recommendations = [];

    // Get regional methods for customer's country
    const regionalMethods = this.regionalMethodManager.getAvailableMethodsForCountry(
      customerCountry
    );
    for (const method of regionalMethods) {
      const config = this.regionalMethodManager.getMethodConfig(method);
      if (!config) continue;

      if (
        amount >= config.minimumAmount &&
        amount <= config.maximumAmount
      ) {
        recommendations.push({
          method,
          estimatedFee: Math.round(amount * (config.processingFeePercent / 100)),
          settlementTime: config.settlementTime,
          reason: "Local payment method - best for customer",
        });
      }
    }

    // Get card networks
    const cardNetworks: CardNetwork[] = ["visa", "mastercard", "amex"];
    for (const network of cardNetworks) {
      const config = this.internationalCardProcessor.getCardNetworkInfo(
        network
      );
      if (!config) continue;

      if (
        amount >= config.minAmount &&
        amount <= config.maxAmount &&
        config.supportedCurrencies.includes(customerCurrency)
      ) {
        const isInternational = merchantCountry !== customerCountry;
        const costData = this.internationalCardProcessor.calculateProcessingCost(
          amount,
          network,
          isInternational
        );
        if (costData) {
          recommendations.push({
            method: network,
            estimatedFee: costData.totalCost,
            settlementTime: 1,
            reason: isInternational
              ? "International card - global coverage"
              : "Card payment - instant settlement",
          });
        }
      }
    }

    // Filter by preferred methods if provided
    if (preferredMethods && preferredMethods.length > 0) {
      return recommendations.filter((rec) =>
        preferredMethods.includes(rec.method)
      );
    }

    // Sort by fee (lowest first) and settlement time
    return recommendations.sort((a, b) => {
      if (a.estimatedFee !== b.estimatedFee) {
        return a.estimatedFee - b.estimatedFee;
      }
      return a.settlementTime - b.settlementTime;
    });
  }

  routeTransaction(
    transactionId: string,
    amount: number,
    fromCurrency: CurrencyCode,
    toCountry: string,
    toCurrency: CurrencyCode,
    preferredNetwork?: CardNetwork | RegionalPaymentMethod
  ): {
    routedTo: CardNetwork | RegionalPaymentMethod;
    convertedAmount: number;
    exchangeRate: number;
    totalFees: number;
    netAmount: number;
  } | null {
    let selectedMethod: CardNetwork | RegionalPaymentMethod | null = null;

    if (preferredNetwork) {
      selectedMethod = preferredNetwork;
    } else {
      // Auto-select best method
      const recs = this.recommendPaymentMethod(
        amount,
        "US",
        toCountry,
        toCurrency
      );
      if (recs.length > 0) {
        selectedMethod = recs[0].method;
      }
    }

    if (!selectedMethod) return null;

    // Convert currency
    const converted = this.multiCurrencyService.convertCurrency(
      amount,
      fromCurrency,
      toCurrency
    );

    // Calculate fees
    let totalFees = 0;
    if (
      selectedMethod === "visa" ||
      selectedMethod === "mastercard" ||
      selectedMethod === "amex" ||
      selectedMethod === "discover" ||
      selectedMethod === "diners" ||
      selectedMethod === "jcb"
    ) {
      const cardNetwork = selectedMethod as CardNetwork;
      const costData =
        this.internationalCardProcessor.calculateProcessingCost(
          converted.amount,
          cardNetwork,
          fromCurrency !== toCurrency
        );
      totalFees = costData?.totalCost || 0;
    } else {
      const config = this.regionalMethodManager.getMethodConfig(
        selectedMethod as RegionalPaymentMethod
      );
      totalFees = config
        ? Math.round(
            converted.amount * (config.processingFeePercent / 100)
          )
        : 0;
    }

    return {
      routedTo: selectedMethod,
      convertedAmount: converted.amount,
      exchangeRate: converted.rate,
      totalFees,
      netAmount: converted.amount - totalFees,
    };
  }
}

// ============= Export Main Service =============

export class InternationalPaymentService {
  public cardProcessor: InternationalCardProcessor;
  public regionalMethods: RegionalPaymentMethodManager;
  public multiCurrency: MultiCurrencyService;
  public router: TransactionRouter;

  constructor() {
    this.cardProcessor = new InternationalCardProcessor();
    this.regionalMethods = new RegionalPaymentMethodManager();
    this.multiCurrency = new MultiCurrencyService();
    this.router = new TransactionRouter();
  }

  getSupportedCountries(): string[] {
    const countries = new Set<string>();
    const configs = [
      "AT", "BE", "DE", "ES", "FR", "IT", "NL", "PT", // Europe
      "US", "CA", "MX", // North America
      "BR", "AR", "CL", "CO", "PE", // South America
      "CN", "HK", "SG", "MY", "TH", "PH", "IN", // Asia
      "AU", "NZ", // Oceania
      "AE", "SA", "IL", // Middle East
      "ZA", "KE", "NG", "GH", // Africa
    ];
    return configs;
  }

  getSystemCapabilities(): {
    cardNetworks: CardNetwork[];
    regionalMethods: RegionalPaymentMethod[];
    supportedCurrencies: CurrencyCode[];
    features: string[];
  } {
    return {
      cardNetworks: [
        "visa",
        "mastercard",
        "amex",
        "discover",
        "diners",
        "jcb",
      ],
      regionalMethods: [
        "sepa_debit",
        "ideal",
        "giropay",
        "eps",
        "bancontact",
        "wechat_pay",
        "alipay",
        "promptpay",
        "paynow",
        "fpx",
        "upi",
        "boleto",
        "pix",
        "mercadopago",
        "bang_kwang",
        "truemoney",
      ],
      supportedCurrencies: [
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "CHF",
        "CAD",
        "AUD",
        "NZD",
        "CNY",
        "INR",
        "BRL",
        "MXN",
        "SGD",
        "HKD",
        "NOK",
        "SEK",
        "DKK",
        "PLN",
        "CZK",
        "HUF",
        "RON",
        "BGN",
        "HRK",
        "ILS",
        "AED",
        "SAR",
        "QAR",
        "KWD",
        "BHD",
        "OMR",
        "JOD",
        "EGP",
        "TRY",
        "RUB",
        "UAH",
        "KZT",
        "ZAR",
        "NGN",
        "KES",
        "GHS",
        "IDR",
        "MYR",
        "THB",
        "VND",
        "PKR",
      ],
      features: [
        "Multi-currency support with real-time exchange rates",
        "American Express corporate & personal cards",
        "Visa & Mastercard global processing",
        "Regional payment methods (SEPA, iDEAL, WeChat, Alipay, etc.)",
        "Smart transaction routing",
        "PCI-DSS compliant card tokenization",
        "International dispute management",
        "Multi-language checkout",
        "Recurring billing in local methods",
        "Chargeback protection by network",
      ],
    };
  }
}
