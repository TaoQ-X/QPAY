import Header from "@/components/Header";
import { useState } from "react";
import { ChevronDown, Copy, CheckCircle } from "lucide-react";

export default function Docs() {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

  const copyToClipboard = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(idx);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sections = [
    {
      title: "Getting Started",
      subsections: [
        {
          heading: "Authentication",
          content: `All API requests require authentication via your API key. Include it in the Authorization header:`,
          code: `curl -H "Authorization: Bearer sk_live_xxx" \\
  https://api.qpay.io/v1/payments`,
        },
        {
          heading: "Base URL",
          content: `The Q Pay API base URL is:`,
          code: `https://api.qpay.io/v1`,
        },
        {
          heading: "Content Type",
          content: `All requests and responses use JSON:`,
          code: `Content-Type: application/json`,
        },
      ],
    },
    {
      title: "Payment Methods",
      subsections: [
        {
          heading: "Apple Pay Integration",
          content: `Accept Apple Pay payments with automatic blockchain settlement.`,
          code: `const payment = await qpay.applePayment.create({
  amount: 10000, // in cents
  currency: 'USD',
  blockchain: 'ethereum',
  metadata: {
    orderId: 'order_123'
  }
});`,
        },
        {
          heading: "Google Pay Integration",
          content: `Process Google Pay transactions seamlessly.`,
          code: `const payment = await qpay.googlePayment.create({
  amount: 10000,
  currency: 'USD',
  blockchain: 'polygon',
  supportedNetworks: ['visa', 'mastercard'],
  supportedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS']
});`,
        },
        {
          heading: "Credit Card Processing",
          content: `Accept all major credit cards with PCI-DSS compliance.`,
          code: `const payment = await qpay.card.create({
  card: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123'
  },
  amount: 10000,
  currency: 'USD',
  blockchain: 'ethereum'
});`,
        },
        {
          heading: "Direct Cryptocurrency",
          content: `Accept payments directly in cryptocurrency.`,
          code: `const payment = await qpay.crypto.create({
  blockchain: 'ethereum',
  amount: '0.5',
  currency: 'ETH',
  recipientAddress: '0x742d35Cc6634C0532925a3b844Bc21e529e67e88',
  metadata: {
    orderId: 'order_456'
  }
});`,
        },
      ],
    },
    {
      title: "Payment Processing",
      subsections: [
        {
          heading: "Create Payment Request",
          content: `Initiate a payment request that customers can complete.`,
          code: `POST /v1/payments/request

{
  "amount": 10000,
  "currency": "USD",
  "description": "Order #123",
  "payment_methods": ["apple_pay", "google_pay", "card", "crypto"],
  "blockchain_network": "ethereum",
  "metadata": {
    "customer_id": "cust_123",
    "order_id": "order_123"
  },
  "redirect_url": "https://yoursite.com/success",
  "webhook_url": "https://yoursite.com/webhook"
}`,
        },
        {
          heading: "Retrieve Payment Status",
          content: `Check the status of a payment request.`,
          code: `GET /v1/payments/:payment_id

Response:
{
  "id": "pay_123",
  "status": "completed",
  "amount": 10000,
  "currency": "USD",
  "payment_method": "apple_pay",
  "blockchain_hash": "0x1234...",
  "created_at": "2024-01-17T10:30:00Z",
  "completed_at": "2024-01-17T10:35:00Z"
}`,
        },
        {
          heading: "Process Refund",
          content: `Issue a refund for a completed payment.`,
          code: `POST /v1/payments/:payment_id/refund

{
  "amount": 10000, // optional, full refund if omitted
  "reason": "customer_request",
  "metadata": {
    "support_ticket": "ticket_789"
  }
}`,
        },
      ],
    },
    {
      title: "Webhooks",
      subsections: [
        {
          heading: "Setting Up Webhooks",
          content: `Configure webhooks to receive real-time payment updates.`,
          code: `POST /v1/webhooks

{
  "url": "https://yoursite.com/qpay-webhook",
  "events": [
    "payment.completed",
    "payment.failed",
    "payment.refunded",
    "settlement.processed"
  ],
  "active": true
}`,
        },
        {
          heading: "Webhook Events",
          content: `Listen for these webhook events:`,
          code: `// payment.completed
{
  "event": "payment.completed",
  "data": {
    "payment_id": "pay_123",
    "amount": 10000,
    "blockchain_hash": "0x1234...",
    "timestamp": "2024-01-17T10:35:00Z"
  }
}

// payment.failed
{
  "event": "payment.failed",
  "data": {
    "payment_id": "pay_123",
    "reason": "insufficient_funds",
    "timestamp": "2024-01-17T10:35:00Z"
  }
}`,
        },
        {
          heading: "Webhook Verification",
          content: `Verify webhook authenticity using the signature header.`,
          code: `const crypto = require('crypto');

function verifyWebhookSignature(body, signature, secret) {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return signature === computed;
}`,
        },
      ],
    },
    {
      title: "Settlements",
      subsections: [
        {
          heading: "Configure Settlement",
          content: `Set up automatic settlement to your bank account.`,
          code: `POST /v1/settlements/configure

{
  "frequency": "daily", // daily, weekly, monthly
  "currency": "USD",
  "bank_account": {
    "account_number": "123456789",
    "routing_number": "021000021",
    "account_type": "checking",
    "account_holder": "Business Name"
  },
  "timezone": "America/New_York"
}`,
        },
        {
          heading: "View Settlement History",
          content: `Retrieve settlement records.`,
          code: `GET /v1/settlements?limit=10&offset=0

Response:
[
  {
    "id": "settle_123",
    "amount": 50000,
    "currency": "USD",
    "status": "completed",
    "processed_at": "2024-01-17T14:00:00Z",
    "bank_reference": "TXN123456",
    "transactions_count": 42
  }
]`,
        },
      ],
    },
    {
      title: "Advanced Features",
      subsections: [
        {
          heading: "Recurring Billing",
          content: `Set up recurring payments for subscriptions.`,
          code: `POST /v1/subscriptions

{
  "customer_id": "cust_123",
  "amount": 9900, // $99/month
  "currency": "USD",
  "interval": "month", // day, week, month, year
  "payment_method": "card",
  "metadata": {
    "plan_id": "plan_pro"
  }
}`,
        },
        {
          heading: "Multi-Currency Conversion",
          content: `Convert payments to any supported currency.`,
          code: `POST /v1/payments/convert

{
  "from_amount": 10000,
  "from_currency": "USD",
  "to_currency": "EUR",
  "quote_only": false
}

Response:
{
  "from_amount": 10000,
  "from_currency": "USD",
  "to_amount": 9250,
  "to_currency": "EUR",
  "rate": 0.925,
  "fee": 150
}`,
        },
        {
          heading: "API Rate Limits",
          content: `Check your current rate limit usage.`,
          code: `Response headers include:

X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705505400

// Starter: 100 req/min
// Professional: 1000 req/min
// Enterprise: Unlimited`,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
            API Documentation
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Complete integration guides for all payment methods and blockchains
          </p>
        </div>
      </section>

      {/* Documentation */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-muted/30 rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Documentation</h3>
              <nav className="space-y-2">
                {sections.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => setExpandedSection(idx)}
                    className={`w-full text-left px-4 py-2 rounded text-sm transition-all ${
                      expandedSection === idx
                        ? "bg-primary text-white font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-white"
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {sections.map((section, sectionIdx) => (
              <div
                key={sectionIdx}
                className={expandedSection === sectionIdx ? "block" : "hidden"}
              >
                <h2 className="text-3xl font-bold text-foreground mb-8">
                  {section.title}
                </h2>

                <div className="space-y-8">
                  {section.subsections.map((sub, subIdx) => {
                    const codeIdx = sectionIdx * 10 + subIdx;
                    return (
                      <div
                        key={subIdx}
                        className="bg-white border border-border rounded-xl p-8"
                      >
                        <h3 className="text-xl font-semibold text-foreground mb-4">
                          {sub.heading}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          {sub.content}
                        </p>

                        <div className="bg-muted/30 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between bg-muted px-4 py-3 border-b border-border">
                            <span className="text-sm font-semibold text-muted-foreground">
                              Code Example
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(sub.code, codeIdx)
                              }
                              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-all"
                            >
                              {copiedCode === codeIdx ? (
                                <>
                                  <CheckCircle size={16} />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={16} />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-sm text-muted-foreground font-mono bg-muted/10">
                            {sub.code}
                          </pre>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDK Info */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">
            Official SDKs
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "JavaScript/TypeScript",
                code: `npm install @qpay/sdk`,
                link: "https://github.com/qpay/js-sdk",
              },
              {
                name: "Python",
                code: `pip install qpay`,
                link: "https://github.com/qpay/python-sdk",
              },
              {
                name: "Ruby",
                code: `gem install qpay`,
                link: "https://github.com/qpay/ruby-sdk",
              },
            ].map((sdk, idx) => (
              <div key={idx} className="bg-white border border-border rounded-xl p-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {sdk.name}
                </h3>
                <div className="bg-muted p-4 rounded mb-4">
                  <pre className="text-sm font-mono text-muted-foreground overflow-x-auto">
                    {sdk.code}
                  </pre>
                </div>
                <a
                  href={sdk.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm font-semibold"
                >
                  View on GitHub →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-12 text-center">
            Need Help?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "API Reference",
                description: "Complete endpoint documentation",
                cta: "View Reference",
              },
              {
                title: "Code Examples",
                description: "Integration examples in multiple languages",
                cta: "Browse Examples",
              },
              {
                title: "Support",
                description: "Get help from our developer team",
                cta: "Contact Support",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-border rounded-xl p-8 text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {item.description}
                </p>
                <a
                  href="#"
                  className="text-primary hover:underline text-sm font-semibold"
                >
                  {item.cta} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>© 2024 Q Pay. API v1.0</p>
        </div>
      </footer>
    </div>
  );
}
