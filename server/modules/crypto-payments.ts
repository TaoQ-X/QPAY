// Cryptocurrency Payments for Q Pay
// Support for Bitcoin, Ethereum, Stablecoins and other crypto with real-time conversion

export type CryptoAsset = "BTC" | "ETH" | "USDC" | "USDT" | "DAI" | "MATIC" | "SOL" | "XRP" | "LTC" | "BCH";
export type BlockchainNetwork = "ethereum" | "bitcoin" | "polygon" | "solana" | "ripple" | "litecoin" | "bitcoin_cash";

export interface CryptoPrice {
  asset: CryptoAsset;
  usdPrice: number;
  eurPrice: number;
  gbpPrice: number;
  jpyPrice: number;
  lastUpdated: Date;
  source: "live" | "cached";
  expiresAt: Date;
  volumeUSD24h: number;
  marketCap: number;
  priceChange24h: number;
}

export interface CryptoPayment {
  id: string;
  merchantId: string;
  customerId: string;
  orderId?: string;
  amount: number;
  currency: string; // USD, EUR, etc
  cryptoAsset: CryptoAsset;
  cryptoAmount: number;
  exchangeRate: number;
  walletAddress: string;
  fromAddress?: string;
  transactionHash?: string;
  confirmations: number;
  requiredConfirmations: number;
  status: "pending" | "confirmed" | "failed" | "completed" | "expired";
  network: BlockchainNetwork;
  fee: number;
  processingFee: number;
  totalFee: number;
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface CryptoWallet {
  id: string;
  merchantId: string;
  asset: CryptoAsset;
  address: string;
  network: BlockchainNetwork;
  publicKey?: string;
  balance: number;
  totalReceived: number;
  totalSent: number;
  transactionCount: number;
  createdAt: Date;
  lastActivity: Date;
}

export interface CryptoExchangeRate {
  asset: CryptoAsset;
  fiatCurrency: string;
  rate: number;
  timestamp: Date;
  source: string;
  volatility: number; // percentage
}

export interface CryptoTransaction {
  id: string;
  hash: string;
  network: BlockchainNetwork;
  fromAddress: string;
  toAddress: string;
  asset: CryptoAsset;
  amount: number;
  fee: number;
  gasPrice?: number;
  gasLimit?: number;
  gasUsed?: number;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  requiredConfirmations: number;
  blockNumber?: number;
  timestamp: Date;
}

export interface StablecoinConfig {
  asset: CryptoAsset;
  peggedTo: string; // USD, EUR, etc
  network: BlockchainNetwork;
  contractAddress: string;
  decimals: number;
  circulatingSupply: number;
  issuer: string;
}

export interface CryptoConversion {
  fromAsset: CryptoAsset;
  toAsset: CryptoAsset;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  timestamp: Date;
  network: BlockchainNetwork;
}

// ============= Cryptocurrency Price Service =============

export class CryptoPriceService {
  private prices: Map<CryptoAsset, CryptoPrice> = new Map();
  private priceHistory: Map<CryptoAsset, CryptoPrice[]> = new Map();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute

  // Simulated real-time prices (in production, use CoinGecko, Binance API, etc.)
  private basePrices: Record<CryptoAsset, number> = {
    BTC: 43250.50,
    ETH: 2280.75,
    USDC: 1.0,
    USDT: 1.0,
    DAI: 1.0,
    MATIC: 0.85,
    SOL: 142.30,
    XRP: 2.45,
    LTC: 105.60,
    BCH: 325.80,
  };

  private volatilityRates: Record<CryptoAsset, number> = {
    BTC: 0.02,
    ETH: 0.025,
    USDC: 0.001,
    USDT: 0.001,
    DAI: 0.001,
    MATIC: 0.035,
    SOL: 0.03,
    XRP: 0.028,
    LTC: 0.025,
    BCH: 0.03,
  };

  getPrice(asset: CryptoAsset): CryptoPrice | null {
    const cached = this.prices.get(asset);
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }

    // Simulate price with small volatility
    const basePrice = this.basePrices[asset];
    const volatility = this.volatilityRates[asset];
    const variance = (Math.random() - 0.5) * 2 * volatility;
    const currentPrice = basePrice * (1 + variance);

    const price: CryptoPrice = {
      asset,
      usdPrice: currentPrice,
      eurPrice: currentPrice * 0.92,
      gbpPrice: currentPrice * 0.79,
      jpyPrice: currentPrice * 149.5,
      lastUpdated: new Date(),
      source: "cached",
      expiresAt: new Date(Date.now() + this.CACHE_DURATION),
      volumeUSD24h: Math.random() * 1000000000 + 100000000,
      marketCap: currentPrice * this.getCirculatingSupply(asset),
      priceChange24h: (Math.random() - 0.5) * 20,
    };

    this.prices.set(asset, price);

    // Store in history
    if (!this.priceHistory.has(asset)) {
      this.priceHistory.set(asset, []);
    }
    this.priceHistory.get(asset)!.push(price);

    return price;
  }

  convertCrypto(
    amount: number,
    fromAsset: CryptoAsset,
    toAsset: CryptoAsset
  ): { amount: number; rate: number; fee: number } | null {
    const fromPrice = this.getPrice(fromAsset);
    const toPrice = this.getPrice(toAsset);

    if (!fromPrice || !toPrice) return null;

    const rate = fromPrice.usdPrice / toPrice.usdPrice;
    const convertedAmount = amount * rate;
    const fee = convertedAmount * 0.001; // 0.1% fee

    return {
      amount: convertedAmount - fee,
      rate,
      fee,
    };
  }

  convertToFiat(
    cryptoAmount: number,
    asset: CryptoAsset,
    fiatCurrency: string
  ): { amount: number; rate: number } | null {
    const price = this.getPrice(asset);
    if (!price) return null;

    let rate = 0;
    if (fiatCurrency === "USD") rate = price.usdPrice;
    else if (fiatCurrency === "EUR") rate = price.eurPrice;
    else if (fiatCurrency === "GBP") rate = price.gbpPrice;
    else if (fiatCurrency === "JPY") rate = price.jpyPrice;

    if (rate === 0) return null;

    return {
      amount: cryptoAmount * rate,
      rate,
    };
  }

  getPriceHistory(asset: CryptoAsset, periods: number = 24): CryptoPrice[] {
    const history = this.priceHistory.get(asset) || [];
    return history.slice(-periods);
  }

  private getCirculatingSupply(asset: CryptoAsset): number {
    const supplies: Record<CryptoAsset, number> = {
      BTC: 21000000,
      ETH: 120000000,
      USDC: 34000000000,
      USDT: 96000000000,
      DAI: 5500000000,
      MATIC: 10000000000,
      SOL: 577000000,
      XRP: 53000000000,
      LTC: 84000000,
      BCH: 21000000,
    };
    return supplies[asset];
  }
}

// ============= Cryptocurrency Payment Processor =============

export class CryptoPaymentProcessor {
  private payments: Map<string, CryptoPayment> = new Map();
  private wallets: Map<string, CryptoWallet> = new Map();
  private priceService: CryptoPriceService;
  private transactions: Map<string, CryptoTransaction> = new Map();

  constructor(priceService: CryptoPriceService) {
    this.priceService = priceService;
  }

