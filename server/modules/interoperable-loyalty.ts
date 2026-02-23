/**
 * Interoperable Loyalty Points System
 * 
 * Enables unified loyalty point ecosystem where:
 * - Users earn points across all merchants
 * - Points can be spent at any merchant without conversion
 * - Different loyalty programs can exchange points at unified rates
 * - Real-time exchange between airline miles, hotel points, retail points, etc.
 * 
 * Example: Spend El Al airline miles to buy coffee at local café
 */

export interface LoyaltyProgram {
  id: string;
  name: string;
  merchant: string;
  pointType: string; // 'miles', 'points', 'rewards', etc.
  exchangeRateToUnified: number; // How many program points = 1 unified point
  conversionFee: number; // Fee % for converting between point types
  isActive: boolean;
  createdAt: Date;
}

export interface LoyaltyAccount {
  id: string;
  userId: string;
  programId: string;
  balance: number; // In the program's native points
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'vip';
  totalEarned: number;
  totalRedeemed: number;
  joinedAt: Date;
  lastActivity: Date;
}

export interface UnifiedLoyaltyPoint {
  id: string;
  userId: string;
  value: number; // Value in USD equivalent
  sourceProgram: string;
  sourceProgramPoints: number;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'redeem' | 'convert' | 'transfer';
  fromProgram: string;
  toProgram?: string;
  amount: number; // In source program's points
  unifiedPointsValue: number;
  fee: number;
  exchangeRate: number;
  transactionHash: string;
  completedAt: Date;
}

export interface LoyaltyRedemptionRequest {
  id: string;
  userId: string;
  fromProgram: string;
  toMerchant: string;
  amount: number; // Unified points
  estimatedUSDValue: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Loyalty Program Registry
 * Manages all supported loyalty programs and their conversion rates
 */
export class LoyaltyProgramRegistry {
  private programs: Map<string, LoyaltyProgram> = new Map();
  private exchangeRates: Map<string, number> = new Map();

  constructor() {
    this.initializePrograms();
  }

  private initializePrograms(): void {
    // Airline Loyalty Programs
    const programs: LoyaltyProgram[] = [
      {
        id: 'elal-rewards',
        name: 'El Al Matmid',
        merchant: 'El Al Airlines',
        pointType: 'miles',
        exchangeRateToUnified: 0.01, // 100 miles = 1 unified point
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'american-advantage',
        name: 'American Airlines AAdvantage',
        merchant: 'American Airlines',
        pointType: 'miles',
        exchangeRateToUnified: 0.01,
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'united-mileage',
        name: 'United MileagePlus',
        merchant: 'United Airlines',
        pointType: 'miles',
        exchangeRateToUnified: 0.01,
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },

      // Hotel Loyalty Programs
      {
        id: 'marriott-bonvoy',
        name: 'Marriott Bonvoy',
        merchant: 'Marriott Hotels',
        pointType: 'points',
        exchangeRateToUnified: 0.02, // 50 points = 1 unified point
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'hilton-honors',
        name: 'Hilton Honors',
        merchant: 'Hilton Hotels',
        pointType: 'points',
        exchangeRateToUnified: 0.02,
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'hyatt-world',
        name: 'World of Hyatt',
        merchant: 'Hyatt Hotels',
        pointType: 'points',
        exchangeRateToUnified: 0.025, // 40 points = 1 unified point
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },

      // Retail Loyalty Programs
      {
        id: 'walmart-rewards',
        name: 'Walmart Rewards',
        merchant: 'Walmart',
        pointType: 'points',
        exchangeRateToUnified: 1, // 1 point = 1 unified point
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'target-rewards',
        name: 'Target Circle Rewards',
        merchant: 'Target',
        pointType: 'points',
        exchangeRateToUnified: 1,
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'costco-rewards',
        name: 'Costco Gold Star Rewards',
        merchant: 'Costco',
        pointType: 'points',
        exchangeRateToUnified: 2, // 0.5 points = 1 unified point (higher value)
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },

      // Ride-sharing & Mobility
      {
        id: 'uber-rewards',
        name: 'Uber Rewards',
        merchant: 'Uber',
        pointType: 'points',
        exchangeRateToUnified: 1,
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },

      // Coffee & Dining
      {
        id: 'starbucks-stars',
        name: 'Starbucks Rewards',
        merchant: 'Starbucks',
        pointType: 'stars',
        exchangeRateToUnified: 1,
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'mcdonalds-rewards',
        name: "McDonald's Rewards",
        merchant: "McDonald's",
        pointType: 'points',
        exchangeRateToUnified: 1,
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },

      // Credit Card Rewards
      {
        id: 'amex-mr',
        name: 'American Express Membership Rewards',
        merchant: 'American Express',
        pointType: 'points',
        exchangeRateToUnified: 0.5, // 2 points = 1 unified point
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'chase-ultimate',
        name: 'Chase Ultimate Rewards',
        merchant: 'Chase Bank',
        pointType: 'points',
        exchangeRateToUnified: 1,
        conversionFee: 0,
        isActive: true,
        createdAt: new Date('2024-01-01'),
      },
    ];

    programs.forEach((program) => {
      this.programs.set(program.id, program);
      // Store USD conversion rates (simplified)
      const usdValue = this.estimatePointValue(program);
      this.exchangeRates.set(program.id, usdValue);
    });
  }

