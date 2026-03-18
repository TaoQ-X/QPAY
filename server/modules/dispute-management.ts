/**
 * Enterprise Dispute & Chargeback Management System
 * Complete workflow for handling chargebacks, disputes, and refunds
 */

export interface Dispute {
  id: string;
  businessId: string;
  transactionId: string;
  status: "open" | "under_review" | "evidence_requested" | "resolved" | "lost" | "won";
  type: "chargeback" | "refund_request" | "payment_dispute";
  reason: string;
  reasonCode: string; // Card network reason code
  amount: number;
  currency: string;
  filedBy: "customer" | "cardholder" | "bank";
  filedDate: Date;
  dueDate: Date; // Deadline for evidence submission
  resolutionDate?: Date;
  resolution?: {
    status: "refunded" | "rejected" | "partial_refund";
    amount: number;
    notes: string;
  };
  evidence: DisputeEvidence[];
  notes: DisputeNote[];
  communicationLog: CommunicationLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DisputeEvidence {
  id: string;
  type: "receipt" | "invoice" | "proof_of_delivery" | "communication" | "other";
  name: string;
  url: string;
  description: string;
  submittedAt: Date;
  submittedBy: string;
}

export interface DisputeNote {
  id: string;
  author: string;
  content: string;
  visibility: "internal" | "customer_visible";
  createdAt: Date;
}

export interface CommunicationLog {
  id: string;
  type: "email" | "message" | "system_notification";
  subject: string;
  content: string;
  recipient: string;
  status: "pending" | "sent" | "read";
  sentAt: Date;
}

export interface DisputeTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  requiredEvidence: string[];
}

export class DisputeManagementService {
  private disputes: Map<string, Dispute> = new Map();
  private templates: Map<string, DisputeTemplate> = new Map();
  private statistics = {
    totalDisputes: 0,
    openDisputes: 0,
    resolvedDisputes: 0,
    winRate: 0,
  };

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize dispute response templates
   */
  private initializeTemplates() {
    const templates: DisputeTemplate[] = [
      {
        id: "tmpl_fraudulent",
        name: "Fraudulent Transaction Response",
        category: "fraud",
        content: `The cardholder claims this transaction was fraudulent. We have reviewed our records and can confirm:
1. The transaction matches the cardholder's account activity pattern
2. The IP address and device match previous authorized transactions
3. The transaction was successfully completed and the service/product was delivered`,
        requiredEvidence: ["proof_of_delivery", "ip_logs", "device_fingerprint"],
      },
      {
        id: "tmpl_unrecognized",
        name: "Unrecognized Transaction Response",
        category: "customer_not_recognize",
        content: `The cardholder states they do not recognize this transaction. We have evidence that:
1. A valid payment method was used
2. The transaction was authorized by the cardholder
3. The service/product was delivered as ordered`,
        requiredEvidence: ["receipt", "proof_of_delivery", "authorization_proof"],
      },
      {
        id: "tmpl_not_received",
        name: "Product/Service Not Received Response",
        category: "not_received",
        content: `The cardholder claims they did not receive the ordered product/service. We can provide:
1. Proof of shipment/delivery
2. Tracking information
3. Customer signature or delivery confirmation`,
        requiredEvidence: ["proof_of_delivery", "tracking_number", "signature"],
      },
      {
        id: "tmpl_cancelled",
        name: "Cancelled Transaction Response",
        category: "cancelled",
        content: `The cardholder claims they cancelled this transaction. Our records show:
1. The transaction was processed per the cardholder's request
2. Refund was processed on [DATE]
3. Refund amount: [AMOUNT]
4. Refund transaction ID: [TXN_ID]`,
        requiredEvidence: ["refund_proof", "cancellation_request", "refund_confirmation"],
      },
    ];

    templates.forEach((t) => this.templates.set(t.id, t));
  }

