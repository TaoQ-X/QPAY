// Dynamic Pricing & Tiered Merchant Accounts for Q Pay
// Enterprise-grade merchant management with volume-based pricing

export type MerchantTier = "startup" | "growth" | "enterprise" | "white_label";
export type PricingModel = "fixed" | "volume_based" | "usage_based" | "hybrid";

export interface MerchantAccount {
  id: string;
  businessId: string;
  tier: MerchantTier;
  monthlyVolume: number;
  monthlyTransactions: number;
  averageTransactionValue: number;
  baseFeePercent: number;
  internationalFeePercent: number;
  volumeDiscountPercent: number;
  customFeeGroups: Map<string, FeeGroup>;
  monthlyVolumeCap: number;
  chargebackLimit: number;
  status: "active" | "suspended" | "pending_upgrade" | "under_review";
  contractTermMonths: number;
  renewalDate: Date;
  customDomains: string[];
  apiKeysEnabled: number;
  dedicatedSupport: boolean;
  webhookRetries: number;
  fraudToolsLevel: "basic" | "advanced" | "premium";
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeGroup {
  name: string;
  cardNetworks: string[];
  processingFeePercent: number;
  internationalFeePercent: number;
  minTransactionAmount: number;
  maxTransactionAmount: number;
  currency: string;
  countries?: string[];
}

export interface TierConfig {
  tier: MerchantTier;
  monthlyVolumeLowerBound: number;
  monthlyVolumeUpperBound: number;
  baseFeePercent: number;
  internationalFeePercent: number;
  volumeDiscountPercentage: number;
  monthlyVolumeCap: number;
  transactionLimit: number;
  chargebackLimit: number;
  customFeeGroupsAllowed: number;
  webhookRetries: number;
  dedicatedSupportIncluded: boolean;
  fraudToolsLevel: "basic" | "advanced" | "premium";
  customDomainsAllowed: number;
  apiKeysAllowed: number;
  monthlyFeeCents: number; // Base monthly fee
  setupFeeCents: number;
  features: string[];
}

export interface VolumePricingTier {
  minVolume: number;
  maxVolume: number;
  feeReductionPercent: number;
  description: string;
}

export interface PricingStrategy {
  model: PricingModel;
  baseRate: number;
  volumeTiers: VolumePricingTier[];
  surgeMultiplier: number; // For high-volume periods
  regionalAdjustments: Map<string, number>; // Region -> fee adjustment
  networkAdjustments: Map<string, number>; // Network -> fee adjustment
  seasonalAdjustments: Map<number, number>; // Month -> multiplier
}

export interface DynamicPrice {
  basePrice: number;
  volumeDiscount: number;
  regionalAdjustment: number;
  networkAdjustment: number;
  seasonalAdjustment: number;
  surgeCharge: number;
  finalPrice: number;
  breakdown: {
    component: string;
    value: number;
  }[];
}

export interface MerchantMetrics {
  merchantId: string;
  dailyVolume: number;
  dailyTransactionCount: number;
  chargebackRate: number;
  disputeRate: number;
  refundRate: number;
  fraudDetectionRate: number;
  averageTransactionValue: number;
  successRate: number;
  currentTier: MerchantTier;
  recommendedTier: MerchantTier;
  potentialSavings: number;
}

export interface UpgradeOpportunity {
  currentTier: MerchantTier;
  suggestedTier: MerchantTier;
  monthlySavings: number;
  newFeatures: string[];
  upgradeDate: Date;
  contractTerm: number;
}

// ============= Tier Configuration =============

export class TierConfigManager {
  private tiers: Map<MerchantTier, TierConfig> = new Map();

  constructor() {
    this.initializeTiers();
  }

