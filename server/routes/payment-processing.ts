import { RequestHandler } from "express";
import { emvPaymentProcessor } from "../services/emv-payment-processor";

/**
 * EMV Payment Processing Routes
 */

export const handleProcessEMVTransaction: RequestHandler = async (req, res) => {
  try {
    const { terminalId, merchantId, cardData, amount, currency } = req.body;

    if (!terminalId || !merchantId || !cardData || !amount) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const transaction = await emvPaymentProcessor.processEMVTransaction(
      terminalId,
      merchantId,
      cardData,
      amount,
      currency || "USD"
    );

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error processing EMV transaction:", error);
    res.status(500).json({ error: "Failed to process transaction" });
  }
};

export const handleTokenizeCard: RequestHandler = (req, res) => {
  try {
    const { cardData } = req.body;

    if (!cardData) {
      res.status(400).json({ error: "Missing card data" });
      return;
    }

    const token = emvPaymentProcessor.tokenizeCard(cardData);

    res.json({
      token,
      last4: cardData.pan.slice(-4),
      brand: cardData.cardBrand,
    });
  } catch (error) {
    console.error("Error tokenizing card:", error);
    res.status(500).json({ error: "Failed to tokenize card" });
  }
};

export const handleInitiate3DSecure: RequestHandler = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      res.status(400).json({ error: "Missing transaction ID" });
      return;
    }

    const transaction = emvPaymentProcessor.getTransaction(transactionId);
    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    // In production, integrate with actual 3D Secure provider
    const challenge = await emvPaymentProcessor["initiate3DSecure"](transaction);

    res.json(challenge);
  } catch (error) {
    console.error("Error initiating 3D Secure:", error);
    res.status(500).json({ error: "Failed to initiate 3D Secure" });
  }
};

export const handleVerify3DSecure: RequestHandler = async (req, res) => {
  try {
    const { challengeId, otp, transactionId } = req.body;

    if (!challengeId || !otp) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const result = await emvPaymentProcessor.complete3DSecureChallenge(
      challengeId,
      otp
    );

    res.json(result);
  } catch (error) {
    console.error("Error verifying 3D Secure:", error);
    res.status(500).json({ error: "Failed to verify 3D Secure" });
  }
};

export const handleProcessContactlessPayment: RequestHandler = async (
  req,
  res
) => {
  try {
    const { terminalId, merchantId, nfcData, amount, currency } = req.body;

    if (!terminalId || !merchantId || !nfcData || !amount) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const transaction = await emvPaymentProcessor.processContactlessPayment(
      terminalId,
      merchantId,
      nfcData,
      amount,
      currency || "USD"
    );

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error processing contactless payment:", error);
    res.status(500).json({ error: "Failed to process contactless payment" });
  }
};

export const handleCreatePINpadSession: RequestHandler = (req, res) => {
  try {
    const { transactionId, terminalId, merchantId } = req.body;

    if (!transactionId || !terminalId || !merchantId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const session = emvPaymentProcessor.createPINpadSession(
      transactionId,
      terminalId,
      merchantId
    );

    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating PIN session:", error);
    res.status(500).json({ error: "Failed to create PIN session" });
  }
};

export const handleVerifyPIN: RequestHandler = (req, res) => {
  try {
    const { sessionId, pin, transactionId } = req.body;

    if (!sessionId || !pin) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const isValid = emvPaymentProcessor.verifyPIN(sessionId, pin);
    const session = emvPaymentProcessor.getPINpadSession(sessionId);

    res.json({
      success: isValid,
      sessionId,
      transactionId,
      remainingAttempts: session ? session.maxAttempts - session.pinAttempts : 0,
      status: session?.status || "unknown",
    });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    res.status(500).json({ error: "Failed to verify PIN" });
  }
};

export const handleGetPINpadSession: RequestHandler = (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ error: "Missing session ID" });
      return;
    }

    const session = emvPaymentProcessor.getPINpadSession(sessionId);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json(session);
  } catch (error) {
    console.error("Error fetching PIN session:", error);
    res.status(500).json({ error: "Failed to fetch PIN session" });
  }
};

export const handleGetTransaction: RequestHandler = (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      res.status(400).json({ error: "Missing transaction ID" });
      return;
    }

    const transaction = emvPaymentProcessor.getTransaction(transactionId);

    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    res.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
};

export const handleGetComplianceReport: RequestHandler = (req, res) => {
  try {
    const { merchantId } = req.params;

    if (!merchantId) {
      res.status(400).json({ error: "Missing merchant ID" });
      return;
    }

    const report = emvPaymentProcessor.getComplianceReport(merchantId);

    res.json(report);
  } catch (error) {
    console.error("Error generating compliance report:", error);
    res.status(500).json({ error: "Failed to generate compliance report" });
  }
};
