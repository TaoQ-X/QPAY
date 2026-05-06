import { stripeIntegration } from "./stripe-integration";

/**
 * Settlement Engine
 * Handles calculation and processing of merchant payouts
 */

export interface SettlementCalculation {
  merchantId: string;
  periodStartDate: Date;
  periodEndDate: Date;
  transactions: Array<{
    id: string;
    amount: number;
    status: "approved" | "refunded" | "disputed";
    fee: number;
  }>;
  summary: {
    grossVolume: number;
    totalFees: number;
    netVolume: number;
    transactionCount: number;
    approvedCount: number;
    refundedCount: number;
    disputedCount: number;
  };
}

export interface PayoutSchedule {
  merchantId: string;
  frequency: "daily" | "weekly" | "monthly";
  daysUntilPayout: number;
  nextPayoutDate: Date;
  minimumAmount: number;
}

class SettlementEngine {
  /**
   * Calculate settlement for a merchant in a period
   */
  async calculateSettlement(
    merchantId: string,
    startDate: Date,
    endDate: Date,
    transactions: any[],
    merchantTier: "sme" | "mid-market" | "enterprise"
  ): Promise<SettlementCalculation> {
    const approved: any[] = [];
    const refunded: any[] = [];
    const disputed: any[] = [];

    let grossVolume = 0;
    let totalFees = 0;

    for (const tx of transactions) {
      if (tx.createdAt < startDate || tx.createdAt > endDate) continue;

      const feeCalc = stripeIntegration.calculateFee(tx.amount, merchantTier);

      if (tx.status === "approved") {
        approved.push({
          id: tx.id,
          amount: tx.amount,
          fee: feeCalc.feeAmount,
          status: "approved",
        });
        grossVolume += tx.amount;
        totalFees += feeCalc.feeAmount;
      } else if (tx.status === "refunded") {
        refunded.push({
          id: tx.id,
          amount: -tx.amount,
          fee: -feeCalc.feeAmount,
          status: "refunded",
        });
        grossVolume -= tx.amount;
        totalFees -= feeCalc.feeAmount;
      } else if (tx.status === "disputed") {
        disputed.push({
          id: tx.id,
          amount: 0,
          fee: feeCalc.feeAmount * 5, // 5x fee for disputed
          status: "disputed",
        });
        totalFees += feeCalc.feeAmount * 5;
      }
    }

    const netVolume = grossVolume - totalFees;

    return {
      merchantId,
      periodStartDate: startDate,
      periodEndDate: endDate,
      transactions: [...approved, ...refunded, ...disputed],
      summary: {
        grossVolume: Math.round(grossVolume * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100,
        netVolume: Math.round(netVolume * 100) / 100,
        transactionCount: approved.length + refunded.length + disputed.length,
        approvedCount: approved.length,
        refundedCount: refunded.length,
        disputedCount: disputed.length,
      },
    };
  }

  /**
   * Determine payout schedule based on merchant tier
   */
  getPayoutSchedule(tier: "sme" | "mid-market" | "enterprise"): PayoutSchedule & {
    frequency: string;
    daysUntilPayout: number;
  } {
    const schedules: Record<string, any> = {
      sme: {
        frequency: "weekly",
        daysUntilPayout: 7,
        minimumAmount: 100,
      },
      "mid-market": {
        frequency: "daily",
        daysUntilPayout: 2,
        minimumAmount: 50,
      },
      enterprise: {
        frequency: "daily",
        daysUntilPayout: 1,
        minimumAmount: 0,
      },
    };

    const schedule = schedules[tier] || schedules.sme;
    const nextPayoutDate = new Date();
    nextPayoutDate.setDate(nextPayoutDate.getDate() + schedule.daysUntilPayout);

    return {
      merchantId: "",
      ...schedule,
      nextPayoutDate,
    };
  }

  /**
   * Process payout to merchant
   */
  async processPayout(
    merchantId: string,
    amount: number,
    bankAccountId: string,
    currency: string = "USD"
  ): Promise<{
    payoutId: string;
    status: string;
    amount: number;
    arrivalDate: Date;
  }> {
    if (amount <= 0) {
      throw new Error("Payout amount must be greater than zero");
    }

    const payout = await stripeIntegration.createPayout({
      merchantId,
      amount,
      bankAccountId,
      currency,
      description: `Settlement payout to merchant ${merchantId}`,
    });

    return payout;
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string) {
    return stripeIntegration.getPayoutStatus(payoutId);
  }

  /**
   * Calculate holds/reserves
   */
  calculateHolds(
    volume: number,
    tier: "sme" | "mid-market" | "enterprise"
  ): {
    holdPercent: number;
    holdAmount: number;
    releaseDate: Date;
  } {
    const holdMap: Record<string, number> = {
      sme: 5, // 5% hold for 7 days
      "mid-market": 2, // 2% hold for 3 days
      enterprise: 0, // No hold
    };

    const holdPercent = holdMap[tier] || 5;
    const holdAmount = volume * (holdPercent / 100);

    const releaseDate = new Date();
    const days = tier === "sme" ? 7 : tier === "mid-market" ? 3 : 0;
    releaseDate.setDate(releaseDate.getDate() + days);

    return {
      holdPercent,
      holdAmount: Math.round(holdAmount * 100) / 100,
      releaseDate,
    };
  }

  /**
   * Apply chargeback/dispute fees
   */
  applyDisputeFee(
    baseAmount: number,
    chargebackFee: number = 15
  ): {
    originalAmount: number;
    disputeFee: number;
    totalDeduction: number;
  } {
    return {
      originalAmount: baseAmount,
      disputeFee: chargebackFee,
      totalDeduction: baseAmount + chargebackFee,
    };
  }

  /**
   * Generate settlement report
   */
  generateSettlementReport(settlement: SettlementCalculation): string {
    const report = `
=== SETTLEMENT REPORT ===
Merchant ID: ${settlement.merchantId}
Period: ${settlement.periodStartDate.toISOString().split("T")[0]} to ${settlement.periodEndDate.toISOString().split("T")[0]}

SUMMARY:
- Total Transactions: ${settlement.summary.transactionCount}
  - Approved: ${settlement.summary.approvedCount}
  - Refunded: ${settlement.summary.refundedCount}
  - Disputed: ${settlement.summary.disputedCount}

AMOUNTS:
- Gross Volume: $${settlement.summary.grossVolume.toFixed(2)}
- Total Fees: $${settlement.summary.totalFees.toFixed(2)}
- Net Volume (Payout): $${settlement.summary.netVolume.toFixed(2)}

DETAILS:
${settlement.transactions
  .map(
    (tx) =>
      `- ${tx.id.substring(0, 8)}: $${tx.amount.toFixed(2)} (${tx.status}) [Fee: $${tx.fee.toFixed(2)}]`
  )
  .join("\n")}
    `;

    return report;
  }

  /**
   * Reconcile transactions
   */
  reconcileTransactions(
    dbTransactions: any[],
    stripeCharges: any[]
  ): {
    matched: number;
    missing: any[];
    extra: any[];
    discrepancies: any[];
  } {
    const matched: number = 0;
    const missing: any[] = [];
    const extra: any[] = [];
    const discrepancies: any[] = [];

    // Check for missing transactions
    for (const stripe of stripeCharges) {
      const dbTx = dbTransactions.find((t) => t.stripeChargeId === stripe.id);
      if (!dbTx) {
        missing.push({ stripeId: stripe.id, amount: stripe.amount / 100 });
      } else if (dbTx.amount !== stripe.amount / 100) {
        discrepancies.push({
          transactionId: dbTx.id,
          dbAmount: dbTx.amount,
          stripeAmount: stripe.amount / 100,
        });
      }
    }

    // Check for extra transactions
    for (const db of dbTransactions) {
      if (!db.stripeChargeId) continue;
      const stripe = stripeCharges.find((s) => s.id === db.stripeChargeId);
      if (!stripe) {
        extra.push({ transactionId: db.id, amount: db.amount });
      }
    }

    return {
      matched: dbTransactions.length - missing.length - extra.length,
      missing,
      extra,
      discrepancies,
    };
  }
}

export const settlementEngine = new SettlementEngine();
