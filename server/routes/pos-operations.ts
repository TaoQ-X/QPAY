import { RequestHandler } from "express";
import { alertAndInvoiceService } from "../services/alert-and-invoice-service";
import { posTerminalService } from "../services/pos-terminal-service";

/**
 * ALERT CONFIGURATION ROUTES
 */

export const handleCreateAlertConfig: RequestHandler = (req, res) => {
  try {
    const { merchantId, name, triggers, notificationChannels, recipients } =
      req.body;

    if (!merchantId || !name || !triggers || !notificationChannels) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const config = alertAndInvoiceService.createAlertConfiguration(merchantId, {
      name,
      enabled: true,
      triggers,
      notificationChannels,
      recipients: recipients || [],
    });

    res.status(201).json(config);
  } catch (error) {
    console.error("Error creating alert config:", error);
    res.status(500).json({ error: "Failed to create alert configuration" });
  }
};

export const handleGetAlertTemplates: RequestHandler = (_req, res) => {
  try {
    const templates = alertAndInvoiceService.getAlertTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching alert templates:", error);
    res.status(500).json({ error: "Failed to fetch alert templates" });
  }
};

export const handleTriggerAlert: RequestHandler = (req, res) => {
  try {
    const { alertConfigId, triggerType, data } = req.body;

    if (!alertConfigId || !triggerType || !data) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    alertAndInvoiceService
      .triggerAlert(alertConfigId, triggerType, data)
      .then((notification) => {
        res.status(201).json(notification);
      });
  } catch (error) {
    console.error("Error triggering alert:", error);
    res.status(500).json({ error: "Failed to trigger alert" });
  }
};

export const handleGetNotificationLog: RequestHandler = (req, res) => {
  try {
    const { merchantId, limit } = req.query;
    const log = alertAndInvoiceService.getNotificationLog(
      merchantId as string,
      limit ? parseInt(limit as string) : 100
    );
    res.json(log);
  } catch (error) {
    console.error("Error fetching notification log:", error);
    res.status(500).json({ error: "Failed to fetch notification log" });
  }
};

/**
 * DIGITAL INVOICE ROUTES
 */

