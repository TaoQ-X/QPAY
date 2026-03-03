import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const router = Router();

// Middleware to verify API key
const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const apiKey = authHeader?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key' });
  }

  // In production, verify against stored API keys in database
  // For now, we'll accept any valid format
  if (!isValidApiKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Store API key in request for logging
  (req as any).apiKey = apiKey;
  next();
};

// Simple API key validation (in production, check against database)
function isValidApiKey(apiKey: string): boolean {
  return apiKey.length >= 32 && /^[a-zA-Z0-9_\-]+$/.test(apiKey);
}

// Generate request ID for tracking
function generateRequestId(): string {
  return `req_${crypto.randomBytes(16).toString('hex')}`;
}

// ============================================================================
// PAYMENTS ENDPOINTS
// ============================================================================

interface PaymentRequest {
  amount: number;
  currency: string;
  blockchain: string;
  recipient: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  blockchain: string;
  recipient: string;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: number;
  confirmedAt?: number;
  txHash?: string;
  metadata?: Record<string, any>;
}

const payments: Map<string, Payment> = new Map();

// POST /v1/payments - Create a new payment
router.post('/v1/payments', verifyApiKey, (req: Request, res: Response) => {
  const { amount, currency, blockchain, recipient, description, metadata } = req.body as PaymentRequest;

  // Validation
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  if (!currency || !blockchain || !recipient) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
  const payment: Payment = {
    id: paymentId,
    amount,
    currency,
    blockchain,
    recipient,
    status: 'pending',
    createdAt: Math.floor(Date.now() / 1000),
    metadata,
  };

  payments.set(paymentId, payment);

  res.status(201).json({
    id: paymentId,
    status: 'pending',
    amount,
    currency,
    blockchain,
    recipient,
    createdAt: payment.createdAt,
  });
});

// GET /v1/payments/:id - Get payment details
router.get('/v1/payments/:id', verifyApiKey, (req: Request, res: Response) => {
  const { id } = req.params;
  const payment = payments.get(id);

  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  res.json(payment);
});