  private estimatePointValue(program: LoyaltyProgram): number {
    // Simplified valuation: typically 1-2 cents per point
    const baseValue = 0.01;
    const tierBonus = program.pointType === 'miles' ? 0.005 : 0;
    return baseValue + tierBonus;
  }

  public getProgram(programId: string): LoyaltyProgram | undefined {
    return this.programs.get(programId);
  }

  public getAllPrograms(): LoyaltyProgram[] {
    return Array.from(this.programs.values()).filter((p) => p.isActive);
  }

  public getExchangeRate(programId: string): number {
    return this.exchangeRates.get(programId) || 0;
  }

  public calculateUnifiedPoints(programId: string, nativePoints: number): number {
    const program = this.programs.get(programId);
    if (!program) {
      return 0;
    }
    return nativePoints * program.exchangeRateToUnified;
  }

  public calculateNativePoints(programId: string, unifiedPoints: number): number {
    const program = this.programs.get(programId);
    if (!program) {
      return 0;
    }
    return unifiedPoints / program.exchangeRateToUnified;
  }
}

/**
 * Unified Loyalty Account Manager
 * Manages user accounts across multiple loyalty programs
 */
export class UnifiedLoyaltyAccountManager {
  private userAccounts: Map<string, LoyaltyAccount[]> = new Map();
  private transactions: LoyaltyTransaction[] = [];

  constructor(private programRegistry: LoyaltyProgramRegistry) {}

  public createAccount(userId: string, programId: string): LoyaltyAccount {
    const program = this.programRegistry.getProgram(programId);
    if (!program) {
      throw new Error(`Program not found: ${programId}`);
    }

    const account: LoyaltyAccount = {
      id: `acct_${Math.random().toString(36).substring(7)}`,
      userId,
      programId,
      balance: 0,
      tier: 'bronze',
      totalEarned: 0,
      totalRedeemed: 0,
      joinedAt: new Date(),
      lastActivity: new Date(),
    };

    if (!this.userAccounts.has(userId)) {
      this.userAccounts.set(userId, []);
    }

    this.userAccounts.get(userId)!.push(account);
    return account;
  }

  public addPoints(userId: string, programId: string, amount: number): void {
    let account = this.getUserAccountInProgram(userId, programId);

    if (!account) {
      account = this.createAccount(userId, programId);
    }

    account.balance += amount;
    account.totalEarned += amount;
    account.lastActivity = new Date();
    this.updateTier(account);
  }

  public redeemPoints(userId: string, programId: string, amount: number): boolean {
    const account = this.getUserAccountInProgram(userId, programId);

    if (!account || account.balance < amount) {
      return false;
    }

    account.balance -= amount;
    account.totalRedeemed += amount;
    account.lastActivity = new Date();
    this.updateTier(account);
    return true;
  }

  private updateTier(account: LoyaltyAccount): void {
    const lifetime = account.totalEarned;

    if (lifetime >= 500000) {
      account.tier = 'vip';
    } else if (lifetime >= 200000) {
      account.tier = 'platinum';
    } else if (lifetime >= 100000) {
      account.tier = 'gold';
    } else if (lifetime >= 50000) {
      account.tier = 'silver';
    } else {
      account.tier = 'bronze';
    }
  }