export const handleCreateInvoice: RequestHandler = (req, res) => {
  try {
    const {
      merchantId,
      terminalId,
      transactionId,
      amount,
      currency,
      customerEmail,
      customerPhone,
      items,
      paymentMethod,
      cardLastFour,
    } = req.body;

    if (!merchantId || !terminalId || !items || !amount) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const invoice = alertAndInvoiceService.createDigitalInvoice(merchantId, {
      merchantId,
      terminalId,
      transactionId,
      amount,
      currency: currency || "USD",
      customerEmail,
      customerPhone,
      items,
      taxAmount: 0,
      total: amount,
      paymentMethod,
      cardLastFour,
      signature: "",
      signatureAlgorithm: "RSA-SHA256",
      sendMethods: {
        email: { sent: false },
        sms: { sent: false },
        printed: { sent: false },
      },
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
};

export const handleSendInvoice: RequestHandler = (req, res) => {
  try {
    const { invoiceId, channels } = req.body;

    if (!invoiceId) {
      res.status(400).json({ error: "Missing invoice ID" });
      return;
    }

    alertAndInvoiceService
      .sendInvoice(invoiceId, channels || ["email"])
      .then((invoice) => {
        res.json(invoice);
      });
  } catch (error) {
    console.error("Error sending invoice:", error);
    res.status(500).json({ error: "Failed to send invoice" });
  }
};

export const handleGetInvoice: RequestHandler = (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = alertAndInvoiceService.getInvoice(invoiceId);
    if (!invoice) {
      res.status(404).json({ error: "Invoice not found" });
      return;
    }

    res.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

export const handleVerifyInvoiceSignature: RequestHandler = (req, res) => {
  try {
    const { invoiceId } = req.params;

    const isValid = alertAndInvoiceService.verifyInvoiceSignature(invoiceId);
    res.json({ invoiceId, valid: isValid });
  } catch (error) {
    console.error("Error verifying invoice signature:", error);
    res.status(500).json({ error: "Failed to verify invoice signature" });
  }
};

export const handleGetInvoiceStats: RequestHandler = (req, res) => {
  try {
    const { merchantId } = req.query;

    if (!merchantId) {
      res.status(400).json({ error: "Missing merchant ID" });
      return;
    }

    const stats = alertAndInvoiceService.getInvoiceStats(merchantId as string);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    res.status(500).json({ error: "Failed to fetch invoice statistics" });
  }
};

/**
 * POS TERMINAL OPERATIONS
 */

export const handleProcessTerminalTransaction: RequestHandler = (req, res) => {
  try {
    const { terminalId, amount, paymentMethod, cardType, lastFourDigits } =
      req.body;

    if (!terminalId || !amount || !paymentMethod) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    posTerminalService
      .processTransaction(terminalId, {
        terminalId,
        merchantId: "merchant-123",
        amount,
        currency: "USD",
        paymentMethod,
        cardType,
        lastFourDigits,
        settlementDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: "pending",
        receiptNumber: "",
      })
      .then((transaction) => {
        res.status(201).json(transaction);
      });
  } catch (error) {
    console.error("Error processing transaction:", error);
    res.status(500).json({ error: "Failed to process transaction" });
  }
};

export const handleGetTerminalConfig: RequestHandler = (req, res) => {
  try {
    const { terminalId } = req.params;

    const config = posTerminalService.updateConfiguration(terminalId, {});
    if (!config) {
      res.status(404).json({ error: "Terminal configuration not found" });
      return;
    }

    res.json(config);
  } catch (error) {
    console.error("Error fetching terminal config:", error);
    res.status(500).json({ error: "Failed to fetch terminal configuration" });
  }
};

export const handleUpdateTerminalConfig: RequestHandler = (req, res) => {
  try {
    const { terminalId } = req.params;
    const { configuration } = req.body;

    if (!configuration) {
      res.status(400).json({ error: "Missing configuration data" });
      return;
    }

    const updated = posTerminalService.updateConfiguration(
      terminalId,
      configuration
    );
    res.json(updated);
  } catch (error) {
    console.error("Error updating terminal config:", error);
    res.status(500).json({ error: "Failed to update terminal configuration" });
  }
};

export const handleGetTerminalStats: RequestHandler = (req, res) => {
  try {
    const { terminalId } = req.params;

    const stats = posTerminalService.getTerminalStats(terminalId);
    if (!stats) {
      res.status(404).json({ error: "Terminal statistics not found" });
      return;
    }

    res.json(stats);
  } catch (error) {
    console.error("Error fetching terminal stats:", error);
    res.status(500).json({ error: "Failed to fetch terminal statistics" });
  }
};

export const handlePerformHealthCheck: RequestHandler = (req, res) => {
  try {
    const { terminalId } = req.params;

    posTerminalService.healthCheck(terminalId).then((health) => {
      res.json(health);
    });
  } catch (error) {
    console.error("Error performing health check:", error);
    res.status(500).json({ error: "Failed to perform health check" });
  }
};

export const handleGetMerchantTerminals: RequestHandler = (req, res) => {
  try {
    const { merchantId } = req.params;

    const terminals = posTerminalService.getMerchantTerminals(merchantId);
    res.json(terminals);
  } catch (error) {
    console.error("Error fetching merchant terminals:", error);
    res.status(500).json({ error: "Failed to fetch terminals" });
  }
};

export const handleGetTerminalTransactions: RequestHandler = (req, res) => {
  try {
    const { terminalId } = req.params;
    const { limit } = req.query;

    const transactions = posTerminalService.getTerminalTransactions(
      terminalId,
      limit ? parseInt(limit as string) : 50
    );
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching terminal transactions:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const handleGetEMVComplianceReport: RequestHandler = (req, res) => {
  try {
    const { merchantId } = req.params;

    const report = posTerminalService.getEMVComplianceReport(merchantId);
    res.json(report);
  } catch (error) {
    console.error("Error fetching EMV compliance report:", error);
    res.status(500).json({ error: "Failed to fetch compliance report" });
  }
};