// GET /v1/payments - List all payments
router.get('/v1/payments', verifyApiKey, (req: Request, res: Response) => {
  const { limit = '20', offset = '0' } = req.query;
  const limitNum = Math.min(parseInt(limit as string) || 20, 100);
  const offsetNum = parseInt(offset as string) || 0;

  const allPayments = Array.from(payments.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(offsetNum, offsetNum + limitNum);

  res.json({
    data: allPayments,
    limit: limitNum,
    offset: offsetNum,
    total: payments.size,
  });
});

// ============================================================================
// SETTLEMENTS ENDPOINTS
// ============================================================================

interface SettlementRequest {
  amount: number;
  currency: string;
  bankAccount: string;
  description?: string;
}

interface Settlement {
  id: string;
  amount: number;
  currency: string;
  bankAccount: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  completedAt?: number;
  fee: number;
}

const settlements: Map<string, Settlement> = new Map();

// POST /v1/settlements - Create settlement
router.post('/v1/settlements', verifyApiKey, (req: Request, res: Response) => {
  const { amount, currency, bankAccount, description } = req.body as SettlementRequest;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  if (!currency || !bankAccount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const settlementId = `set_${crypto.randomBytes(8).toString('hex')}`;
  const fee = Math.ceil(amount * 0.001); // 0.1% fee

  const settlement: Settlement = {
    id: settlementId,
    amount,
    currency,
    bankAccount: bankAccount.slice(-4).padStart(bankAccount.length, '*'),
    status: 'processing',
    createdAt: Math.floor(Date.now() / 1000),
    fee,
  };

  settlements.set(settlementId, settlement);

  // Simulate settlement completion after a delay
  setTimeout(() => {
    const existing = settlements.get(settlementId);
    if (existing) {
      existing.status = 'completed';
      existing.completedAt = Math.floor(Date.now() / 1000);
    }
  }, 5000);

  res.status(201).json({
    id: settlementId,
    status: 'processing',
    amount,
    currency,
    fee,
    createdAt: settlement.createdAt,
  });
});

// GET /v1/settlements/:id - Get settlement status
router.get('/v1/settlements/:id', verifyApiKey, (req: Request, res: Response) => {
  const { id } = req.params;
  const settlement = settlements.get(id);

  if (!settlement) {
    return res.status(404).json({ error: 'Settlement not found' });
  }

  res.json(settlement);
});

// ============================================================================
// ACCOUNTS ENDPOINTS
// ============================================================================

interface Account {
  id: string;
  email: string;
  status: 'active' | 'suspended';
  balance: Record<string, number>;
  createdAt: number;
  wallets: string[];
}

interface WalletRequest {
  address: string;
  blockchain: string;
  label?: string;
}

interface Wallet {
  id: string;
  address: string;
  blockchain: string;
  label?: string;
  verified: boolean;
  createdAt: number;
}

const accounts: Map<string, Account> = new Map();
const wallets: Map<string, Wallet> = new Map();

// Mock account for testing (in production, use actual authentication)
const getMockAccount = (apiKey: string): Account => {
  const accountId = `acc_${apiKey.substring(0, 12)}`;
  
  if (!accounts.has(accountId)) {
    const account: Account = {
      id: accountId,
      email: 'merchant@example.com',
      status: 'active',
      balance: { USD: 50000, EUR: 30000, BTC: 0.5 },
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 30,
      wallets: [],
    };
    accounts.set(accountId, account);
  }

  return accounts.get(accountId)!;
};

// GET /v1/accounts/me - Get current account
router.get('/v1/accounts/me', verifyApiKey, (req: Request, res: Response) => {
  const account = getMockAccount((req as any).apiKey);
  const { email, status, balance, createdAt, id } = account;

  res.json({
    id,
    email,
    status,
    balance,
    createdAt,
    walletCount: account.wallets.length,
  });
});

// POST /v1/accounts/me/wallets - Create linked wallet
router.post('/v1/accounts/me/wallets', verifyApiKey, (req: Request, res: Response) => {
  const { address, blockchain, label } = req.body as WalletRequest;

  if (!address || !blockchain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate address format (simplified)
  if (address.length < 26) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  const account = getMockAccount((req as any).apiKey);
  const walletId = `wal_${crypto.randomBytes(8).toString('hex')}`;

  const wallet: Wallet = {
    id: walletId,
    address,
    blockchain,
    label,
    verified: false,
    createdAt: Math.floor(Date.now() / 1000),
  };

  wallets.set(walletId, wallet);
  account.wallets.push(walletId);

  res.status(201).json({
    id: walletId,
    address,
    blockchain,
    label,
    verified: false,
    createdAt: wallet.createdAt,
  });
});

// GET /v1/accounts/me/wallets - List linked wallets
router.get('/v1/accounts/me/wallets', verifyApiKey, (req: Request, res: Response) => {
  const account = getMockAccount((req as any).apiKey);
  const accountWallets = account.wallets
    .map(id => wallets.get(id))
    .filter(Boolean) as Wallet[];

  res.json({
    data: accountWallets,
    total: accountWallets.length,
  });
});

// ============================================================================
// EXCHANGE RATES ENDPOINT
// ============================================================================

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

// GET /v1/rates - Get current exchange rates
router.get('/v1/rates', verifyApiKey, (req: Request, res: Response) => {
  const { from = 'USD', to = 'EUR' } = req.query;

  // Mock rates (in production, fetch from real data source)
  const mockRates: Record<string, Record<string, number>> = {
    USD: { EUR: 0.92, GBP: 0.79, BTC: 0.000024, ETH: 0.00038 },
    EUR: { USD: 1.09, GBP: 0.86, BTC: 0.000026, ETH: 0.00042 },
    BTC: { USD: 42500, EUR: 39100, GBP: 33600 },
    ETH: { USD: 2500, EUR: 2300, GBP: 1975 },
  };

  const rate = mockRates[from as string]?.[to as string];

  if (!rate) {
    return res.status(400).json({
      error: `Exchange rate not available for ${from} to ${to}`,
    });
  }

  res.json({
    from,
    to,
    rate,
    timestamp: Math.floor(Date.now() / 1000),
  });
});

// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================

// GET /v1/health - Health check
router.get('/v1/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Math.floor(Date.now() / 1000),
    version: '1.0.0',
  });
});

// GET /v1/status - System status
router.get('/v1/status', verifyApiKey, (req: Request, res: Response) => {
  const account = getMockAccount((req as any).apiKey);

  res.json({
    accountStatus: account.status,
    paymentsProcessed: payments.size,
    settlementsProcessed: settlements.size,
    linkedWallets: account.wallets.length,
    uptime: 99.99,
    timestamp: Math.floor(Date.now() / 1000),
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for API routes
router.use((req: Request, res: Response) => {
  if (req.path.startsWith('/v1/')) {
    res.status(404).json({
      error: 'Endpoint not found',
      path: req.path,
    });
  }
});

export default router;
