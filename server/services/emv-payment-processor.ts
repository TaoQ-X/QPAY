import crypto from "crypto";

/**
 * EMV Payment Processing Service
 * Handles EMV transactions, 3D Secure authentication, and contactless payments
 */

export interface EMVCard {
  pan: string; // Card number (encrypted)
  expiryDate: string; // MM/YY
  cardholderName: string;
  cardBrand: "visa" | "mastercard" | "amex" | "discover";
  cardType: "credit" | "debit";
  issuerBank: string;
  issuerCountry: string;
  emvChip: {
    applicationId: string;
    terminalVerificationResults: string;
    cryptogramType: "tc" | "arqc" | "aac";
  };
}

export interface EMVTransaction {
  id: string;
  terminalId: string;
  merchantId: string;
  amount: number;
  currency: string;
  card: EMVCard;
  transactionType: "emv_chip" | "contactless" | "pin_entry" | "3d_secure";
  timestamp: Date;
  status: "pending" | "processing" | "approved" | "declined" | "blocked";
  verification: {
    cvv2Verified: boolean;
    pinVerified: boolean;
    threedsecureVerified: boolean;
    avsResult: "match" | "no_match" | "not_checked";
  };
  riskScore: number;
  fraudIndicators: string[];
  response: {
    authorizationCode?: string;
    responseCode: string;
    responseMessage: string;
    eci?: string; // Electronic Commerce Indicator for 3DS
  };
  settlementDate: Date;
}

export interface ThreeDSecureChallenge {
  id: string;
  transactionId: string;
  challengeUrl: string;
  acsTransactionId: string;
  threeDsVersion: "2.1.0" | "2.2.0";
  challengeWindowSize: "250x400" | "390x400" | "500x600" | "600x400" | "full";
  directoryServerTransactionId: string;
}

export interface ContactlessTransaction {
  id: string;
  transactionId: string;
  deviceSerialNumber: string;
  nfcSignature: string;
  transactionCounter: number;
  cumulativeAmount: number;
  contactlessLimit: number;
  requiresContactlessVerification: boolean;
}

export interface PINpadSession {
  id: string;
  sessionId: string;
  transactionId: string;
  terminalId: string;
  status: "waiting" | "pin_entered" | "verified" | "failed" | "timeout";
  pinAttempts: number;
  maxAttempts: number;
  expiresAt: Date;
  pinHash?: string;
}

class EMVPaymentProcessor {
  private transactions: Map<string, EMVTransaction> = new Map();
  private threeDsChallenges: Map<string, ThreeDSecureChallenge> = new Map();
  private contactlessTransactions: Map<string, ContactlessTransaction> = new Map();
  private pinpadSessions: Map<string, PINpadSession> = new Map();
  private cardTokens: Map<string, string> = new Map();

  /**
   * TOKENIZATION
   * Securely tokenize card data
   */
  tokenizeCard(cardData: Omit<EMVCard, "emvChip">): string {
    const token = crypto.randomUUID();
    const encryptedCard = this.encryptCardData(cardData);
    this.cardTokens.set(token, JSON.stringify(encryptedCard));
    return token;
  }

  /**
   * Encrypt card data using AES-256
   */
  private encryptCardData(cardData: any): string {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(JSON.stringify(cardData));
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return Buffer.concat([iv, encrypted]).toString("hex");
  }

  /**
   * PROCESS EMV TRANSACTION
   */
  async processEMVTransaction(
    terminalId: string,
    merchantId: string,
    cardData: EMVCard,
    amount: number,
    currency: string = "USD"
  ): Promise<EMVTransaction> {
    const transactionId = crypto.randomUUID();

    // Validate card and perform risk assessment
    const riskScore = this.assessTransactionRisk(cardData, amount);
    const fraudIndicators = this.detectFraudIndicators(cardData, amount, riskScore);

    // Create EMV transaction
    const transaction: EMVTransaction = {
      id: transactionId,
      terminalId,
      merchantId,
      amount,
      currency,
      card: cardData,
      transactionType: "emv_chip",
      timestamp: new Date(),
      status: "processing",
      verification: {
        cvv2Verified: true,
        pinVerified: false,
        threedsecureVerified: false,
        avsResult: "match",
      },
      riskScore,
      fraudIndicators,
      response: {
        responseCode: "00",
        responseMessage: "Approved",
      },
      settlementDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    };

    // Determine if transaction needs 3D Secure
    if (amount > 500 || riskScore > 60) {
      transaction.status = "pending";
      const challenge = await this.initiate3DSecure(transaction);
      transaction.response.eci = challenge.directoryServerTransactionId;
    } else {
      transaction.status = riskScore > 40 ? "blocked" : "approved";
      transaction.response.authorizationCode = this.generateAuthCode();
    }

    this.transactions.set(transactionId, transaction);
    return transaction;
  }

