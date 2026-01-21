/**
 * Dispute & Chargeback Management System for Q Pay
 * Handles payment disputes, chargebacks, and refund management
 */

export type DisputeReason =
  | "fraud"
  | "duplicate"
  | "unrecognized_transaction"
  | "quality"
  | "not_as_described"
  | "cancelled_recurring"
  | "no_authorization"
  | "other";

export type DisputeStatus = "open" | "under_review" | "evidence_submitted" | "won" | "lost" | "closed";
export type ChargebackReason = "fraud" | "no_auth" | "processing_error" | "customer_dispute";

export interface Dispute {
  id: string;
  businessId: string;
  transactionId: string;
  customerId: string;
  amount: number;
  currency: string;
  reason: DisputeReason;
  status: DisputeStatus;
  description: string;
  createdAt: Date;
  dueDate: Date;
  resolvedAt?: Date;
  evidence?: DisputeEvidence[];
  notes?: string;
  outcome?: "won" | "lost";
}

export interface Chargeback {
  id: string;
  businessId: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: ChargebackReason;
  caseNumber: string;
  status: "pending" | "under_review" | "evidence_due" | "won" | "lost" | "settled";
  filedAt: Date;
  dueDate: Date;
  resolvedAt?: Date;
  bankName: string;
  cardLast4: string;
}

export interface DisputeEvidence {
  id: string;
  type: "receipt" | "shipping_proof" | "communication" | "refund_policy" | "other";
  url: string;
  description: string;
  uploadedAt: Date;
  fileSize: number;
}

export interface ChargebackInsurance {
  businessId: string;
  isActive: boolean;
  coverage: number; // Percentage (e.g., 100 for 100%)
  monthlyFee: number;
  deductible: number;
  claimsCount: number;
  totalClaimed: number;
}

/**
 * Dispute Management System
 */
export class DisputeManager {
  private disputes: Map<string, Dispute> = new Map();
  private chargebacks: Map<string, Chargeback> = new Map();
  private insurancePolicies: Map<string, ChargebackInsurance> = new Map();

  private disputeReasonDescriptions: Record<DisputeReason, string> = {
    fraud: "Unauthorized transaction - possible fraudulent activity",
    duplicate: "Duplicate or multiple transactions",
    unrecognized_transaction: "Customer does not recognize transaction",
    quality: "Product or service quality issue",
    not_as_described: "Product/service not as described",
    cancelled_recurring: "Recurring billing not cancelled",
    no_authorization: "Transaction made without authorization",
    other: "Other reason",
  };

  /**
   * File a new dispute
   */
  fileDispute(
    businessId: string,
    transactionId: string,
    customerId: string,
    amount: number,
    currency: string,
    reason: DisputeReason,
    description: string
  ): Dispute {
    const disputeId = `disp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const dispute: Dispute = {
      id: disputeId,
      businessId,
      transactionId,
      customerId,
      amount,
      currency,
      reason,
      status: "open",
      description,
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
      evidence: [],
    };

    this.disputes.set(disputeId, dispute);
    console.log(`🚨 Dispute filed: ${disputeId} - ${this.disputeReasonDescriptions[reason]}`);

    return dispute;
  }

  /**
   * Add evidence to dispute
   */
  addEvidence(
    disputeId: string,
    type: DisputeEvidence["type"],
    url: string,
    description: string,
    fileSize: number
  ): boolean {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return false;

    const evidence: DisputeEvidence = {
      id: `evid_${Date.now()}`,
      type,
      url,
      description,
      uploadedAt: new Date(),
      fileSize,
    };

    dispute.evidence?.push(evidence);
    dispute.status = "evidence_submitted";

    console.log(`📎 Evidence added to dispute ${disputeId}: ${type}`);
    return true;
  }

  /**
   * Review dispute
   */
  reviewDispute(disputeId: string, outcome: "won" | "lost", notes: string): boolean {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return false;

    dispute.status = outcome === "won" ? "won" : "lost";
    dispute.outcome = outcome;
    dispute.notes = notes;
    dispute.resolvedAt = new Date();

    console.log(`✅ Dispute ${disputeId} - ${outcome.toUpperCase()}`);
    return true;
  }

  /**
   * File a chargeback case
   */
  fileChargeback(
    businessId: string,
    transactionId: string,
    amount: number,
    currency: string,
    reason: ChargebackReason,
    bankName: string,
    cardLast4: string
  ): Chargeback {
    const chargebackId = `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const caseNumber = `CASE-${Date.now()}`;

    const chargeback: Chargeback = {
      id: chargebackId,
      businessId,
      transactionId,
      amount,
      currency,
      reason,
      caseNumber,
      status: "pending",
      filedAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      bankName,
      cardLast4,
    };

    this.chargebacks.set(chargebackId, chargeback);
    console.log(`⚠️ Chargeback filed: ${chargebackId} (${caseNumber})`);

    return chargeback;
  }

