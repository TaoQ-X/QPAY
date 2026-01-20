import Header from "@/components/Header";
import {
  CreditCard,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Lock,
  Cpu,
  ArrowRight,
  CheckCircle,
  Apple,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Features() {
  const paymentMethods = [
    {
      name: "Apple Pay",
      icon: Apple,
      description: "Native iOS payment integration",
      features: ["Instant checkout", "Biometric authentication", "Wallet integration"],
    },
    {
      name: "Google Pay",
      icon: Smartphone,
      description: "Android & Web payment solution",
      features: ["One-tap payment", "Multiple cards support", "Device security"],
    },
    {
      name: "Credit Cards",
      icon: CreditCard,
      description: "Visa, Mastercard, Amex",
      features: ["3D Secure", "Tokenization", "Recurring billing"],
    },
  ];

  const blockchainNetworks = [
    {
      name: "Bitcoin",
      symbol: "BTC",
      speed: "~10 min",
      fee: "Variable",
      description: "Store of value cryptocurrency",
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      speed: "~12 sec",
      fee: "Low",
      description: "Smart contract platform",
    },
    {
      name: "Polygon",
      symbol: "MATIC",
      speed: "~2 sec",
      fee: "Minimal",
      description: "Layer 2 solution for Ethereum",
    },
    {
      name: "Solana",
      symbol: "SOL",
      speed: "~400ms",
      fee: "Minimal",
      description: "High-speed blockchain",
    },
    {
      name: "USDC",
      symbol: "USDC",
      speed: "~12 sec",
      fee: "Low",
      description: "USD stablecoin (multi-chain)",
    },
    {
      name: "USDT",
      symbol: "USDT",
      speed: "~12 sec",
      fee: "Low",
      description: "USD stablecoin",
    },
  ];

  const coreFeatures = [
    {
      icon: Zap,
      title: "Instant Payments",
      description: "Process payments in seconds with blockchain confirmation",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption, multi-sig wallets, cold storage",
    },
    {
      icon: Lock,
      title: "Compliance Ready",
      description: "KYC/AML verification, PCI-DSS certified, audit trails",
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Accept payments from 190+ countries instantly",
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Dashboard with transaction insights and reporting",
    },
    {
      icon: Cpu,
      title: "AI-Powered",
      description: "Automated compliance, fraud detection, optimization",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
              Powerful Features for Modern Payments
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Accept any payment method. Support multiple blockchains. Built for enterprise scale.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-16 text-center">
            Enterprise Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                    <Icon className="w-6 h-6 text-primary group-hover:text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Payment Methods Integration */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-4 text-center">
            Payment Methods
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Accept all major payment methods integrated with blockchain settlement
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {paymentMethods.map((method, idx) => {
              const Icon = method.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-border rounded-xl p-8 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {method.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {method.features.map((feature, fidx) => (
                      <li
                        key={fidx}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Technical Integration Details */}
          <div className="bg-white border border-border rounded-xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6">
              Technical Integration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Apple className="w-5 h-5 text-primary" />
                  Apple Pay Implementation
                </h4>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                  {`import ApplePay from '@blockpay/apple-pay';

const applePayHandler = new ApplePay({
  businessId: 'biz_xxx',
  apiKey: 'sk_live_xxx'
});

await applePayHandler.requestPayment({
  amount: 10000,
  currency: 'USD',
  blockchain: 'ethereum'
});`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-secondary" />
                  Google Pay Implementation
                </h4>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                  {`import GooglePay from '@blockpay/google-pay';

const googlePayHandler = new GooglePay({
  businessId: 'biz_xxx',
  apiKey: 'sk_live_xxx'
});

await googlePayHandler.requestPayment({
  amount: 10000,
  currency: 'USD',
  blockchain: 'polygon'
});`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent" />
                  Credit Card Processing
                </h4>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                  {`import BlockPay from '@blockpay/sdk';

const blockpay = new BlockPay(apiKey);

const payment = await blockpay.processCard({
  cardNumber: '4242424242424242',
  expiry: '12/25',
  cvc: '123',
  amount: 10000,
  currency: 'USD'
});`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Cryptocurrency Direct
                </h4>
                <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                  {`import BlockPay from '@blockpay/sdk';

const blockpay = new BlockPay(apiKey);

const payment = await blockpay.processCrypto({
  blockchain: 'ethereum',
  amount: '0.5',
  currency: 'ETH',
  recipientAddress: '0x...'
});`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blockchain Networks */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-16 text-center">
            Supported Blockchains
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blockchainNetworks.map((network, idx) => (
              <div
                key={idx}
                className="border border-border rounded-lg p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {network.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {network.symbol}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {network.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confirmation:</span>
                    <span className="font-semibold text-foreground">
                      {network.speed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees:</span>
                    <span className="font-semibold text-accent">
                      {network.fee}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-foreground mb-16 text-center">
            Advanced Capabilities
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Multi-Currency Settlement",
                items: [
                  "Convert any payment to 50+ fiat currencies",
                  "Real-time exchange rates",
                  "Minimal conversion fees",
                  "Direct bank account deposits",
                ],
              },
              {
                title: "Recurring Billing",
                items: [
                  "Automated subscription management",
                  "Flexible billing cycles",
                  "Dunning management",
                  "Revenue optimization",
                ],
              },
              {
                title: "Dispute & Chargeback Management",
                items: [
                  "Automated dispute detection",
                  "Evidence submission",
                  "Appeal workflows",
                  "Insurance coverage options",
                ],
              },
              {
                title: "White-Label Solutions",
                items: [
                  "Custom branding",
                  "Your domain checkout",
                  "Custom API endpoints",
                  "Private integrations",
                ],
              },
            ].map((section, idx) => (
              <div
                key={idx}
                className="bg-white border border-border rounded-xl p-8"
              >
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.items.map((item, itemIdx) => (
                    <li
                      key={itemIdx}
                      className="flex items-start gap-3 text-muted-foreground"
                    >
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Ready to Integrate?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get started with our comprehensive API and SDKs in minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register/sme"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <a
              href="#docs"
              className="bg-white border border-border text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-muted transition-all"
            >
              View Integration Guides
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>© 2024 BlockPay. All payment methods and blockchains supported.</p>
        </div>
      </footer>
    </div>
  );
}