  public getUserAccountInProgram(userId: string, programId: string): LoyaltyAccount | undefined {
    const accounts = this.userAccounts.get(userId) || [];
    return accounts.find((a) => a.programId === programId);
  }

  public getUserAllAccounts(userId: string): LoyaltyAccount[] {
    return this.userAccounts.get(userId) || [];
  }

  public getTotalUnifiedValue(userId: string): number {
    const accounts = this.getUserAllAccounts(userId);
    let totalValue = 0;

    for (const account of accounts) {
      const rate = this.programRegistry.getExchangeRate(account.programId);
      const unifiedPoints = this.programRegistry.calculateUnifiedPoints(
        account.programId,
        account.balance
      );
      totalValue += unifiedPoints * rate;
    }

    return totalValue;
  }

  public recordTransaction(transaction: LoyaltyTransaction): void {
    this.transactions.push(transaction);
  }

  public getUserTransactions(userId: string): LoyaltyTransaction[] {
    return this.transactions.filter((t) => t.userId === userId);
  }
}

/**
 * Loyalty Point Converter
 * Handles conversion between different loyalty programs
 */
export class LoyaltyPointConverter {
  constructor(
    private programRegistry: LoyaltyProgramRegistry,
    private accountManager: UnifiedLoyaltyAccountManager
  ) {}

  public convertPoints(
    userId: string,
    fromProgramId: string,
    toProgramId: string,
    amountInSourceProgram: number
  ): LoyaltyTransaction | null {
    // Check source account has sufficient balance
    if (!this.accountManager.redeemPoints(userId, fromProgramId, amountInSourceProgram)) {
      return null;
    }

    // Calculate unified points
    const unifiedPoints = this.programRegistry.calculateUnifiedPoints(
      fromProgramId,
      amountInSourceProgram
    );

    // Get conversion fee
    const fromProgram = this.programRegistry.getProgram(fromProgramId);
    const fee = (unifiedPoints * (fromProgram?.conversionFee || 0)) / 100;

    const netUnifiedPoints = unifiedPoints - fee;

    // Convert to destination program's native points
    const destinationNativePoints = this.programRegistry.calculateNativePoints(
      toProgramId,
      netUnifiedPoints
    );

    // Add to destination account
    this.accountManager.addPoints(userId, toProgramId, destinationNativePoints);

    // Record transaction
    const transaction: LoyaltyTransaction = {
      id: `tx_${Math.random().toString(36).substring(7)}`,
      userId,
      type: 'convert',
      fromProgram: fromProgramId,
      toProgram: toProgramId,
      amount: amountInSourceProgram,
      unifiedPointsValue: netUnifiedPoints,
      fee,
      exchangeRate: unifiedPoints / amountInSourceProgram,
      transactionHash: `0x${Math.random().toString(16).substring(2)}`,
      completedAt: new Date(),
    };

    this.accountManager.recordTransaction(transaction);
    return transaction;
  }

  public getConversionRate(fromProgramId: string, toProgramId: string): number {
    const fromUnified = this.programRegistry.calculateUnifiedPoints(fromProgramId, 1);
    const toNative = this.programRegistry.calculateNativePoints(toProgramId, fromUnified);
    return toNative;
  }

  public estimateConversion(
    fromProgramId: string,
    toProgramId: string,
    amount: number
  ): {
    sourceProgram: string;
    sourceAmount: number;
    unifiedValue: number;
    destinationProgram: string;
    destinationAmount: number;
    fee: number;
  } {
    const unifiedValue = this.programRegistry.calculateUnifiedPoints(fromProgramId, amount);
    const fromProgram = this.programRegistry.getProgram(fromProgramId);
    const fee = (unifiedValue * (fromProgram?.conversionFee || 0)) / 100;
    const destinationAmount = this.programRegistry.calculateNativePoints(
      toProgramId,
      unifiedValue - fee
    );

    return {
      sourceProgram: fromProgramId,
      sourceAmount: amount,
      unifiedValue,
      destinationProgram: toProgramId,
      destinationAmount,
      fee,
    };
  }
}

/**
 * Universal Loyalty Redemption Manager
 * Handles redeeming points at any merchant
 */
export class UniversalLoyaltyRedemptionManager {
  private redemptionRequests: Map<string, LoyaltyRedemptionRequest> = new Map();

  constructor(
    private accountManager: UnifiedLoyaltyAccountManager,
    private converter: LoyaltyPointConverter,
    private programRegistry: LoyaltyProgramRegistry
  ) {}

