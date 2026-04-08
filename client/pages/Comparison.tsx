import Header from "@/components/Header";
import { Check, X, Info } from "lucide-react";

interface Feature {
  category: string;
  items: {
    name: string;
    qpay: string | boolean;
    stripe: string | boolean;
    paypal: string | boolean;
    note?: string;
  }[];
}

export default function Comparison() {
  const features: Feature[] = [
    {
      category: "Pricing & Fees",
      items: [
        {
          name: "Transaction Fee (Cards)",
          qpay: "2.9% + $0.30",
          stripe: "2.9% + $0.30",
          paypal: "3.49% + $0.49",
        },
        {
          name: "Monthly Fee",
          qpay: "Free",
          stripe: "Free",
          paypal: "Free",
        },
        {
          name: "Setup Fee",
          qpay: "Free",
          stripe: "Free",
          paypal: "Free",
        },
        {
          name: "Cryptocurrency Support",
          qpay: true,
          stripe: false,
          paypal: false,
          note: "QP ay charges 0% for crypto",
        },
        {
          name: "Wallet Support",
          qpay: "2.5%",
          stripe: "2.9%",
          paypal: "3.49%",
        },
        {
          name: "Bank Transfer Fees",
          qpay: "1.5%",
          stripe: "2.2%",
          paypal: "2.5%",
        },
      ],
    },
    {
      category: "Payment Methods",
      items: [
        {
          name: "Supported Currencies",
          qpay: "47+",
          stripe: "135+",
          paypal: "100+",
        },
        {
          name: "Cryptocurrency (Bitcoin, ETH)",
          qpay: true,
          stripe: false,
          paypal: false,
        },
        {
          name: "Apple Pay & Google Pay",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "Regional Payment Methods",
          qpay: "24",
          stripe: "40+",
          paypal: "30+",
        },
        {
          name: "Bank Transfers (ACH, SEPA)",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "Local Wallets (Direct Integration)",
          qpay: true,
          stripe: true,
          paypal: true,
        },
      ],
    },
    {
      category: "Settlement & Payouts",
      items: [
        {
          name: "Standard Settlement Time",
          qpay: "1-2 business days",
          stripe: "2-3 business days",
          paypal: "1-2 business days",
        },
        {
          name: "Express Settlement",
          qpay: "< 4 hours (0.5%)",
          stripe: "1 day ($10-20)",
          paypal: "4 hours ($5-10)",
        },
        {
          name: "Cryptocurrency Payouts",
          qpay: "30 minutes",
          stripe: "N/A",
          paypal: "N/A",
        },
        {
          name: "Settlement Transparency",
          qpay: "Real-time dashboard",
          stripe: "Real-time dashboard",
          paypal: "Real-time dashboard",
        },
        {
          name: "Multi-Account Settlement",
          qpay: true,
          stripe: true,
          paypal: false,
        },
      ],
    },
    {
      category: "Developer Experience",
      items: [
        {
          name: "API Documentation",
          qpay: "Excellent (interactive)",
          stripe: "Excellent",
          paypal: "Good",
        },
        {
          name: "SDKs Available",
          qpay: "6+ languages",
          stripe: "10+ languages",
          paypal: "8+ languages",
        },
        {
          name: "Webhooks",
          qpay: "Real-time + HMAC",
          stripe: "Real-time + signing",
          paypal: "Real-time + signing",
        },
        {
          name: "Testing/Sandbox",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "API Rate Limits",
          qpay: "1000 req/min",
          stripe: "100 req/s",
          paypal: "High (not disclosed)",
        },
        {
          name: "Developer Support",
          qpay: "24/7 live chat",
          stripe: "Community + support",
          paypal: "Community + support",
        },
      ],
    },
    {
      category: "Security & Compliance",
      items: [
        {
          name: "PCI-DSS Certification",
          qpay: "Level 1",
          stripe: "Level 1",
          paypal: "Level 1",
        },
        {
          name: "SOC 2 Type II",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "GDPR Compliant",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "Fraud Detection (AI)",
          qpay: "Advanced ML",
          stripe: "Good (Radar)",
          paypal: "Standard",
        },
        {
          name: "3D Secure 2.0",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "Encryption Standards",
          qpay: "AES-256-GCM",
          stripe: "AES-256",
          paypal: "AES-128",
        },
      ],
    },
    {
      category: "Features & Tools",
      items: [
        {
          name: "Subscription/Recurring Billing",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "Dispute Management",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "Advanced Analytics",
          qpay: true,
          stripe: "Limited (Sigma)",
          paypal: "Limited",
        },
        {
          name: "Webhooks (Events)",
          qpay: "15+ events",
          stripe: "25+ events",
          paypal: "12+ events",
        },
        {
          name: "AI Recommendations",
          qpay: true,
          stripe: false,
          paypal: false,
        },
        {
          name: "Rate Limiting (Custom Rules)",
          qpay: true,
          stripe: true,
          paypal: false,
        },
        {
          name: "Marketplace Features",
          qpay: true,
          stripe: "Connect (separate)",
          paypal: "For Partners",
        },
      ],
    },
    {
      category: "Customer Experience",
      items: [
        {
          name: "Checkout Page Load Time",
          qpay: "< 500ms",
          stripe: "< 700ms",
          paypal: "< 600ms",
        },
        {
          name: "Express Checkout",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "Guest Checkout",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "Mobile Optimization",
          qpay: true,
          stripe: true,
          paypal: true,
        },
        {
          name: "One-Click Payments",
          qpay: true,
          stripe: true,
          paypal: "Limited",
        },
      ],
    },
    {
      category: "Support & Community",
      items: [
        {
          name: "Live Chat Support",
          qpay: "24/7",
          stripe: "Limited hours",
          paypal: "Limited hours",
        },
        {
          name: "Email Support",
          qpay: "< 2 hours response",
          stripe: "< 24 hours",
          paypal: "< 24 hours",
        },
        {
          name: "Phone Support",
          qpay: "24/7 for urgent",
          stripe: "Enterprise only",
          paypal: "Enterprise only",
        },
        {
          name: "Developer Community",
          qpay: "Active forum",
          stripe: "Large community",
          paypal: "Large community",
        },
      ],
    },
  ];

  const renderCell = (value: string | boolean | undefined, processor: string) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-400 mx-auto" />
      );
    }
    return <span className="text-sm text-gray-700">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How QPay Compares</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See why leading merchants choose QPay over traditional payment processors
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {features.map((featureGroup, groupIndex) => (
            <div key={groupIndex} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{featureGroup.category}</h2>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10 w-48">
                        Feature
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-blue-600">
                        <div className="text-lg">🅺</div>
                        <div className="text-xs">QPay</div>
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-600">
                        <div className="text-lg">⬜</div>
                        <div className="text-xs">Stripe</div>
                      </th>
                      <th className="text-center py-4 px-6 font-semibold text-gray-600">
                        <div className="text-lg">🅿️</div>
                        <div className="text-xs">PayPal</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureGroup.items.map((item, itemIndex) => (
                      <tr key={itemIndex} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-6 sticky left-0 bg-white font-medium text-gray-900 z-10">
                          <div className="flex items-center gap-2">
                            {item.name}
                            {item.note && (
                              <div className="group relative">
                                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-20">
                                  {item.note}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center bg-blue-50">
                          {renderCell(item.qpay, "qpay")}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {renderCell(item.stripe, "stripe")}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {renderCell(item.paypal, "paypal")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Key Advantages */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Why Choose QPay?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">💰 Better Pricing</h3>
              <p className="text-gray-700 mb-4">
                Save up to 35% on processing fees with our transparent pricing. No hidden fees, no long-term contracts.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Lowest card fees in the industry</li>
                <li>✓ Free cryptocurrency processing</li>
                <li>✓ Cheaper international payments</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🚀 Innovation</h3>
              <p className="text-gray-700 mb-4">
                Built with modern tech stack. AI-powered fraud detection, instant settlements, and advanced analytics.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ AI-powered recommendations</li>
                <li>✓ Crypto payment support</li>
                <li>✓ Real-time insights</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🤝 Better Support</h3>
              <p className="text-gray-700 mb-4">
                Get help when you need it. 24/7 live chat, phone support, and dedicated account managers.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ 24/7 phone support</li>
                <li>✓ Less than 2 hour email response</li>
                <li>✓ Dedicated success team</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🔒 Security First</h3>
              <p className="text-gray-700 mb-4">
                Enterprise-grade security with PCI-DSS Level 1 and SOC 2 Type II certification.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✓ Military-grade encryption</li>
                <li>✓ AI fraud detection</li>
                <li>✓ 99.9% uptime SLA</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Switch?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Migration is simple and fast. Our team handles everything. You could be live in 24 hours.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/register/sme"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Start Free Trial
            </a>
            <a
              href="/contact"
              className="bg-white border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Schedule Migration
            </a>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center text-sm text-gray-600">
          <p>
            Comparison accurate as of {new Date().toLocaleDateString()}. Pricing and features subject to change.
            Please visit official websites for the most up-to-date information.
          </p>
        </div>
      </section>
    </div>
  );
}