  initializeWallet(
    merchantId: string,
    asset: CryptoAsset,
    network: BlockchainNetwork
  ): CryptoWallet {
    const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate wallet generation
    const address = this.generateWalletAddress(asset, network);

    const wallet: CryptoWallet = {
      id: walletId,
      merchantId,
      asset,
      address,
      network,
      balance: 0,
      totalReceived: 0,
      totalSent: 0,
      transactionCount: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.wallets.set(walletId, wallet);
    return wallet;
  }

  createPayment(
    merchantId: string,
    customerId: string,
    amount: number,
    fiatCurrency: string,
    cryptoAsset: CryptoAsset,
    network: BlockchainNetwork,
    orderId?: string
  ): CryptoPayment | null {
    const price = this.priceService.getPrice(cryptoAsset);
    if (!price) return null;

    let rate = 0;
    if (fiatCurrency === "USD") rate = price.usdPrice;
    else if (fiatCurrency === "EUR") rate = price.eurPrice;
    else if (fiatCurrency === "GBP") rate = price.gbpPrice;
    else if (fiatCurrency === "JPY") rate = price.jpyPrice;

    if (rate === 0) return null;

    const cryptoAmount = amount / rate;
    const processingFee = amount * 0.01; // 1% fee
    const networkFee = this.estimateNetworkFee(cryptoAsset, network);

    const paymentId = `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const wallet = this.getMerchantWallet(merchantId, cryptoAsset, network);
    const walletAddress = wallet?.address || this.generateWalletAddress(cryptoAsset, network);

    const payment: CryptoPayment = {
      id: paymentId,
      merchantId,
      customerId,
      orderId,
      amount,
      currency: fiatCurrency,
      cryptoAsset,
      cryptoAmount,
      exchangeRate: rate,
      walletAddress,
      confirmations: 0,
      requiredConfirmations: this.getRequiredConfirmations(cryptoAsset),
      status: "pending",
      network,
      fee: networkFee,
      processingFee,
      totalFee: networkFee + processingFee,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      createdAt: new Date(),
    };

    this.payments.set(paymentId, payment);
    return payment;
  }

  getPayment(paymentId: string): CryptoPayment | null {
    return this.payments.get(paymentId) || null;
  }

  confirmPayment(
    paymentId: string,
    transactionHash: string,
    confirmations: number = 1
  ): boolean {
    const payment = this.payments.get(paymentId);
    if (!payment) return false;

    payment.transactionHash = transactionHash;
    payment.confirmations = confirmations;

    if (confirmations >= payment.requiredConfirmations) {
      payment.status = "confirmed";
      payment.completedAt = new Date();

      // Update wallet
      const wallet = this.getMerchantWallet(
        payment.merchantId,
        payment.cryptoAsset,
        payment.network
      );
      if (wallet) {
        wallet.balance += payment.cryptoAmount;
        wallet.totalReceived += payment.cryptoAmount;
        wallet.transactionCount++;
        wallet.lastActivity = new Date();
      }
    }

    return true;
  }

  processRefund(
    paymentId: string,
    refundAddress: string
  ): CryptoTransaction | null {
    const payment = this.payments.get(paymentId);
    if (!payment || payment.status !== "confirmed") return null;

    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction: CryptoTransaction = {
      id: transactionId,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      network: payment.network,
      fromAddress: payment.walletAddress,
      toAddress: refundAddress,
      asset: payment.cryptoAsset,
      amount: payment.cryptoAmount,
      fee: this.estimateNetworkFee(payment.cryptoAsset, payment.network),
      status: "pending",
      confirmations: 0,
      requiredConfirmations: this.getRequiredConfirmations(payment.cryptoAsset),
      timestamp: new Date(),
    };

    this.transactions.set(transactionId, transaction);
    payment.status = "failed"; // Mark original payment as refunded

    return transaction;
  }

  getMerchantWallet(
    merchantId: string,
    asset: CryptoAsset,
    network: BlockchainNetwork
  ): CryptoWallet | null {
    for (const [_, wallet] of this.wallets) {
      if (
        wallet.merchantId === merchantId &&
        wallet.asset === asset &&
        wallet.network === network
      ) {
        return wallet;
      }
    }
    return null;
  }

  private generateWalletAddress(
    asset: CryptoAsset,
    network: BlockchainNetwork
  ): string {
    const prefixes: Record<CryptoAsset, string> = {
      BTC: "1",
      ETH: "0x",
      USDC: "0x",
      USDT: "0x",
      DAI: "0x",
      MATIC: "0x",
      SOL: "",
      XRP: "r",
      LTC: "L",
      BCH: "bitcoincash:",
    };

    const prefix = prefixes[asset];
    const randomPart = Math.random().toString(16).substr(2, 34);
    return prefix + randomPart;
  }

  private estimateNetworkFee(
    asset: CryptoAsset,
    network: BlockchainNetwork
  ): number {
    const fees: Record<CryptoAsset, number> = {
      BTC: 0.0001,
      ETH: 0.001,
      USDC: 1,
      USDT: 1,
      DAI: 1,
      MATIC: 0.01,
      SOL: 0.00025,
      XRP: 0.00001,
      LTC: 0.0001,
      BCH: 0.00001,
    };

    return fees[asset] || 0.0001;
  }

  private getRequiredConfirmations(asset: CryptoAsset): number {
    const confirmations: Record<CryptoAsset, number> = {
      BTC: 3,
      ETH: 12,
      USDC: 12,
      USDT: 12,
      DAI: 12,
      MATIC: 128,
      SOL: 1,
      XRP: 30,
      LTC: 6,
      BCH: 6,
    };

    return confirmations[asset] || 1;
  }

  getPaymentStatus(paymentId: string): {
    status: string;
    confirmations: number;
    requiredConfirmations: number;
    percentComplete: number;
  } | null {
    const payment = this.payments.get(paymentId);
    if (!payment) return null;

    const percentComplete = (payment.confirmations / payment.requiredConfirmations) * 100;

    return {
      status: payment.status,
      confirmations: payment.confirmations,
      requiredConfirmations: payment.requiredConfirmations,
      percentComplete: Math.min(percentComplete, 100),
    };
  }
}

// ============= Stablecoin Manager =============

export class StablecoinManager {
  private stablecoins: Map<CryptoAsset, StablecoinConfig> = new Map();

  constructor() {
    this.initializeStablecoins();
  }

  private initializeStablecoins(): void {
    const configs: StablecoinConfig[] = [
      {
        asset: "USDC",
        peggedTo: "USD",
        network: "ethereum",
        contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
        circulatingSupply: 34000000000,
        issuer: "Circle",
      },
      {
        asset: "USDT",
        peggedTo: "USD",
        network: "ethereum",
        contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        decimals: 6,
        circulatingSupply: 96000000000,
        issuer: "Tether",
      },
      {
        asset: "DAI",
        peggedTo: "USD",
        network: "ethereum",
        contractAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        decimals: 18,
        circulatingSupply: 5500000000,
        issuer: "MakerDAO",
      },
    ];

    configs.forEach((config) => this.stablecoins.set(config.asset, config));
  }

  getStablecoinInfo(asset: CryptoAsset): StablecoinConfig | null {
    return this.stablecoins.get(asset) || null;
  }

  isStablecoin(asset: CryptoAsset): boolean {
    return this.stablecoins.has(asset);
  }

  getStablecoinsForNetwork(network: BlockchainNetwork): StablecoinConfig[] {
    const result: StablecoinConfig[] = [];
    this.stablecoins.forEach((config) => {
      if (config.network === network) {
        result.push(config);
      }
    });
    return result;
  }
}

// ============= Cryptocurrency Service =============

export class CryptocurrencyService {
  public priceService: CryptoPriceService;
  public paymentProcessor: CryptoPaymentProcessor;
  public stablecoinManager: StablecoinManager;

  constructor() {
    this.priceService = new CryptoPriceService();
    this.paymentProcessor = new CryptoPaymentProcessor(this.priceService);
    this.stablecoinManager = new StablecoinManager();
  }

  getSystemCapabilities(): {
    supportedAssets: CryptoAsset[];
    supportedNetworks: BlockchainNetwork[];
    features: string[];
  } {
    return {
      supportedAssets: ["BTC", "ETH", "USDC", "USDT", "DAI", "MATIC", "SOL", "XRP", "LTC", "BCH"],
      supportedNetworks: ["ethereum", "bitcoin", "polygon", "solana", "ripple", "litecoin", "bitcoin_cash"],
      features: [
        "Real-time crypto pricing",
        "Multi-asset payment processing",
        "Automatic currency conversion",
        "Blockchain confirmation tracking",
        "Stablecoin support for volatility reduction",
        "Instant settlement options",
        "Refund processing",
        "Wallet management",
        "Transaction history",
        "Fee estimation",
        "Price alerts",
        "Multi-network support",
      ],
    };
  }
}