  /**
   * File a new dispute
   */
  async fileDispute(data: {
    businessId: string;
    transactionId: string;
    type: "chargeback" | "refund_request" | "payment_dispute";
    reason: string;
    reasonCode: string;
    amount: number;
    currency: string;
    filedBy: "customer" | "cardholder" | "bank";
  }): Promise<Dispute> {
    const id = `dsp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 10); // 10 days to respond

    const dispute: Dispute = {
      id,
      businessId: data.businessId,
      transactionId: data.transactionId,
      status: "open",
      type: data.type,
      reason: data.reason,
      reasonCode: data.reasonCode,
      amount: data.amount,
      currency: data.currency,
      filedBy: data.filedBy,
      filedDate: new Date(),
      dueDate,
      evidence: [],
      notes: [],
      communicationLog: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.disputes.set(id, dispute);
    this.statistics.totalDisputes++;
    this.statistics.openDisputes++;

    // Send notification email
    await this.sendDisputeNotification(dispute);

    console.log(`[Dispute] Filed: ${id}`);
    return dispute;
  }

  /**
   * Get dispute details
   */
  getDispute(disputeId: string): Dispute | null {
    return this.disputes.get(disputeId) || null;
  }

  /**
   * List disputes for business
   */
  listDisputes(businessId: string, status?: Dispute["status"]): Dispute[] {
    return Array.from(this.disputes.values()).filter(
      (d) => d.businessId === businessId && (!status || d.status === status)
    );
  }

  /**
   * Submit evidence
   */
  async submitEvidence(
    disputeId: string,
    evidence: {
      type: DisputeEvidence["type"];
      name: string;
      url: string;
      description: string;
    }
  ): Promise<Dispute | null> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return null;

    const evidenceItem: DisputeEvidence = {
      id: `evt_${Date.now()}`,
      ...evidence,
      submittedAt: new Date(),
      submittedBy: "merchant",
    };

    dispute.evidence.push(evidenceItem);
    dispute.status = "evidence_requested";
    dispute.updatedAt = new Date();

    // Notify card network of evidence submission
    await this.notifyEvidenceSubmission(dispute);

    return dispute;
  }

  /**
   * Add internal note
   */
  addNote(disputeId: string, note: string, visibility: "internal" | "customer_visible" = "internal"): Dispute | null {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return null;

    const noteItem: DisputeNote = {
      id: `note_${Date.now()}`,
      author: "merchant_staff",
      content: note,
      visibility,
      createdAt: new Date(),
    };

    dispute.notes.push(noteItem);
    dispute.updatedAt = new Date();

    return dispute;
  }

  /**
   * Request chargeback information
   */
  async requestChargebackInfo(disputeId: string): Promise<Dispute | null> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return null;

    // Send email requesting more information
    const communication: CommunicationLog = {
      id: `comm_${Date.now()}`,
      type: "email",
      subject: `Chargeback Response Required for ${dispute.reasonCode}`,
      content: `We have received a chargeback for transaction ${dispute.transactionId}. 
Please provide evidence to support your position within 10 days.`,
      recipient: "merchant@example.com",
      status: "sent",
      sentAt: new Date(),
    };

    dispute.communicationLog.push(communication);
    dispute.status = "evidence_requested";
    dispute.updatedAt = new Date();

    return dispute;
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: {
      status: "refunded" | "rejected" | "partial_refund";
      amount: number;
      notes: string;
    }
  ): Promise<Dispute | null> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) return null;

    dispute.status = resolution.status === "rejected" ? "won" : "lost";
    dispute.resolution = resolution;
    dispute.resolutionDate = new Date();
    dispute.updatedAt = new Date();

    // Update statistics
    if (resolution.status === "rejected") {
      this.statistics.winRate = (this.statistics.resolvedDisputes + 1) / this.statistics.totalDisputes;
    }
    this.statistics.resolvedDisputes++;
    this.statistics.openDisputes--;

    // Send resolution notification
    await this.sendResolutionNotification(dispute);

    return dispute;
  }

  /**
   * Get dispute response template
   */
  getTemplate(templateId: string): DisputeTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * List available templates
   */
  listTemplates(): DisputeTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get statistics
   */
  getStatistics(businessId?: string) {
    const disputes = businessId
      ? this.listDisputes(businessId)
      : Array.from(this.disputes.values());

    const open = disputes.filter((d) => d.status === "open").length;
    const resolved = disputes.filter((d) => d.status === "resolved").length;
    const won = disputes.filter((d) => d.status === "won").length;
    const lost = disputes.filter((d) => d.status === "lost").length;

    const totalAmount = disputes.reduce((sum, d) => sum + d.amount, 0);
    const recoveredAmount = disputes
      .filter((d) => d.status === "won" && d.resolution)
      .reduce((sum, d) => sum + (d.resolution?.amount || 0), 0);

    return {
      totalDisputes: disputes.length,
      openDisputes: open,
      resolvedDisputes: resolved,
      wonDisputes: won,
      lostDisputes: lost,
      winRate: resolved > 0 ? ((won / resolved) * 100).toFixed(1) + "%" : "0%",
      totalDisputedAmount: totalAmount,
      totalRecoveredAmount: recoveredAmount,
      recoveryRate:
        totalAmount > 0 ? ((recoveredAmount / totalAmount) * 100).toFixed(1) + "%" : "0%",
      averageResolutionTime: this.calculateAvgResolutionTime(disputes),
    };
  }

  /**
   * Helper methods
   */

  private async sendDisputeNotification(dispute: Dispute) {
    console.log(`[Dispute] Notification sent for ${dispute.id}`);
    // In production: Send email via email service
  }

  private async notifyEvidenceSubmission(dispute: Dispute) {
    console.log(`[Dispute] Evidence submission confirmed for ${dispute.id}`);
  }

  private async sendResolutionNotification(dispute: Dispute) {
    console.log(`[Dispute] Resolution notification sent for ${dispute.id}`);
  }

  private calculateAvgResolutionTime(disputes: Dispute[]): string {
    const resolved = disputes.filter((d) => d.resolutionDate);
    if (resolved.length === 0) return "N/A";

    const avgMs = resolved.reduce((sum, d) => {
      const time = (d.resolutionDate!.getTime() - d.filedDate.getTime()) / (1000 * 60 * 60 * 24);
      return sum + time;
    }, 0) / resolved.length;

    return Math.round(avgMs) + " days";
  }
}

export default DisputeManagementService;