  private initializeTiers(): void {
    const configs: TierConfig[] = [
      {
        tier: "startup",
        monthlyVolumeLowerBound: 0,
        monthlyVolumeUpperBound: 50000,
        baseFeePercent: 2.9,
        internationalFeePercent: 3.5,
        volumeDiscountPercentage: 0,
        monthlyVolumeCap: 50000,
        transactionLimit: 10000,
        chargebackLimit: 10,
        customFeeGroupsAllowed: 0,
        webhookRetries: 3,
        dedicatedSupportIncluded: false,
        fraudToolsLevel: "basic",
        customDomainsAllowed: 0,
        apiKeysAllowed: 1,
        monthlyFeeCents: 0,
        setupFeeCents: 0,
        features: [
          "Email support",
          "Basic fraud detection",
          "Standard reporting",
          "API access",
          "Webhook support",
        ],
      },
      {
        tier: "growth",
        monthlyVolumeLowerBound: 50000,
        monthlyVolumeUpperBound: 500000,
        baseFeePercent: 2.5,
        internationalFeePercent: 3.0,
        volumeDiscountPercentage: 5,
        monthlyVolumeCap: 500000,
        transactionLimit: 100000,
        chargebackLimit: 20,
        customFeeGroupsAllowed: 3,
        webhookRetries: 5,
        dedicatedSupportIncluded: false,
        fraudToolsLevel: "advanced",
        customDomainsAllowed: 1,
        apiKeysAllowed: 5,
        monthlyFeeCents: 9900, // $99/month
        setupFeeCents: 0,
        features: [
          "Priority email & chat support",
          "Advanced fraud detection",
          "Advanced analytics",
          "Custom fee groups",
          "Settlement acceleration",
          "Chargeback management",
          "Webhook management",
          "API v2 access",
        ],
      },
      {
        tier: "enterprise",
        monthlyVolumeLowerBound: 500000,
        monthlyVolumeUpperBound: 10000000,
        baseFeePercent: 2.0,
        internationalFeePercent: 2.5,
        volumeDiscountPercentage: 10,
        monthlyVolumeCap: 10000000,
        transactionLimit: 1000000,
        chargebackLimit: 50,
        customFeeGroupsAllowed: 10,
        webhookRetries: 10,
        dedicatedSupportIncluded: true,
        fraudToolsLevel: "premium",
        customDomainsAllowed: 5,
        apiKeysAllowed: 50,
        monthlyFeeCents: 49900, // $499/month
        setupFeeCents: 0,
        features: [
          "24/7 dedicated account manager",
          "Premium fraud detection with ML",
          "Real-time analytics dashboard",
          "Custom fee groups",
          "Instant settlement option",
          "Chargeback insurance",
          "Dispute management",
          "Custom API endpoint",
          "White-label capabilities",
          "Multi-currency processing",
          "Advanced reporting",
          "Custom billing cycles",
        ],
      },
      {
        tier: "white_label",
        monthlyVolumeLowerBound: 1000000,
        monthlyVolumeUpperBound: Infinity,
        baseFeePercent: 1.5,
        internationalFeePercent: 2.0,
        volumeDiscountPercentage: 15,
        monthlyVolumeCap: Infinity,
        transactionLimit: Infinity,
        chargebackLimit: 100,
        customFeeGroupsAllowed: Infinity,
        webhookRetries: Infinity,
        dedicatedSupportIncluded: true,
        fraudToolsLevel: "premium",
        customDomainsAllowed: Infinity,
        apiKeysAllowed: Infinity,
        monthlyFeeCents: 0, // Custom pricing
        setupFeeCents: 100000, // $1000 setup
        features: [
          "Dedicated team",
          "Custom fraud rules",
          "White-label dashboard",
          "Custom branding",
          "Custom fee structures",
          "Instant settlement",
          "Premium fraud protection",
          "Guaranteed uptime SLA",
          "Custom integrations",
          "Priority feature requests",
          "Custom reporting",
          "Multi-region support",
          "Business intelligence tools",
          "Custom compliance setup",
        ],
      },
    ];

    configs.forEach((config) => this.tiers.set(config.tier, config));
  }

  getTierConfig(tier: MerchantTier): TierConfig | null {
    return this.tiers.get(tier) || null;
  }

  recommendTier(monthlyVolume: number): MerchantTier {
    for (const [tier, config] of this.tiers) {
      if (
        monthlyVolume >= config.monthlyVolumeLowerBound &&
        monthlyVolume <= config.monthlyVolumeUpperBound
      ) {
        return tier;
      }
    }
    return "white_label";
  }

  getAllTiers(): TierConfig[] {
    return Array.from(this.tiers.values());
  }
}

// ============= Dynamic Pricing Engine =============

export class DynamicPricingEngine {
  private strategies: Map<string, PricingStrategy> = new Map();
  private tierManager: TierConfigManager;

  constructor() {
    this.tierManager = new TierConfigManager();
    this.initializePricingStrategies();
  }