  /**
   * Assess transaction risk based on multiple factors
   */
  private assessTransactionRisk(
    card: EMVCard,
    amount: number,
    threshold = 500
  ): number {
    let riskScore = 0;

    // Amount-based risk
    if (amount > threshold * 2) riskScore += 30;
    else if (amount > threshold) riskScore += 15;

    // Card type risk
    if (card.cardType === "credit") riskScore += 10;

    // Geographic risk
    if (card.issuerCountry !== "US") riskScore += 10;

    // Cumulative risk adjustment
    riskScore = Math.min(100, Math.max(0, riskScore));

    return riskScore;
  }

  /**
   * Detect potential fraud indicators
   */
  private detectFraudIndicators(
    card: EMVCard,
    amount: number,
    riskScore: number
  ): string[] {
    const indicators: string[] = [];

    // Check for common fraud patterns
    if (riskScore > 70) indicators.push("high_risk_score");
    if (amount > 10000) indicators.push("unusually_large_amount");
    if (card.cardBrand === "amex") indicators.push("premium_card");
    if (card.issuerCountry !== "US") indicators.push("international_card");

    return indicators;
  }

  /**
   * INITIATE 3D SECURE V2
   */
  async initiate3DSecure(transaction: EMVTransaction): Promise<ThreeDSecureChallenge> {
    const challengeId = crypto.randomUUID();
    const acsTransactionId = crypto.randomUUID();
    const directoryServerTransactionId = crypto.randomUUID();

    const challenge: ThreeDSecureChallenge = {
      id: challengeId,
      transactionId: transaction.id,
      challengeUrl: `https://acs.bankcard.com/challenge/${acsTransactionId}`,
      acsTransactionId,
      threeDsVersion: "2.2.0",
      challengeWindowSize: "390x400",
      directoryServerTransactionId,
    };

    this.threeDsChallenges.set(challengeId, challenge);
    return challenge;
  }