  /**
   * Submit chargeback defense
   */
  submitChargebackDefense(
    chargebackId: string,
    evidence: DisputeEvidence[],
    statement: string
  ): boolean {
    const chargeback = this.chargebacks.get(chargebackId);
    if (!chargeback) return false;

    chargeback.status = "evidence_due";

    console.log(`📤 Chargeback defense submitted for ${chargebackId}`);
    return true;
  }

  /**
   * Resolve chargeback
   */
  resolveChargeback(chargebackId: string, status: "won" | "lost", amount?: number): boolean {
    const chargeback = this.chargebacks.get(chargebackId);
    if (!chargeback) return false;

    chargeback.status = status === "won" ? "won" : "lost";
    chargeback.resolvedAt = new Date();

    console.log(`✅ Chargeback ${chargebackId} - ${status.toUpperCase()}`);
    return true;
  }

  /**
   * Enable chargeback insurance
   */
  enableChargebackInsurance(businessId: string, coverage: number = 100): ChargebackInsurance {
    const insurance: ChargebackInsurance = {
      businessId,
      isActive: true,
      coverage,
      monthlyFee: 99,
      deductible: 250,
      claimsCount: 0,
      totalClaimed: 0,
    };

    this.insurancePolicies.set(businessId, insurance);
    console.log(`🛡️ Chargeback insurance enabled for ${businessId}`);

    return insurance;
  }