  private initializePricingStrategies(): void {
    // Volume-based pricing strategy
    const volumeStrategy: PricingStrategy = {
      model: "volume_based",
      baseRate: 2.9,
      volumeTiers: [
        {
          minVolume: 0,
          maxVolume: 50000,
          feeReductionPercent: 0,
          description: "Startup tier",
        },
        {
          minVolume: 50000,
          maxVolume: 200000,
          feeReductionPercent: 5,
          description: "Growth tier",
        },
        {
          minVolume: 200000,
          maxVolume: 500000,
          feeReductionPercent: 8,
          description: "Advanced tier",
        },
        {
          minVolume: 500000,
          maxVolume: 1000000,
          feeReductionPercent: 12,
          description: "Enterprise tier",
        },
        {
          minVolume: 1000000,
          maxVolume: Infinity,
          feeReductionPercent: 15,
          description: "Premium tier",
        },
      ],
      surgeMultiplier: 1.1, // 10% increase during peak times
      regionalAdjustments: new Map([
        ["US", 0],
        ["EU", 0.5],
        ["ASIA", 1.0],
        ["EMERGING", 1.5],
      ]),
      networkAdjustments: new Map([
        ["visa", 0],
        ["mastercard", 0.1],
        ["amex", 0.5],
        ["regional", -0.5],
      ]),
      seasonalAdjustments: new Map([
        [11, 1.15], // November (Black Friday)
        [12, 1.2], // December (holidays)
        [1, 1.05], // January (New Year)
      ]),
    };

    this.strategies.set("volume_based", volumeStrategy);
  }

  calculateDynamicPrice(
    baseAmount: number,
    merchantVolume: number,
    region: string,
    cardNetwork: string,
    currentMonth: number,
    surgeMode: boolean = false
  ): DynamicPrice {
    const strategy = this.strategies.get("volume_based");
    if (!strategy) {
      return {
        basePrice: baseAmount,
        volumeDiscount: 0,
        regionalAdjustment: 0,
        networkAdjustment: 0,
        seasonalAdjustment: 0,
        surgeCharge: 0,
        finalPrice: baseAmount,
        breakdown: [],
      };
    }

    const breakdown: { component: string; value: number }[] = [];

    // Volume discount
    let volumeDiscount = 0;
    for (const tier of strategy.volumeTiers) {
      if (
        merchantVolume >= tier.minVolume &&
        merchantVolume <= tier.maxVolume
      ) {
        volumeDiscount = Math.round(
          baseAmount * (tier.feeReductionPercent / 100)
        );
        breakdown.push({
          component: `Volume discount (${tier.description})`,
          value: -volumeDiscount,
        });
        break;
      }
    }

    // Regional adjustment
    const regionalFactor =
      strategy.regionalAdjustments.get(region) || 0;
    const regionalAdjustment = Math.round(
      (baseAmount - volumeDiscount) * (regionalFactor / 100)
    );
    if (regionalAdjustment !== 0) {
      breakdown.push({
        component: `Regional adjustment (${region})`,
        value: regionalAdjustment,
      });
    }

    // Network adjustment
    const networkFactor =
      strategy.networkAdjustments.get(cardNetwork) || 0;
    const networkAdjustment = Math.round(
      (baseAmount - volumeDiscount) * (networkFactor / 100)
    );
    if (networkAdjustment !== 0) {
      breakdown.push({
        component: `Network adjustment (${cardNetwork})`,
        value: networkAdjustment,
      });
    }

    // Seasonal adjustment
    const seasonalFactor =
      strategy.seasonalAdjustments.get(currentMonth) || 1.0;
    const seasonalAdjustment = Math.round(
      (baseAmount - volumeDiscount) * ((seasonalFactor - 1) * 100) / 100
    );
    if (seasonalAdjustment !== 0) {
      breakdown.push({
        component: `Seasonal adjustment (month ${currentMonth})`,
        value: seasonalAdjustment,
      });
    }

    // Surge charge
    let surgeCharge = 0;
    if (surgeMode) {
      surgeCharge = Math.round(
        baseAmount * ((strategy.surgeMultiplier - 1) * 100) / 100
      );
      breakdown.push({
        component: "Peak hour surge charge",
        value: surgeCharge,
      });
    }

    const finalPrice = Math.max(
      baseAmount -
        volumeDiscount +
        regionalAdjustment +
        networkAdjustment +
        seasonalAdjustment +
        surgeCharge,
      0
    );

    return {
      basePrice: baseAmount,
      volumeDiscount,
      regionalAdjustment,
      networkAdjustment,
      seasonalAdjustment,
      surgeCharge,
      finalPrice,
      breakdown,
    };
  }