  /**
   * Complete 3D Secure authentication
   */
  async complete3DSecureChallenge(
    challengeId: string,
    otp: string
  ): Promise<{ success: boolean; transactionId: string }> {
    const challenge = this.threeDsChallenges.get(challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    const transaction = this.transactions.get(challenge.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Verify OTP (in production, verify with ACS)
    const isValid = this.verifyOTP(otp);
    if (isValid) {
      transaction.verification.threedsecureVerified = true;
      transaction.status = "approved";
      transaction.response.authorizationCode = this.generateAuthCode();
      transaction.response.eci = "05"; // Secure electronic commerce
    } else {
      transaction.status = "declined";
      transaction.response.responseCode = "05";
      transaction.response.responseMessage = "Authentication Failed";
    }

    return {
      success: isValid,
      transactionId: transaction.id,
    };
  }

  /**
   * CONTACTLESS PAYMENT
   */
  async processContactlessPayment(
    terminalId: string,
    merchantId: string,
    nfcData: string,
    amount: number,
    currency: string = "USD"
  ): Promise<EMVTransaction & { contactless: ContactlessTransaction }> {
    const transactionId = crypto.randomUUID();
    const contactlessId = crypto.randomUUID();

    // Extract card data from NFC
    const cardData = this.extractCardFromNFC(nfcData);

    // Create transaction
    const transaction: EMVTransaction = {
      id: transactionId,
      terminalId,
      merchantId,
      amount,
      currency,
      card: cardData,
      transactionType: "contactless",
      timestamp: new Date(),
      status: "processing",
      verification: {
        cvv2Verified: true,
        pinVerified: false,
        threedsecureVerified: false,
        avsResult: "match",
      },
      riskScore: 30, // Contactless generally lower risk
      fraudIndicators: [],
      response: {
        responseCode: "00",
        responseMessage: "Approved",
        authorizationCode: this.generateAuthCode(),
      },
      settlementDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    };

    // Contactless payment record
    const contactlessTransaction: ContactlessTransaction = {
      id: contactlessId,
      transactionId,
      deviceSerialNumber: terminalId,
      nfcSignature: crypto.createHash("sha256").update(nfcData).digest("hex"),
      transactionCounter: Math.floor(Math.random() * 1000),
      cumulativeAmount: amount,
      contactlessLimit: 100, // Typical contactless limit
      requiresContactlessVerification: amount > 100,
    };

    // If amount exceeds contactless limit, require PIN
    if (amount > 100) {
      transaction.status = "pending";
      transaction.verification.pinVerified = false;
    } else {
      transaction.status = "approved";
    }

    this.transactions.set(transactionId, transaction);
    this.contactlessTransactions.set(contactlessId, contactlessTransaction);

    return { ...transaction, contactless: contactlessTransaction };
  }

  /**
   * Extract card data from NFC signal
   */
  private extractCardFromNFC(nfcData: string): EMVCard {
    // In production, parse actual NFC/EMV data
    // For now, simulate extraction
    return {
      pan: "**** **** **** 4242",
      expiryDate: "12/25",
      cardholderName: "JOHN SMITH",
      cardBrand: "visa",
      cardType: "debit",
      issuerBank: "Chase Bank",
      issuerCountry: "US",
      emvChip: {
        applicationId: "A0000000031010",
        terminalVerificationResults: "0000008000",
        cryptogramType: "tc",
      },
    };
  }

  /**
   * PINPAD SESSION MANAGEMENT
   */
  createPINpadSession(
    transactionId: string,
    terminalId: string,
    merchantId: string
  ): PINpadSession {
    const sessionId = crypto.randomUUID();

    const session: PINpadSession = {
      id: sessionId,
      sessionId,
      transactionId,
      terminalId,
      status: "waiting",
      pinAttempts: 0,
      maxAttempts: 3,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };

    this.pinpadSessions.set(sessionId, session);
    return session;
  }

  /**
   * Verify PIN entry
   */
  verifyPIN(sessionId: string, pin: string): boolean {
    const session = this.pinpadSessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    if (session.status === "verified") return true;
    if (session.pinAttempts >= session.maxAttempts) {
      session.status = "failed";
      return false;
    }

    session.pinAttempts++;

    // In production, verify against encrypted PIN on card
    const pinHash = crypto.createHash("sha256").update(pin).digest("hex");

    // Simulate PIN verification (in production, verify against actual card PIN)
    const isValid = pin === "1234"; // Demo PIN

    if (isValid) {
      session.status = "verified";
      session.pinHash = pinHash;

      // Update transaction
      const transaction = this.transactions.get(session.transactionId);
      if (transaction) {
        transaction.verification.pinVerified = true;
        transaction.status = "approved";
        transaction.response.authorizationCode = this.generateAuthCode();
      }
    } else {
      if (session.pinAttempts >= session.maxAttempts) {
        session.status = "failed";
      }
    }

    return isValid;
  }

  /**
   * Get PIN session status
   */
  getPINpadSession(sessionId: string): PINpadSession | null {
    const session = this.pinpadSessions.get(sessionId);
    if (!session) return null;

    // Check if session expired
    if (new Date() > session.expiresAt) {
      session.status = "timeout";
      return session;
    }

    return session;
  }

  /**
   * UTILITIES
   */

  private verifyOTP(otp: string): boolean {
    // In production, verify against OTP service
    return otp === "123456";
  }

  private generateAuthCode(): string {
    return crypto.randomBytes(6).toString("hex").toUpperCase();
  }

  /**
   * Get transaction details
   */
  getTransaction(transactionId: string): EMVTransaction | null {
    return this.transactions.get(transactionId) || null;
  }

  /**
   * Get 3D Secure challenge
   */
  getThreeDSecureChallenge(challengeId: string): ThreeDSecureChallenge | null {
    return this.threeDsChallenges.get(challengeId) || null;
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(
    merchantId: string,
    limit: number = 50
  ): EMVTransaction[] {
    const merchantTransactions: EMVTransaction[] = [];

    for (const tx of this.transactions.values()) {
      if (tx.merchantId === merchantId) {
        merchantTransactions.push(tx);
      }
    }

    return merchantTransactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Generate compliance report
   */
  getComplianceReport(merchantId: string): any {
    const transactions = this.getTransactionHistory(merchantId, 1000);

    return {
      merchantId,
      totalTransactions: transactions.length,
      approvedCount: transactions.filter((t) => t.status === "approved").length,
      declinedCount: transactions.filter((t) => t.status === "declined").length,
      blockedCount: transactions.filter((t) => t.status === "blocked").length,
      averageRiskScore:
        transactions.reduce((sum, t) => sum + t.riskScore, 0) / transactions.length,
      threeDSecureUsageRate: (
        (transactions.filter((t) => t.verification.threedsecureVerified).length /
          transactions.length) *
        100
      ).toFixed(2),
      contactlessTransactionRate: (
        (transactions.filter((t) => t.transactionType === "contactless").length /
          transactions.length) *
        100
      ).toFixed(2),
      pinVerifiedRate: (
        (transactions.filter((t) => t.verification.pinVerified).length /
          transactions.length) *
        100
      ).toFixed(2),
    };
  }
}

export const emvPaymentProcessor = new EMVPaymentProcessor();