  /**
   * File insurance claim
   */
  fileInsuranceClaim(chargebackId: string): boolean {
    const chargeback = this.chargebacks.get(chargebackId);
    if (!chargeback) return false;

    const insurance = this.insurancePolicies.get(chargeback.businessId);
    if (!insurance || !insurance.isActive) return false;

    // Check if claim is eligible
    if (chargeback.amount > 0) {
      const claimAmount = Math.min(chargeback.amount - insurance.deductible, chargeback.amount);

      if (claimAmount > 0) {
        insurance.claimsCount++;
        insurance.totalClaimed += claimAmount;

        console.log(`📋 Insurance claim filed: ${chargebackId} for $${claimAmount}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Process refund (alternative to dispute/chargeback)
   */
  processRefund(
    businessId: string,
    transactionId: string,
    amount: number,
    currency: string,
    reason: string,
    paymentMethod: string
  ): RefundRecord {
    const refundId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const refund: RefundRecord = {
      id: refundId,
      businessId,
      transactionId,
      amount,
      currency,
      reason,
      paymentMethod,
      status: "processing",
      requestedAt: new Date(),
      processedAt: undefined,
    };

    // Simulate processing
    setTimeout(() => {
      refund.status = "completed";
      refund.processedAt = new Date();
      console.log(`💰 Refund completed: ${refundId}`);
    }, 2000);

    console.log(`🔄 Refund initiated: ${refundId}`);
    return refund;
  }

  /**
   * Get dispute metrics
   */
  getDisputeMetrics(businessId: string) {
    const disputes = Array.from(this.disputes.values()).filter(d => d.businessId === businessId);
    const chargebacks = Array.from(this.chargebacks.values()).filter(c => c.businessId === businessId);

    const wonDisputes = disputes.filter(d => d.outcome === "won").length;
    const lostDisputes = disputes.filter(d => d.outcome === "lost").length;
    const openDisputes = disputes.filter(d => d.status === "open").length;

    const wonChargebacks = chargebacks.filter(c => c.status === "won").length;
    const lostChargebacks = chargebacks.filter(c => c.status === "lost").length;

    return {
      totalDisputes: disputes.length,
      wonDisputes,
      lostDisputes,
      openDisputes,
      disputeWinRate: disputes.length > 0 ? ((wonDisputes / disputes.length) * 100).toFixed(2) : "0",
      totalChargebacks: chargebacks.length,
      wonChargebacks,
      lostChargebacks,
      chargebackWinRate: chargebacks.length > 0 ? ((wonChargebacks / chargebacks.length) * 100).toFixed(2) : "0",
      totalDisputedAmount: disputes.reduce((sum, d) => sum + d.amount, 0),
      totalChargebackAmount: chargebacks.reduce((sum, c) => sum + c.amount, 0),
    };
  }

  /**
   * Get high-risk transactions
   */
  getHighRiskTransactions(businessId: string) {
    const disputes = Array.from(this.disputes.values()).filter(d => d.businessId === businessId);
    const chargebacks = Array.from(this.chargebacks.values()).filter(c => c.businessId === businessId);

    return {
      disputesByReason: this.groupByReason(disputes),
      chargebacksByReason: this.groupByReason(chargebacks),
      frequentDisputants: this.getFrequentDisputants(disputes),
    };
  }

  /**
   * Group disputes/chargebacks by reason
   */
  private groupByReason(items: any[]): Record<string, number> {
    return items.reduce((acc, item) => {
      const reason = item.reason;
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get customers with frequent disputes
   */
  private getFrequentDisputants(disputes: Dispute[]): Array<{ customerId: string; count: number }> {
    const customers = disputes.reduce((acc, d) => {
      const entry = acc.find(e => e.customerId === d.customerId);
      if (entry) {
        entry.count++;
      } else {
        acc.push({ customerId: d.customerId, count: 1 });
      }
      return acc;
    }, [] as Array<{ customerId: string; count: number }>);

    return customers.sort((a, b) => b.count - a.count);
  }

  /**
   * Get dispute by ID
   */
  getDispute(disputeId: string): Dispute | undefined {
    return this.disputes.get(disputeId);
  }

  /**
   * Get chargeback by ID
   */
  getChargeback(chargebackId: string): Chargeback | undefined {
    return this.chargebacks.get(chargebackId);
  }
}

/**
 * Refund Record
 */
export interface RefundRecord {
  id: string;
  businessId: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: string;
  paymentMethod: string;
  status: "processing" | "completed" | "failed";
  requestedAt: Date;
  processedAt?: Date;
}

/**
 * Best practices for dispute management
 */
export const DisputeBestPractices = {
  // Keep comprehensive records
  keepRecordsFor: "7 years",

  // Submit evidence promptly
  submitEvidenceWithin: "30 days",

  // Respond to chargebacks quickly
  respondToChargebacksWithin: "10 days",

  // Common winning evidence:
  winningEvidence: [
    "Order confirmation email",
    "Customer IP address matches",
    "Shipping/delivery proof",
    "Customer communication logs",
    "Refund policy acknowledgment",
    "Terms of service acceptance",
  ],

  // To reduce disputes:
  preventDisputes: [
    "Clear billing descriptions",
    "Obvious cancellation policies",
    "Easy refund process",
    "Good customer support",
    "Fraud detection systems",
    "Address verification",
  ],
};