  getVolumeTierInfo(merchantVolume: number): VolumePricingTier | null {
    const strategy = this.strategies.get("volume_based");
    if (!strategy) return null;

    for (const tier of strategy.volumeTiers) {
      if (
        merchantVolume >= tier.minVolume &&
        merchantVolume <= tier.maxVolume
      ) {
        return tier;
      }
    }
    return null;
  }

  getNextVolumeTierSavings(currentVolume: number): {
    nextTier: VolumePricingTier | null;
    volumeNeeded: number;
    potentialSavingsPercent: number;
  } {
    const strategy = this.strategies.get("volume_based");
    if (!strategy) {
      return {
        nextTier: null,
        volumeNeeded: 0,
        potentialSavingsPercent: 0,
      };
    }

    for (let i = 0; i < strategy.volumeTiers.length - 1; i++) {
      const currentTier = strategy.volumeTiers[i];
      if (
        currentVolume >= currentTier.minVolume &&
        currentVolume <= currentTier.maxVolume
      ) {
        const nextTier = strategy.volumeTiers[i + 1];
        return {
          nextTier,
          volumeNeeded: nextTier.minVolume - currentVolume,
          potentialSavingsPercent:
            nextTier.feeReductionPercent - currentTier.feeReductionPercent,
        };
      }
    }

    return {
      nextTier: null,
      volumeNeeded: 0,
      potentialSavingsPercent: 0,
    };
  }
}

// ============= Merchant Account Manager =============

export class MerchantAccountManager {
  private accounts: Map<string, MerchantAccount> = new Map();
  private tierManager: TierConfigManager;
  private pricingEngine: DynamicPricingEngine;

  constructor() {
    this.tierManager = new TierConfigManager();
    this.pricingEngine = new DynamicPricingEngine();
  }

  createAccount(
    businessId: string,
    initialTier: MerchantTier = "startup"
  ): MerchantAccount {
    const accountId = `merchant_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const tierConfig = this.tierManager.getTierConfig(initialTier);

    if (!tierConfig) {
      throw new Error(`Invalid tier: ${initialTier}`);
    }

    const account: MerchantAccount = {
      id: accountId,
      businessId,
      tier: initialTier,
      monthlyVolume: 0,
      monthlyTransactions: 0,
      averageTransactionValue: 0,
      baseFeePercent: tierConfig.baseFeePercent,
      internationalFeePercent: tierConfig.internationalFeePercent,
      volumeDiscountPercent: tierConfig.volumeDiscountPercentage,
      customFeeGroups: new Map(),
      monthlyVolumeCap: tierConfig.monthlyVolumeCap,
      chargebackLimit: tierConfig.chargebackLimit,
      status: "active",
      contractTermMonths: 12,
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      customDomains: [],
      apiKeysEnabled: tierConfig.apiKeysAllowed,
      dedicatedSupport: tierConfig.dedicatedSupportIncluded,
      webhookRetries: tierConfig.webhookRetries,
      fraudToolsLevel: tierConfig.fraudToolsLevel,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.accounts.set(accountId, account);
    return account;
  }

  getAccount(accountId: string): MerchantAccount | null {
    return this.accounts.get(accountId) || null;
  }

  addCustomFeeGroup(
    accountId: string,
    feeGroup: FeeGroup
  ): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    const tierConfig = this.tierManager.getTierConfig(account.tier);
    if (
      !tierConfig ||
      account.customFeeGroups.size >= tierConfig.customFeeGroupsAllowed
    ) {
      return false;
    }

    const groupId = `group_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    account.customFeeGroups.set(groupId, feeGroup);
    account.updatedAt = new Date();
    return true;
  }

  upgradeTier(accountId: string, newTier: MerchantTier): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    const tierConfig = this.tierManager.getTierConfig(newTier);
    if (!tierConfig) return false;

    // Can only upgrade to higher tiers
    const tierHierarchy = ["startup", "growth", "enterprise", "white_label"];
    const currentIndex = tierHierarchy.indexOf(account.tier);
    const newIndex = tierHierarchy.indexOf(newTier);

    if (newIndex <= currentIndex) {
      return false;
    }

    account.tier = newTier;
    account.baseFeePercent = tierConfig.baseFeePercent;
    account.internationalFeePercent = tierConfig.internationalFeePercent;
    account.volumeDiscountPercent = tierConfig.volumeDiscountPercentage;
    account.apiKeysEnabled = tierConfig.apiKeysAllowed;
    account.dedicatedSupport = tierConfig.dedicatedSupportIncluded;
    account.webhookRetries = tierConfig.webhookRetries;
    account.fraudToolsLevel = tierConfig.fraudToolsLevel;
    account.status = "active";
    account.updatedAt = new Date();