  public requestRedemption(
    userId: string,
    fromProgramId: string,
    targetMerchantProgramId: string,
    amount: number // In unified points
  ): LoyaltyRedemptionRequest {
    const estimatedUSDValue =
      amount * this.programRegistry.getExchangeRate(fromProgramId);

    const request: LoyaltyRedemptionRequest = {
      id: `redeem_${Math.random().toString(36).substring(7)}`,
      userId,
      fromProgram: fromProgramId,
      toMerchant: targetMerchantProgramId,
      amount,
      estimatedUSDValue,
      status: 'pending',
      createdAt: new Date(),
    };

    this.redemptionRequests.set(request.id, request);
    return request;
  }

  public approveRedemption(redemptionId: string): boolean {
    const request = this.redemptionRequests.get(redemptionId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    // Convert from source program to target merchant program
    const transaction = this.converter.convertPoints(
      request.userId,
      request.fromProgram,
      request.toMerchant,
      this.programRegistry.calculateNativePoints(request.fromProgram, request.amount)
    );

    if (!transaction) {
      request.status = 'rejected';
      return false;
    }

    request.status = 'completed';
    request.completedAt = new Date();
    return true;
  }

  public getRedemptionRequest(requestId: string): LoyaltyRedemptionRequest | undefined {
    return this.redemptionRequests.get(requestId);
  }

  public getUserRedemptions(userId: string): LoyaltyRedemptionRequest[] {
    return Array.from(this.redemptionRequests.values()).filter(
      (r) => r.userId === userId
    );
  }
}

/**
 * Interoperable Loyalty Service
 * Main service orchestrating all loyalty functionality
 */
export class InteroperableLoyaltyService {
  private programRegistry: LoyaltyProgramRegistry;
  private accountManager: UnifiedLoyaltyAccountManager;
  private converter: LoyaltyPointConverter;
  private redemptionManager: UniversalLoyaltyRedemptionManager;

  constructor() {
    this.programRegistry = new LoyaltyProgramRegistry();
    this.accountManager = new UnifiedLoyaltyAccountManager(this.programRegistry);
    this.converter = new LoyaltyPointConverter(this.programRegistry, this.accountManager);
    this.redemptionManager = new UniversalLoyaltyRedemptionManager(
      this.accountManager,
      this.converter,
      this.programRegistry
    );
  }

  // Public API
  public enrollInProgram(userId: string, programId: string): LoyaltyAccount {
    return this.accountManager.createAccount(userId, programId);
  }

  public earnPoints(userId: string, programId: string, amount: number): void {
    this.accountManager.addPoints(userId, programId, amount);
  }

  public getUserLoyaltyPortfolio(userId: string): {
    accounts: LoyaltyAccount[];
    totalUnifiedValue: number;
    allPrograms: LoyaltyProgram[];
  } {
    return {
      accounts: this.accountManager.getUserAllAccounts(userId),
      totalUnifiedValue: this.accountManager.getTotalUnifiedValue(userId),
      allPrograms: this.programRegistry.getAllPrograms(),
    };
  }

  public convertPoints(
    userId: string,
    fromProgramId: string,
    toProgramId: string,
    amountInSourceProgram: number
  ): LoyaltyTransaction | null {
    return this.converter.convertPoints(userId, fromProgramId, toProgramId, amountInSourceProgram);
  }

  public estimateConversion(
    fromProgramId: string,
    toProgramId: string,
    amount: number
  ): any {
    return this.converter.estimateConversion(fromProgramId, toProgramId, amount);
  }

  public redeemAtMerchant(
    userId: string,
    sourceProgramId: string,
    targetMerchantProgramId: string,
    unifiedPointAmount: number
  ): LoyaltyRedemptionRequest {
    return this.redemptionManager.requestRedemption(
      userId,
      sourceProgramId,
      targetMerchantProgramId,
      unifiedPointAmount
    );
  }

  public approveRedemption(redemptionId: string): boolean {
    return this.redemptionManager.approveRedemption(redemptionId);
  }

  public getUserTransactions(userId: string): LoyaltyTransaction[] {
    return this.accountManager.getUserTransactions(userId);
  }

  public getAvailablePrograms(): LoyaltyProgram[] {
    return this.programRegistry.getAllPrograms();
  }
}

export default InteroperableLoyaltyService;
