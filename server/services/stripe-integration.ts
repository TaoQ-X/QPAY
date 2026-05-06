import Stripe from "stripe";

/**
 * Stripe Payment Integration Service
 * Handles all interactions with Stripe for payment processing, settlements, and disputes
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_demo", {
  apiVersion: "2023-10-16",
});

export interface StripePaymentInput {
  amount: number;
  currency: string;
  cardToken: string;
  cardholderName: string;
  description: string;
  merchantId: string;
  transactionId: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentResult {
  chargeId: string;
  amount: number;
  currency: string;
  status: "succeeded" | "processing" | "requires_action" | "requires_payment_method" | "failed";
  receiptUrl?: string;
  failureMessage?: string;
}

export interface StripePayoutInput {
  merchantId: string;
  amount: number;
  currency: string;
  bankAccountId: string;
  description?: string;
}

class StripeIntegrationService {
  /**
   * Create Stripe customer for merchant
   */
  async createMerchantCustomer(
    merchantId: string,
    email: string,
    businessName: string
  ): Promise<string> {
    const customer = await stripe.customers.create({
      email,
      description: businessName,
      metadata: { merchantId },
    });

    return customer.id;
  }

  /**
   * Tokenize card (in production, use Stripe.js on frontend)
   */
  async tokenizeCard(
    cardNumber: string,
    expiryMonth: number,
    expiryYear: number,
    cvc: string
  ): Promise<string> {
    const token = await stripe.tokens.create({
      card: {
        number: cardNumber,
        exp_month: expiryMonth,
        exp_year: expiryYear,
        cvc: cvc,
      },
    });

    return token.id;
  }

  /**
   * Process payment with Stripe
   */
  async processPayment(input: StripePaymentInput): Promise<StripePaymentResult> {
    try {
      const charge = await stripe.charges.create({
        amount: Math.round(input.amount * 100), // Convert to cents
        currency: input.currency.toLowerCase(),
        source: input.cardToken,
        description: input.description,
        receipt_email: input.metadata?.customerEmail,
        metadata: {
          merchantId: input.merchantId,
          transactionId: input.transactionId,
          ...input.metadata,
        },
      });

      return {
        chargeId: charge.id,
        amount: input.amount,
        currency: input.currency,
        status: charge.status as any,
        receiptUrl: charge.receipt_url || undefined,
      };
    } catch (error: any) {
      return {
        chargeId: "",
        amount: input.amount,
        currency: input.currency,
        status: "failed",
        failureMessage: error.message,
      };
    }
  }

  /**
   * Create payment intent for 3D Secure
   */
  async createPaymentIntent(input: {
    amount: number;
    currency: string;
    customerId: string;
    description: string;
    metadata: Record<string, string>;
  }): Promise<{ clientSecret: string; intentId: string }> {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency.toLowerCase(),
      customer: input.customerId,
      description: input.description,
      metadata: input.metadata,
      payment_method_types: ["card"],
    });

    return {
      clientSecret: intent.client_secret || "",
      intentId: intent.id,
    };
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(
    intentId: string,
    paymentMethodId: string
  ): Promise<{
    status:
      | "succeeded"
      | "requires_action"
      | "processing"
      | "requires_payment_method"
      | "failed";
    clientSecret?: string;
  }> {
    const intent = await stripe.paymentIntents.confirm(intentId, {
      payment_method: paymentMethodId,
    });

    return {
      status: intent.status as any,
      clientSecret: intent.client_secret || undefined,
    };
  }

  /**
   * Refund charge
   */
  async refundCharge(
    chargeId: string,
    amount?: number
  ): Promise<{ refundId: string; status: string }> {
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return {
      refundId: refund.id,
      status: refund.status,
    };
  }

  /**
   * Create payout to merchant bank account
   */
  async createPayout(input: StripePayoutInput): Promise<{
    payoutId: string;
    status: string;
    arrivalDate: Date;
  }> {
    const payout = await stripe.payouts.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency.toLowerCase(),
      destination: input.bankAccountId,
      description: input.description,
      metadata: { merchantId: input.merchantId },
    });

    return {
      payoutId: payout.id,
      status: payout.status,
      arrivalDate: new Date(payout.arrival_date * 1000),
    };
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string): Promise<{
    status: string;
    amount: number;
    arrivedAt?: Date;
  }> {
    const payout = await stripe.payouts.retrieve(payoutId);

    return {
      status: payout.status,
      amount: payout.amount / 100,
      arrivedAt: payout.arrival_date ? new Date(payout.arrival_date * 1000) : undefined,
    };
  }

  /**
   * List transactions for merchant
   */
  async listCharges(
    customerId: string,
    limit: number = 50
  ): Promise<
    Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      created: Date;
    }>
  > {
    const charges = await stripe.charges.list({
      customer: customerId,
      limit,
    });

    return charges.data.map((charge) => ({
      id: charge.id,
      amount: charge.amount / 100,
      currency: charge.currency.toUpperCase(),
      status: charge.status,
      created: new Date(charge.created * 1000),
    }));
  }

  /**
   * Handle webhook event
   */
  async handleWebhookEvent(
    event: Stripe.Event
  ): Promise<{
    handled: boolean;
    action: string;
    data?: Record<string, any>;
  }> {
    switch (event.type) {
      case "charge.succeeded":
        return {
          handled: true,
          action: "CHARGE_SUCCEEDED",
          data: {
            chargeId: (event.data.object as Stripe.Charge).id,
            amount: (event.data.object as Stripe.Charge).amount / 100,
          },
        };

      case "charge.failed":
        return {
          handled: true,
          action: "CHARGE_FAILED",
          data: {
            chargeId: (event.data.object as Stripe.Charge).id,
            reason: (event.data.object as Stripe.Charge).failure_message,
          },
        };

      case "charge.refunded":
        return {
          handled: true,
          action: "CHARGE_REFUNDED",
          data: {
            chargeId: (event.data.object as Stripe.Charge).id,
            refunded: (event.data.object as Stripe.Charge).refunded,
          },
        };

      case "charge.dispute.created":
        return {
          handled: true,
          action: "DISPUTE_CREATED",
          data: {
            disputeId: (event.data.object as Stripe.Dispute).id,
            chargeId: (event.data.object as Stripe.Dispute).charge,
            amount: (event.data.object as Stripe.Dispute).amount / 100,
          },
        };

      case "payout.paid":
        return {
          handled: true,
          action: "PAYOUT_PAID",
          data: {
            payoutId: (event.data.object as Stripe.Payout).id,
            amount: (event.data.object as Stripe.Payout).amount / 100,
          },
        };

      default:
        return {
          handled: false,
          action: "UNKNOWN_EVENT",
        };
    }
  }

  /**
   * Calculate fee based on merchant tier
   */
  calculateFee(amount: number, tier: "sme" | "mid-market" | "enterprise"): {
    feePercent: number;
    feeAmount: number;
    netAmount: number;
  } {
    const feeMap = {
      sme: 2.9, // 2.9% + $0.30 per transaction
      "mid-market": 2.4,
      enterprise: 1.9,
    };

    const feePercent = feeMap[tier] || feeMap.sme;
    const fixedFee = 0.3; // $0.30 fixed fee
    const feeAmount = amount * (feePercent / 100) + fixedFee;
    const netAmount = amount - feeAmount;

    return {
      feePercent,
      feeAmount: Math.round(feeAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  }

  /**
   * Verify Stripe webhook signature
   */
  verifyWebhookSignature(
    body: string,
    signature: string,
    secret: string
  ): Stripe.Event | null {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret) as Stripe.Event;
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return null;
    }
  }
}

export const stripeIntegration = new StripeIntegrationService();