    return true;
  }

  checkAndUpgradeTier(accountId: string): UpgradeOpportunity | null {
    const account = this.accounts.get(accountId);
    if (!account) return null;

    const recommendedTier = this.tierManager.recommendTier(
      account.monthlyVolume
    );

    if (recommendedTier === account.tier) {
      return null;
    }

    const currentConfig = this.tierManager.getTierConfig(account.tier);
    const recommendedConfig = this.tierManager.getTierConfig(recommendedTier);

    if (!currentConfig || !recommendedConfig) {
      return null;
    }

    const monthlySavings = Math.round(
      account.monthlyVolume *
        ((currentConfig.baseFeePercent - recommendedConfig.baseFeePercent) /
          100)
    );

    return {
      currentTier: account.tier,
      suggestedTier: recommendedTier,
      monthlySavings,
      newFeatures: recommendedConfig.features.filter(
        (f) => !currentConfig.features.includes(f)
      ),
      upgradeDate: new Date(),
      contractTerm: recommendedConfig.tier === "white_label" ? 24 : 12,
    };
  }

  calculateMerchantMetrics(
    accountId: string,
    daily: {
      volume: number;
      transactionCount: number;
      chargebacks: number;
      disputes: number;
      refunds: number;
      fraudDetected: number;
      successfulTransactions: number;
    }
  ): MerchantMetrics {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Update monthly metrics
    account.monthlyVolume += daily.volume;
    account.monthlyTransactions += daily.transactionCount;
    if (daily.transactionCount > 0) {
      account.averageTransactionValue = Math.round(
        account.monthlyVolume / account.monthlyTransactions
      );
    }

    const recommendedTier = this.tierManager.recommendTier(
      account.monthlyVolume
    );

    return {
      merchantId: accountId,
      dailyVolume: daily.volume,
      dailyTransactionCount: daily.transactionCount,
      chargebackRate: daily.chargebacks / daily.transactionCount,
      disputeRate: daily.disputes / daily.transactionCount,
      refundRate: daily.refunds / daily.transactionCount,
      fraudDetectionRate: daily.fraudDetected / daily.transactionCount,
      averageTransactionValue: account.averageTransactionValue,
      successRate: daily.successfulTransactions / daily.transactionCount,
      currentTier: account.tier,
      recommendedTier,
      potentialSavings: this.calculatePotentialSavings(account, recommendedTier),
    };
  }

  private calculatePotentialSavings(
    account: MerchantAccount,
    recommendedTier: MerchantTier
  ): number {
    if (recommendedTier === account.tier) {
      return 0;
    }

    const currentConfig = this.tierManager.getTierConfig(account.tier);
    const recommendedConfig = this.tierManager.getTierConfig(recommendedTier);

    if (!currentConfig || !recommendedConfig) {
      return 0;
    }

    const baseSavings = Math.round(
      account.monthlyVolume *
        ((currentConfig.baseFeePercent - recommendedConfig.baseFeePercent) /
          100)
    );

    const monthlySavings = Math.round(
      (currentConfig.monthlyFeeCents - recommendedConfig.monthlyFeeCents) / 100
    );

    return baseSavings + monthlySavings;
  }

  addCustomDomain(accountId: string, domain: string): boolean {
    const account = this.accounts.get(accountId);
    if (!account) return false;

    const tierConfig = this.tierManager.getTierConfig(account.tier);
    if (
      !tierConfig ||
      account.customDomains.length >= tierConfig.customDomainsAllowed
    ) {
      return false;
    }

    account.customDomains.push(domain);
    account.updatedAt = new Date();
    return true;
  }

  generateApiKey(accountId: string): string | null {
    const account = this.accounts.get(accountId);
    if (!account || account.apiKeysEnabled <= 0) return null;

    account.apiKeysEnabled--;
    const apiKey = `sk_${Date.now()}_${crypto.randomBytes(32).toString("hex")}`;
    account.updatedAt = new Date();

    return apiKey;
  }
}

// ============= Export Main Service =============

export class MerchantAccountService {
  public tierManager: TierConfigManager;
  public pricingEngine: DynamicPricingEngine;
  public accountManager: MerchantAccountManager;

  constructor() {
    this.tierManager = new TierConfigManager();
    this.pricingEngine = new DynamicPricingEngine();
    this.accountManager = new MerchantAccountManager();
  }
}

// Add missing import
import crypto from "crypto";
